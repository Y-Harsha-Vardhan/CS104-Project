// Global match data object
let matchData = {
    team1: '', team2: '', tossWinner: '', tossDecision: '',
    innings: 1, currentBattingTeam: '', currentBowlingTeam: '',
    overs: 2, balls: 0, totalRuns: 0, wickets: 0, batters: [], bowlers: [],
    currentStriker: null, currentNonStriker: null, currentBowler: null,
    extras: 0, allOut: false, firstInningsTotal: 0, commentary: []
  };
  
  document.addEventListener('DOMContentLoaded', function() {
    loadMatchData();
    setupEventListeners();
    promptForPlayerNames();
  });
  
  function loadMatchData() {
    const savedData = localStorage.getItem('cricketMatchData');
    if (savedData) {
      matchData = JSON.parse(savedData);
      updateMatchTitle();
    }
  }
  
  function setupEventListeners() {
    // Run buttons
    document.querySelectorAll('.run-btn').forEach(button => {
      button.addEventListener('click', function() {
        const runs = parseInt(this.getAttribute('data-runs'));
        addRuns(runs);
      });
    });
    
    // Wicket button
    document.getElementById('wicket-btn').addEventListener('click', takeWicket);
    
    // Scorecard button
    document.getElementById('scorecard-btn').addEventListener('click', function() {
      window.location.href = 'scorecard.html';
    });
    
    // Modal submit button
    document.getElementById('submit-names').addEventListener('click', submitPlayerNames);
    
    // Modal close button
    document.getElementById('modal-close').addEventListener('click', function() {
      document.getElementById('name-prompt-modal').style.display = 'none';
    });
  }
  
  function promptForPlayerNames() {
    // Use matchData consistently
    if (matchData.innings === 1 && matchData.batters.length === 0) {
      showNamePrompt(['Strike Batter', 'Non-Strike Batter', 'Bowler']);
    } else if (matchData.innings === 2 && matchData.batters.length === 0) {
      showNamePrompt(['Strike Batter', 'Non-Strike Batter']);
    } else if (matchData.batters.some(b => b.out) && matchData.batters.length < 10) {
      showNamePrompt(['New Batter']);
    } else if (matchData.balls % 6 === 0 && matchData.balls < matchData.overs * 6) {
      showNamePrompt(['New Bowler']);
    }
  }
  
  function showNamePrompt(fields) {
    const modal = document.getElementById('name-prompt-modal');
    const modalTitle = document.getElementById('modal-title');
    const nameInputs = document.getElementById('name-inputs');
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
    
    modalTitle.textContent = fields.length === 3 ? 'Enter Starting Players' : 'Enter New Players';
  }
  
  function submitPlayerNames() {
    // For first innings initial prompt
    if (matchData.innings === 1 && matchData.batters.length === 0) {
      const strikeBatterName = document.getElementById('strike-batter').value;
      const nonStrikeBatterName = document.getElementById('non-strike-batter').value;
      const bowlerName = document.getElementById('bowler').value;
      
      if (strikeBatterName && nonStrikeBatterName && bowlerName) {
        // Set batting/bowling teams based on toss decision
        matchData.currentBattingTeam = (matchData.tossDecision === 'bat') ? matchData.tossWinner : 
                                       (matchData.tossWinner === matchData.team1 ? matchData.team2 : matchData.team1);
        matchData.currentBowlingTeam = (matchData.currentBattingTeam === matchData.team1) ? matchData.team2 : matchData.team1;
        
        matchData.batters = [
          { name: strikeBatterName, runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
          { name: nonStrikeBatterName, runs: 0, balls: 0, fours: 0, sixes: 0, out: false }
        ];
        matchData.bowlers = [
          { name: bowlerName, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 }
        ];
        matchData.currentStriker = 0;
        matchData.currentNonStriker = 1;
        matchData.currentBowler = 0;
        
        saveMatchData();
        document.getElementById('name-prompt-modal').style.display = 'none';
        updateDisplay();
      }
    }
    // Additional logic for new batter or bowler prompts can be added similarly
  }
  
  function addRuns(runs) {
    if (matchData.allOut || matchData.balls >= matchData.overs * 6) return;
    
    // Update current striker stats
    matchData.batters[matchData.currentStriker].runs += runs;
    matchData.batters[matchData.currentStriker].balls++;
    if (runs === 4) matchData.batters[matchData.currentStriker].fours++;
    if (runs === 6) matchData.batters[matchData.currentStriker].sixes++;
    
    // Update current bowler stats
    matchData.bowlers[matchData.currentBowler].runs += runs;
    matchData.bowlers[matchData.currentBowler].balls++;
    
    // Update overall match stats
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
      matchData.bowlers[matchData.currentBowler].overs = Math.floor(matchData.bowlers[matchData.currentBowler].balls / 6);
      
      // If not the final over, prompt for new bowler
      if (matchData.balls < matchData.overs * 6 && matchData.innings === 1) {
        const newBowler = prompt('Enter new bowler name:');
        if (newBowler) {
          matchData.bowlers.push({ name: newBowler, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 });
          matchData.currentBowler = matchData.bowlers.length - 1;
        }
      }
    }
    
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
    
    // Mark current batter as out
    matchData.batters[matchData.currentStriker].out = true;
    
    addCommentary('W');
    
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
    
    // Check if over is completed
    if (matchData.balls % 6 === 0) {
      [matchData.currentStriker, matchData.currentNonStriker] = [matchData.currentNonStriker, matchData.currentStriker];
      matchData.bowlers[matchData.currentBowler].overs = Math.floor(matchData.bowlers[matchData.currentBowler].balls / 6);
    }
    
    saveMatchData();
    updateDisplay();
  }
  
  function addCommentary(event) {
    const over = Math.floor(matchData.balls / 6);
    const ball = (matchData.balls % 6) + 1;
    const bowlerName = matchData.bowlers[matchData.currentBowler].name;
    const batterName = matchData.batters[matchData.currentStriker].name;
    const description = (event === 'W') ? 'Wicket!' : `${event} run${event === 1 ? '' : 's'}`;
    
    matchData.commentary.push({
      over: over,
      ball: ball,
      bowler: bowlerName,
      batter: batterName,
      event: event,
      description: description,
      text: `${over}.${ball} ${bowlerName} to ${batterName}, ${description}`
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
    document.getElementById('match-title').textContent = `${matchData.team1} vs ${matchData.team2}`;
  }
  
  function updateScoreDisplay() {
    const oversCompleted = Math.floor(matchData.balls / 6);
    const ballsRemaining = matchData.balls % 6;
    const scoreDisplay = document.getElementById('score-display');
    
    if (matchData.innings === 1) {
      scoreDisplay.innerHTML = `<strong>${matchData.currentBattingTeam} ${matchData.totalRuns}/${matchData.wickets} (${oversCompleted}.${ballsRemaining})</strong> vs ${matchData.currentBowlingTeam}`;
    } else {
      scoreDisplay.innerHTML = `<strong>${matchData.currentBattingTeam} ${matchData.totalRuns}/${matchData.wickets} (${oversCompleted}.${ballsRemaining})</strong> vs ${matchData.currentBowlingTeam} ${matchData.firstInningsTotal}/all out (${matchData.overs}.0)`;
    }
  }
  
  function updateBattersTable() {
    const battersTable = document.getElementById('batters-table');
    battersTable.innerHTML = '';
    
    // Strike batter row
    const striker = matchData.batters[matchData.currentStriker];
    const strikerRow = document.createElement('tr');
    strikerRow.innerHTML = `<td>${striker.name} *</td><td>${striker.runs}</td><td>${striker.balls}</td><td>${striker.fours}</td><td>${striker.sixes}</td><td>${striker.balls > 0 ? ((striker.runs/striker.balls)*100).toFixed(2) : '0.00'}</td>`;
    battersTable.appendChild(strikerRow);
    
    // Non-striker row
    const nonStriker = matchData.batters[matchData.currentNonStriker];
    const nonStrikerRow = document.createElement('tr');
    nonStrikerRow.innerHTML = `<td>${nonStriker.name}</td><td>${nonStriker.runs}</td><td>${nonStriker.balls}</td><td>${nonStriker.fours}</td><td>${nonStriker.sixes}</td><td>${nonStriker.balls > 0 ? ((nonStriker.runs/nonStriker.balls)*100).toFixed(2) : '0.00'}</td>`;
    battersTable.appendChild(nonStrikerRow);
  }
  
  function updateBowlerTable() {
    const bowlerTable = document.getElementById('bowling-table');
    bowlerTable.innerHTML = '';
    
    const bowler = matchData.bowlers[matchData.currentBowler];
    const row = document.createElement('tr');
    row.innerHTML = `<td>${bowler.name}</td><td>${bowler.overs}.${bowler.balls % 6}</td><td>${bowler.maidens}</td><td>${bowler.runs}</td><td>${bowler.wickets}</td><td>${bowler.overs > 0 ? (bowler.runs/bowler.overs).toFixed(2) : '0.00'}</td>`;
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
    document.getElementById('crr-and-rrr').innerHTML = `<p>Current Run Rate: <strong>${crr}</strong></p>${matchData.innings === 2 ? `<p>Required Run Rate: <strong>${rrr}</strong></p>` : ''}`;
  }
  
  function updateCurrentOver() {
    const currentOverDisplay = document.getElementById('current-over-data');
    let overProgress = [];
    const currentOver = Math.floor(matchData.balls / 6);
    
    for (let i = 0; i < 6; i++) {
      const ballIndex = currentOver * 6 + i;
      if (ballIndex < matchData.balls) {
        const ballEvent = matchData.commentary.find(c => c.over === currentOver && c.ball === i + 1);
        overProgress.push(ballEvent ? ballEvent.event : '•');
      } else {
        overProgress.push('•');
      }
    }
    
    currentOverDisplay.innerHTML = `<p>Current Over: ${overProgress.join(' ')}</p>`;
  }
  
  function saveMatchData() {
    localStorage.setItem('cricketMatchData', JSON.stringify(matchData));
  }
  