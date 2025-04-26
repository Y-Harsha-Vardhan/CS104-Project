// Game state
export let currentMatch = {
    team1: '',
    team2: '',
    tossWinner: '',
    tossDecision: '',
    innings: 1,
    currentBattingTeam: '',
    currentBowlingTeam: '',
    overs: 2,
    balls: 0,
    totalRuns: 0,
    wickets: 0,
    batters: [],
    bowlers: [],
    currentStriker: null,
    currentNonStriker: null,
    currentBowler: null,
    extras: 0,
    allOut: false,
    firstInningsTotal: 0,
    commentary: [],
    matchComplete: false,
    extrasBreakdown: {
        wides: 0,
        noballs: 0,
        byes: 0,
        legbyes: 0
    },
    freeHit: false
};

export let matchHistory = [];

// Load match data from localStorage
export function loadMatchData() {
    const savedCurrentMatch = localStorage.getItem('currentCricketMatch');
    const savedMatchHistory = localStorage.getItem('cricketMatchHistory');
    
    if (savedCurrentMatch) {
        currentMatch = JSON.parse(savedCurrentMatch);
    }
    
    if (savedMatchHistory) {
        matchHistory = JSON.parse(savedMatchHistory);
    }
}

// Save match data to localStorage
export function saveMatchData() {
    localStorage.setItem('currentCricketMatch', JSON.stringify(currentMatch));
    localStorage.setItem('cricketMatchHistory', JSON.stringify(matchHistory));
}

// Add runs to the score
export function addRuns(runs) {
    if (currentMatch.allOut || currentMatch.matchComplete || 
        currentMatch.balls >= currentMatch.overs * 6) return;
    
    // Update batter stats
    currentMatch.batters[currentMatch.currentStriker].runs += runs;
    currentMatch.batters[currentMatch.currentStriker].balls++;
    
    if (runs === 4) currentMatch.batters[currentMatch.currentStriker].fours++;
    if (runs === 6) currentMatch.batters[currentMatch.currentStriker].sixes++;
    
    // Update bowler stats
    currentMatch.bowlers[currentMatch.currentBowler].runs += runs;
    
    // Only count as a ball if not a free hit (unless it's a wicket)
    if (!currentMatch.freeHit) {
        currentMatch.bowlers[currentMatch.currentBowler].balls++;
    }
    
    // Update match stats
    currentMatch.totalRuns += runs;
    
    if (!currentMatch.freeHit) {
        currentMatch.balls++;
    } else {
        // Free hit is over after this ball
        currentMatch.freeHit = false;
    }
    
    // Rotate strike for odd runs
    if (runs % 2 !== 0) {
        [currentMatch.currentStriker, currentMatch.currentNonStriker] = 
            [currentMatch.currentNonStriker, currentMatch.currentStriker];
    }
    
    // Check for over completion
    if (currentMatch.balls % 6 === 0 && currentMatch.balls > 0) {
        // Rotate strike at the end of the over
        [currentMatch.currentStriker, currentMatch.currentNonStriker] = 
            [currentMatch.currentNonStriker, currentMatch.currentStriker];
        
        // Update bowler's overs
        currentMatch.bowlers[currentMatch.currentBowler].overs = 
            Math.floor(currentMatch.bowlers[currentMatch.currentBowler].balls / 6);
        
        // Check for maiden over (no runs conceded in the over)
        const overRuns = currentMatch.commentary
            .filter(c => c.bowler === currentMatch.bowlers[currentMatch.currentBowler].name)
            .slice(-6)
            .reduce((sum, ball) => sum + (typeof ball.event === 'number' ? ball.event : 0), 0);
        
        if (overRuns === 0) {
            currentMatch.bowlers[currentMatch.currentBowler].maidens++;
        }
    }
    
    // Add commentary
    addCommentary(runs);
    
    // Check for match completion
    return checkMatchCompletion();
}

// Record a wicket
export function takeWicket(method = 'bowled', runsBeforeOut = 0, batterIndex = null) {
    if (currentMatch.allOut || currentMatch.matchComplete || 
        currentMatch.wickets >= 10 || currentMatch.balls >= currentMatch.overs * 6) return;
    
    const batterOut = batterIndex !== null ? batterIndex : currentMatch.currentStriker;
    
    // Update bowler stats (unless run out)
    if (method !== 'runout') {
        currentMatch.bowlers[currentMatch.currentBowler].wickets++;
    }
    
    // Only count as a ball if not a free hit
    if (!currentMatch.freeHit) {
        currentMatch.bowlers[currentMatch.currentBowler].balls++;
        currentMatch.balls++;
    } else {
        // Wicket doesn't count on free hit
        currentMatch.freeHit = false;
    }
    
    // Update match stats
    currentMatch.wickets++;
    
    // Mark batter as out
    currentMatch.batters[batterOut].out = true;
    currentMatch.batters[batterOut].howOut = method === 'runout' ? 
        `run out (${runsBeforeOut} runs)` : 
        `b ${currentMatch.bowlers[currentMatch.currentBowler].name}`;
    
    // Add runs completed before runout
    if (method === 'runout' && runsBeforeOut > 0) {
        currentMatch.totalRuns += runsBeforeOut;
        currentMatch.bowlers[currentMatch.currentBowler].runs += runsBeforeOut;
        
        // Add runs to the batters (split between striker and non-striker)
        const strikerRuns = Math.min(runsBeforeOut, currentMatch.batters[currentMatch.currentStriker].runs);
        const nonStrikerRuns = runsBeforeOut - strikerRuns;
        
        currentMatch.batters[currentMatch.currentStriker].runs += strikerRuns;
        currentMatch.batters[currentMatch.currentNonStriker].runs += nonStrikerRuns;
    }
    
    // Add commentary
    addCommentary(method === 'runout' ? 'RO' : 'W', runsBeforeOut);
    
    // Check if all out
    if (currentMatch.wickets >= 10) {
        currentMatch.allOut = true;
        return checkMatchCompletion();
    }
    
    // Check for over completion
    if (currentMatch.balls % 6 === 0 && currentMatch.balls > 0) {
        // Rotate strike at the end of the over
        [currentMatch.currentStriker, currentMatch.currentNonStriker] = 
            [currentMatch.currentNonStriker, currentMatch.currentStriker];
        
        // Update bowler's overs
        currentMatch.bowlers[currentMatch.currentBowler].overs = 
            Math.floor(currentMatch.bowlers[currentMatch.currentBowler].balls / 6);
    }
    
    return checkMatchCompletion();
}

// Add extras to the score
export function addExtra(type) {
    if (currentMatch.allOut || currentMatch.matchComplete || 
        currentMatch.balls >= currentMatch.overs * 6) return;
    
    let runsToAdd = 1;
    
    switch (type) {
        case 'wide':
            currentMatch.extrasBreakdown.wides++;
            break;
        case 'noball':
            currentMatch.extrasBreakdown.noballs++;
            currentMatch.freeHit = true; // Next ball is a free hit
            break;
        case 'bye':
            currentMatch.extrasBreakdown.byes++;
            runsToAdd = prompt('Enter bye runs:', 1) || 1;
            break;
        case 'legbye':
            currentMatch.extrasBreakdown.legbyes++;
            runsToAdd = prompt('Enter leg bye runs:', 1) || 1;
            break;
    }
    
    // Update match stats
    currentMatch.extras += runsToAdd;
    currentMatch.totalRuns += runsToAdd;
    currentMatch.bowlers[currentMatch.currentBowler].runs += runsToAdd;
    
    // Wides and no-balls count as extras but not as balls
    if (type !== 'wide' && type !== 'noball') {
        currentMatch.bowlers[currentMatch.currentBowler].balls++;
        currentMatch.balls++;
    }
    
    // Add commentary
    addCommentary(type.toUpperCase(), runsToAdd);
    
    // Check for over completion
    if (currentMatch.balls % 6 === 0 && currentMatch.balls > 0) {
        // Update bowler's overs
        currentMatch.bowlers[currentMatch.currentBowler].overs = 
            Math.floor(currentMatch.bowlers[currentMatch.currentBowler].balls / 6);
    }
    
    return checkMatchCompletion();
}

// Add commentary entry
export function addCommentary(event, runsBeforeOut = 0) {
    const over = Math.floor(currentMatch.balls / 6);
    const ball = (currentMatch.balls % 6) + 1;
    const bowler = currentMatch.bowlers[currentMatch.currentBowler].name;
    const batter = currentMatch.batters[currentMatch.currentStriker].name;
    
    let description = '';
    let runsAtWicket = currentMatch.totalRuns;
    
    switch (event) {
        case 'W':
            description = 'Wicket!';
            break;
        case 'RO':
            description = `Run out (${runsBeforeOut} runs)`;
            runsAtWicket = currentMatch.totalRuns - runsBeforeOut;
            break;
        case 'WD':
            description = 'Wide';
            break;
        case 'NB':
            description = 'No ball + free hit';
            break;
        case 'B':
            description = `${runsBeforeOut} bye${runsBeforeOut !== 1 ? 's' : ''}`;
            break;
        case 'LB':
            description = `${runsBeforeOut} leg bye${runsBeforeOut !== 1 ? 's' : ''}`;
            break;
        default:
            description = `${event} run${event !== 1 ? 's' : ''}`;
    }
    
    const commentaryEntry = {
        over,
        ball,
        bowler,
        batter,
        event,
        description,
        runsAtWicket,
        text: `${over}.${ball} ${bowler} to ${batter}, ${description}`
    };
    
    currentMatch.commentary.push(commentaryEntry);
}

// Check if match/innings is complete
export function checkMatchCompletion() {
    // First innings complete conditions
    if (currentMatch.innings === 1 && 
        (currentMatch.balls >= currentMatch.overs * 6 || // All overs completed
         currentMatch.allOut ||                         // All out
         currentMatch.wickets >= 10)) {                // All wickets fallen
        
        // Store first innings total
        currentMatch.firstInningsTotal = currentMatch.totalRuns;
        
        // Switch to second innings
        currentMatch.innings = 2;
        currentMatch.balls = 0;
        currentMatch.totalRuns = 0;
        currentMatch.wickets = 0;
        currentMatch.allOut = false;
        currentMatch.batters = [];
        currentMatch.currentStriker = null;
        currentMatch.currentNonStriker = null;
        
        // Swap batting and bowling teams
        [currentMatch.currentBattingTeam, currentMatch.currentBowlingTeam] = 
            [currentMatch.currentBowlingTeam, currentMatch.currentBattingTeam];
        
        saveMatchData();
        return false; // Match not fully complete yet
    }
    
    // Second innings complete conditions
    if (currentMatch.innings === 2 && 
        (currentMatch.balls >= currentMatch.overs * 6 ||     // All overs completed
         currentMatch.allOut ||                             // All out
         currentMatch.wickets >= 10 ||                      // All wickets fallen
         currentMatch.totalRuns > currentMatch.firstInningsTotal)) { // Target chased
        
        currentMatch.matchComplete = true;
        matchHistory.push(JSON.parse(JSON.stringify(currentMatch)));
        saveMatchData();
        return true; // Match fully complete
    }
    
    return false; // Match still in progress
}