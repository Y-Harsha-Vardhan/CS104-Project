function startMatch() {

    //Assigning variables to the team1 and team2 names, toss-winner, toss-decision and error messages
    const team1 = document.getElementById("team1").value;
    const team2 = document.getElementById("team2").value;
    const tossWinner = document.getElementById("toss-winner").value;
    const tossDecision = document.getElementById("toss-decision").value;
    let errorMessage_1 = document.getElementById("error-message-1");
    let errorMessage_2 = document.getElementById("error-message-2");

    //Resetting error messages initially to hidden
    errorMessage_1.style.visibility = "hidden";
    errorMessage_2.style.visibility = "hidden";

    //Using a conditional to display error message when required
    if(!team1) {errorMessage_1.style.visibility = "visible"; return;}

    if(!team2) {errorMessage_2.style.visibility = "visible"; return;}

    if(team1==team2) { alert("Both teams cannot be the same. Please enter different teams."); return;}
    
    //Storing the setup data in matchData object
    const matchData = {
        team1: team1,
        team2: team2,
        tossWinner: tossWinner === "team1" ? team1 : team2,
        tossDecision: tossDecision
    };
    
    //This stores the matchData object in browser's local storage by converting it into a JSON string
    //This information is not lost if the page is refreshed or closed
    localStorage.setItem("matchData", JSON.stringify(matchData));

    //Redirecting the user to live.html page, within the same website
    window.location.href = "live.html";
}

//Declaring all the global variables
//Global variables
let matchData = {
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
    commentary: []
};

//DOM elements are assigned to variables using their id
const scoreDisplay = document.getElementById('score-display');
const battersTable = document.getElementById('batters-table').querySelector('tbody');
const bowlerTable = document.getElementById('bowler-table').querySelector('tbody');
const runButtons = document.querySelectorAll('.run-btn');
const wicketButton = document.getElementById('wicket-btn');
const scorecardButton = document.getElementById('scorecard-btn');
const modal = document.getElementById('name-prompt-modal');
const modalTitle = document.getElementById('modal-title');
const nameInputs = document.getElementById('name-inputs');
const submitNamesButton = document.getElementById('submit-names');
const crrRrrDisplay = document.getElementById('crr-rrr-display');
const currentOverDisplay = document.getElementById('current-over-display');

//Initializing the app using loadMatchData(); setupEventListeners(); and promptForPlayerNames() functions
document.addEventListener('DOMContentLoaded', function() {
    loadMatchData();
    setupEventListeners();
    promptForPlayerNames();
});

//This function gets the match data that is stored as 'cricketMatchData' in the localStorage
//It then uses this data to call updateMatchData() function 
function loadMatchData() {
    const savedData = localStorage.getItem('cricketMatchData');
    if (savedData) {
        matchData = JSON.parse(savedData);
        updateMatchTitle();
    }
}

//This function contains all the processes that happen when a button is clicked
//It calls addRuns() when a specific run button is clicked
//It calls takeWicket() when the wicket button is clicked
//It redirects to scorecard.html, when scorecard button is clicked
//It calls submitPlayerNames() when the submit names button is clicked in the modal that appears when the page is first loaded
function setupEventListeners() {
    //for run buttons
    runButtons.forEach(button => {
        button.addEventListener('click', function() {
            const runs = parseInt(this.getAttribute('data-runs'));
            addRuns(runs);
        });
    });

    //for wicket button
    wicketButton.addEventListener('click', function() {
        takeWicket();
    });

    //for scorecard button
    scorecardButton.addEventListener('click', function() {
        window.location.href = 'scorecard.html';
    });

    //for submit names button
    submitNamesButton.addEventListener('click', function() {
        submitPlayerNames();
    });
}

function promptForPlayerNames() {
    if (matchData.innings === 1 && matchData.batters.length === 0) {
        // First innings, first time
        showNamePrompt(['Strike Batter', 'Non-Strike Batter', 'Bowler']);
    } else if (matchData.innings === 2 && matchData.batters.length === 2) {
        // Second innings, need to prompt for new batters but same bowlers
        showNamePrompt(['Strike Batter', 'Non-Strike Batter']);
    }
}

function showNamePrompt(fields) {
    modal.style.display = 'flex';
    nameInputs.innerHTML = '';
    
    fields.forEach(field => {
        const label = document.createElement('label');
        label.textContent = field + ':';
        nameInputs.appendChild(label);
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Enter ${field} name`;
        input.id = field.toLowerCase().replace(' ', '-');
        nameInputs.appendChild(input);
    });
    
    modalTitle.textContent = fields.length === 3 ? 'Enter Starting Players' : 'Enter New Batters';
}

function submitPlayerNames() {
    if (matchData.innings === 1 && matchData.batters.length === 0) {
        // First innings, first time
        const strikeBatter = document.getElementById('strike-batter').value;
        const nonStrikeBatter = document.getElementById('non-strike-batter').value;
        const bowler = document.getElementById('bowler').value;
        
        if (strikeBatter && nonStrikeBatter && bowler) {
            matchData.currentBattingTeam = matchData.tossDecision === 'bat' ? matchData.tossWinner : 
                                         (matchData.tossWinner === matchData.team1 ? matchData.team2 : matchData.team1);
            matchData.currentBowlingTeam = matchData.currentBattingTeam === matchData.team1 ? matchData.team2 : matchData.team1;
            
            matchData.batters = [
                { name: strikeBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
                { name: nonStrikeBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false }
            ];
            
            matchData.bowlers = [
                { name: bowler, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 }
            ];
            
            matchData.currentStriker = 0;
            matchData.currentNonStriker = 1;
            matchData.currentBowler = 0;
            
            saveMatchData();
            modal.style.display = 'none';
            updateDisplay();
        }
    } else if (matchData.innings === 2 && matchData.batters.length === 2) {
        // Second innings, new batters
        const strikeBatter = document.getElementById('strike-batter').value;
        const nonStrikeBatter = document.getElementById('non-strike-batter').value;
        
        if (strikeBatter && nonStrikeBatter) {
            matchData.currentBattingTeam = matchData.tossDecision === 'bat' ? 
                                         (matchData.tossWinner === matchData.team1 ? matchData.team2 : matchData.team1) : 
                                         matchData.tossWinner;
            matchData.currentBowlingTeam = matchData.currentBattingTeam === matchData.team1 ? matchData.team2 : matchData.team1;
            
            matchData.batters = [
                { name: strikeBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
                { name: nonStrikeBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false }
            ];
            
            matchData.currentStriker = 0;
            matchData.currentNonStriker = 1;
            
            saveMatchData();
            modal.style.display = 'none';
            updateDisplay();
        }
    }
}

function addRuns(runs) {
    if (matchData.allOut || matchData.balls >= matchData.overs * 6) return;
    
    // Update batter stats
    matchData.batters[matchData.currentStriker].runs += runs;
    matchData.batters[matchData.currentStriker].balls++;
    
    if (runs === 4) matchData.batters[matchData.currentStriker].fours++;
    if (runs === 6) matchData.batters[matchData.currentStriker].sixes++;
    
    // Update bowler stats
    matchData.bowlers[matchData.currentBowler].runs += runs;
    matchData.bowlers[matchData.currentBowler].balls++;
    
    // Update match stats
    matchData.totalRuns += runs;
    matchData.balls++;
    
    // Rotate strike for odd runs
    if (runs % 2 !== 0) {
        [matchData.currentStriker, matchData.currentNonStriker] = [matchData.currentNonStriker, matchData.currentStriker];
    }
    
    // Check for over completion
    if (matchData.balls % 6 === 0) {
        // Rotate strike at the end of the over
        [matchData.currentStriker, matchData.currentNonStriker] = [matchData.currentNonStriker, matchData.currentStriker];
        
        // Update bowler's overs
        matchData.bowlers[matchData.currentBowler].overs = Math.floor(matchData.bowlers[matchData.currentBowler].balls / 6);
        
        // Prompt for new bowler if not last over
        if (matchData.balls < matchData.overs * 6 && matchData.innings === 1) {
            const newBowler = prompt('Enter new bowler name:');
            if (newBowler) {
                matchData.bowlers.push({ name: newBowler, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 });
                matchData.currentBowler = matchData.bowlers.length - 1;
            }
        }
    }
    
    // Add commentary
    addCommentary(runs);
    
    saveMatchData();
    updateDisplay();
}

function takeWicket() {
    if (matchData.allOut || matchData.wickets >= 10 || matchData.balls >= matchData.overs * 6) return;
    
    // Update bowler stats
    matchData.bowlers[matchData.currentBowler].wickets++;
    matchData.bowlers[matchData.currentBowler].balls++;
    
    // Update match stats
    matchData.wickets++;
    matchData.balls++;
    
    // Mark batter as out
    matchData.batters[matchData.currentStriker].out = true;
    
    // Add commentary
    addCommentary('W');
    
    // Check if all out
    if (matchData.wickets >= 10) {
        matchData.allOut = true;
        saveMatchData();
        updateDisplay();
        return;
    }
    
    // Prompt for new batter
    const newBatter = prompt('Enter new batter name:');
    if (newBatter) {
        matchData.batters.push({ name: newBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false });
        matchData.currentStriker = matchData.batters.length - 1;
    }
    
    // Check for over completion
    if (matchData.balls % 6 === 0) {
        // Rotate strike at the end of the over
        [matchData.currentStriker, matchData.currentNonStriker] = [matchData.currentNonStriker, matchData.currentStriker];
        
        // Update bowler's overs
        matchData.bowlers[matchData.currentBowler].overs = Math.floor(matchData.bowlers[matchData.currentBowler].balls / 6);
    }
    
    saveMatchData();
    updateDisplay();
}

function addCommentary(event) {
    const over = Math.floor(matchData.balls / 6);
    const ball = (matchData.balls % 6) + 1;
    const bowler = matchData.bowlers[matchData.currentBowler].name;
    const batter = matchData.batters[matchData.currentStriker].name;
    
    let description;
    if (event === 'W') {
        description = 'Wicket!';
    } else {
        description = `${event} run${event === 1 ? '' : 's'}`;
    }
    
    matchData.commentary.push({
        over: over,
        ball: ball,
        bowler: bowler,
        batter: batter,
        event: event,
        description: description,
        text: `${over}.${ball} ${bowler} to ${batter}, ${description}`
    });
}

function updateDisplay() {
    updateMatchTitle();
    updateScoreDisplay();
    updateBattersTable();
    updateBowlerTable();
    updateCrrRrr();
    updateCurrentOver();
}

function updateMatchTitle() {
    document.getElementById('match-title').textContent = 
        `${matchData.team1} vs ${matchData.team2}`;
}

function updateScoreDisplay() {
    const overs = Math.floor(matchData.balls / 6);
    const balls = matchData.balls % 6;
    
    if (matchData.innings === 1) {
        scoreDisplay.innerHTML = `
            <strong>${matchData.currentBattingTeam} ${matchData.totalRuns}/${matchData.wickets} (${overs}.${balls})</strong> 
            vs ${matchData.currentBowlingTeam}
        `;
    } else {
        scoreDisplay.innerHTML = `
            <strong>${matchData.currentBattingTeam} ${matchData.totalRuns}/${matchData.wickets} (${overs}.${balls})</strong> 
            vs ${matchData.currentBowlingTeam} ${matchData.firstInningsTotal}/all out (${matchData.overs}.0)
        `;
    }
}

function updateBattersTable() {
    battersTable.innerHTML = '';
    
    // Strike batter
    const striker = matchData.batters[matchData.currentStriker];
    const strikerRow = document.createElement('tr');
    strikerRow.innerHTML = `
        <td>${striker.name} *</td>
        <td>${striker.runs}</td>
        <td>${striker.balls}</td>
        <td>${striker.fours}</td>
        <td>${striker.sixes}</td>
        <td>${striker.balls > 0 ? ((striker.runs / striker.balls) * 100).toFixed(2) : '0.00'}</td>
    `;
    battersTable.appendChild(strikerRow);
    
    // Non-strike batter
    const nonStriker = matchData.batters[matchData.currentNonStriker];
    const nonStrikerRow = document.createElement('tr');
    nonStrikerRow.innerHTML = `
        <td>${nonStriker.name}</td>
        <td>${nonStriker.runs}</td>
        <td>${nonStriker.balls}</td>
        <td>${nonStriker.fours}</td>
        <td>${nonStriker.sixes}</td>
        <td>${nonStriker.balls > 0 ? ((nonStriker.runs / nonStriker.balls) * 100).toFixed(2) : '0.00'}</td>
    `;
    battersTable.appendChild(nonStrikerRow);
}

function updateBowlerTable() {
    bowlerTable.innerHTML = '';
    
    const bowler = matchData.bowlers[matchData.currentBowler];
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${bowler.name}</td>
        <td>${bowler.overs}.${bowler.balls % 6}</td>
        <td>${bowler.maidens}</td>
        <td>${bowler.runs}</td>
        <td>${bowler.wickets}</td>
        <td>${bowler.overs > 0 ? (bowler.runs / bowler.overs).toFixed(2) : '0.00'}</td>
    `;
    bowlerTable.appendChild(row);
}

function updateCrrRrr() {
    const oversCompleted = matchData.balls / 6;
    const crr = oversCompleted > 0 ? (matchData.totalRuns / oversCompleted).toFixed(2) : 0;
    
    let rrr = '';
    if (matchData.innings === 2) {
        const runsNeeded = matchData.firstInningsTotal - matchData.totalRuns + 1;
        const ballsRemaining = matchData.overs * 6 - matchData.balls;
        const oversRemaining = ballsRemaining / 6;
        rrr = oversRemaining > 0 ? (runsNeeded / oversRemaining).toFixed(2) : '0.00';
    }
    
    crrRrrDisplay.innerHTML = `
        <p>Current Run Rate: <strong>${crr}</strong></p>
        ${matchData.innings === 2 ? `<p>Required Run Rate: <strong>${rrr}</strong></p>` : ''}
    `;
}

function updateCurrentOver() {
    const overProgress = [];
    const currentOver = Math.floor(matchData.balls / 6);
    
    for (let i = 0; i < 6; i++) {
        const ballIndex = currentOver * 6 + i;
        if (ballIndex < matchData.balls) {
            const ballEvent = matchData.commentary.find(c => 
                c.over === currentOver && c.ball === i + 1
            );
            overProgress.push(ballEvent ? ballEvent.event : '•');
        } else {
            overProgress.push('•');
        }
    }
    
    currentOverDisplay.innerHTML = `
        <p>Current Over: ${overProgress.join(' ')}</p>
    `;
}

function saveMatchData() {
    localStorage.setItem('cricketMatchData', JSON.stringify(matchData));
}
