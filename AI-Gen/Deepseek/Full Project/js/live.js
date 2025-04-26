import { 
    currentMatch, matchHistory, 
    loadMatchData, saveMatchData,
    addRuns, takeWicket, addExtra,
    addCommentary, checkMatchCompletion
} from './score.js';

// DOM elements
const scoreDisplay = document.getElementById('score-display');
const battersTable = document.getElementById('batters-table').querySelector('tbody');
const bowlerTable = document.getElementById('bowler-table').querySelector('tbody');
const runButtons = document.querySelectorAll('.run-btn');
const wicketButton = document.getElementById('wicket-btn');
const runoutButton = document.getElementById('runout-btn');
const wideButton = document.getElementById('wide-btn');
const noballButton = document.getElementById('noball-btn');
const byeButton = document.getElementById('bye-btn');
const legbyeButton = document.getElementById('legbye-btn');
const scorecardButton = document.getElementById('scorecard-btn');
const toggleCommentaryButton = document.getElementById('toggle-commentary');
const commentarySection = document.getElementById('commentary-section');
const commentaryLog = document.getElementById('commentary-log');
const extrasDisplay = document.getElementById('extras-display');
const modal = document.getElementById('name-prompt-modal');
const modalTitle = document.getElementById('modal-title');
const nameInputs = document.getElementById('name-inputs');
const submitNamesButton = document.getElementById('submit-names');
const crrRrrDisplay = document.getElementById('crr-rrr-display');
const currentOverDisplay = document.getElementById('current-over-display');
const runoutModal = document.getElementById('runout-modal');
const runoutRunsInput = document.getElementById('runout-runs');
const runoutBatterSelect = document.getElementById('runout-batter');
const confirmRunoutButton = document.getElementById('confirm-runout');
const cancelRunoutButton = document.getElementById('cancel-runout');
const commentaryFilters = document.querySelectorAll('.commentary-filter');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadMatchData();
    setupEventListeners();
    
    // Check if we're coming from summary page to start a new match
    const fromSummary = sessionStorage.getItem('fromSummary');
    if (fromSummary === 'true') {
        sessionStorage.removeItem('fromSummary');
        resetForNewMatch();
    } else {
        promptForPlayerNames();
    }
    
    updateDisplay();
});

function setupEventListeners() {
    // Run buttons
    runButtons.forEach(button => {
        button.addEventListener('click', function() {
            const runs = parseInt(this.getAttribute('data-runs'));
            addRuns(runs);
            if (checkMatchCompletion()) {
                navigateToSummary();
            } else {
                updateDisplay();
            }
        });
    });

    // Wicket button
    wicketButton.addEventListener('click', function() {
        takeWicket('bowled');
        if (checkMatchCompletion()) {
            navigateToSummary();
        } else {
            updateDisplay();
        }
    });

    // Runout button
    runoutButton.addEventListener('click', function() {
        showRunoutModal();
    });

    // Extra buttons
    wideButton.addEventListener('click', function() {
        addExtra('wide');
        if (checkMatchCompletion()) {
            navigateToSummary();
        } else {
            updateDisplay();
        }
    });

    noballButton.addEventListener('click', function() {
        addExtra('noball');
        updateDisplay();
    });

    byeButton.addEventListener('click', function() {
        const runs = prompt('Enter number of bye runs:', 1);
        if (runs !== null) {
            addExtra('bye', parseInt(runs) || 0);
            if (checkMatchCompletion()) {
                navigateToSummary();
            } else {
                updateDisplay();
            }
        }
    });

    legbyeButton.addEventListener('click', function() {
        const runs = prompt('Enter number of leg bye runs:', 1);
        if (runs !== null) {
            addExtra('legbye', parseInt(runs) || 0);
            if (checkMatchCompletion()) {
                navigateToSummary();
            } else {
                updateDisplay();
            }
        }
    });

    // Scorecard button
    scorecardButton.addEventListener('click', function() {
        window.location.href = 'scorecard.html';
    });

    // Toggle commentary button
    toggleCommentaryButton.addEventListener('click', function() {
        commentarySection.classList.toggle('hidden');
        this.textContent = commentarySection.classList.contains('hidden') ? 'Show Commentary' : 'Hide Commentary';
    });

    // Submit names button
    submitNamesButton.addEventListener('click', function() {
        submitPlayerNames();
    });

    // Runout modal buttons
    confirmRunoutButton.addEventListener('click', function() {
        const runs = parseInt(runoutRunsInput.value) || 0;
        const batterIndex = parseInt(runoutBatterSelect.value);
        takeWicket('runout', runs, batterIndex);
        runoutModal.style.display = 'none';
        if (checkMatchCompletion()) {
            navigateToSummary();
        } else {
            updateDisplay();
        }
    });

    cancelRunoutButton.addEventListener('click', function() {
        runoutModal.style.display = 'none';
    });

    // Commentary filters
    commentaryFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            const filterType = this.getAttribute('data-filter');
            filterCommentary(filterType);
            
            // Update active state
            commentaryFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function showRunoutModal() {
    // Populate batter select
    runoutBatterSelect.innerHTML = '';
    
    const strikers = [
        { index: currentMatch.currentStriker, name: currentMatch.batters[currentMatch.currentStriker].name, role: 'Striker' },
        { index: currentMatch.currentNonStriker, name: currentMatch.batters[currentMatch.currentNonStriker].name, role: 'Non-Striker' }
    ];
    
    strikers.forEach(batter => {
        const option = document.createElement('option');
        option.value = batter.index;
        option.textContent = `${batter.name} (${batter.role})`;
        runoutBatterSelect.appendChild(option);
    });
    
    runoutRunsInput.value = 0;
    runoutModal.style.display = 'flex';
}

function filterCommentary(filterType) {
    const commentaryItems = document.querySelectorAll('.commentary-item');
    const currentBatter = currentMatch.batters[currentMatch.currentStriker].name;
    const currentBowler = currentMatch.bowlers[currentMatch.currentBowler].name;
    
    commentaryItems.forEach(item => {
        item.style.display = 'block';
        
        if (filterType === 'batter') {
            if (!item.textContent.includes(currentBatter)) {
                item.style.display = 'none';
            }
        } else if (filterType === 'bowler') {
            if (!item.textContent.includes(currentBowler)) {
                item.style.display = 'none';
            }
        }
    });
}

function promptForPlayerNames() {
    if (currentMatch.innings === 1 && currentMatch.batters.length === 0) {
        // First innings, first time
        showNamePrompt(['Strike Batter', 'Non-Strike Batter', 'Bowler']);
    } else if (currentMatch.innings === 2 && currentMatch.batters.length === 0) {
        // Second innings, need to prompt for new batters
        showNamePrompt(['Strike Batter', 'Non-Strike Batter']);
    } else if (currentMatch.batters.some(b => b.out) && currentMatch.batters.length < 10) {
        // Wicket has fallen, need new batter
        showNamePrompt(['New Batter']);
    } else if (currentMatch.balls % 6 === 0 && currentMatch.balls < currentMatch.overs * 6) {
        // Over completed, need new bowler
        showNamePrompt(['New Bowler']);
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
    
    modalTitle.textContent = fields.length === 3 ? 'Enter Starting Players' : 
                           fields[0] === 'New Bowler' ? 'Enter New Bowler' :
                           fields[0] === 'New Batter' ? 'Enter New Batter' :
                           'Enter New Batters';
}

function submitPlayerNames() {
    if (currentMatch.innings === 1 && currentMatch.batters.length === 0) {
        // First innings, first time
        const strikeBatter = document.getElementById('strike-batter').value;
        const nonStrikeBatter = document.getElementById('non-strike-batter').value;
        const bowler = document.getElementById('bowler').value;
        
        if (strikeBatter && nonStrikeBatter && bowler) {
            currentMatch.batters = [
                { name: strikeBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, howOut: '' },
                { name: nonStrikeBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, howOut: '' }
            ];
            
            currentMatch.bowlers = [
                { name: bowler, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 }
            ];
            
            currentMatch.currentStriker = 0;
            currentMatch.currentNonStriker = 1;
            currentMatch.currentBowler = 0;
            
            saveMatchData();
            modal.style.display = 'none';
            updateDisplay();
        }
    } else if (currentMatch.innings === 2 && currentMatch.batters.length === 0) {
        // Second innings, new batters
        const strikeBatter = document.getElementById('strike-batter').value;
        const nonStrikeBatter = document.getElementById('non-strike-batter').value;
        
        if (strikeBatter && nonStrikeBatter) {
            currentMatch.batters = [
                { name: strikeBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, howOut: '' },
                { name: nonStrikeBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, howOut: '' }
            ];
            
            currentMatch.currentStriker = 0;
            currentMatch.currentNonStriker = 1;
            
            saveMatchData();
            modal.style.display = 'none';
            updateDisplay();
        }
    } else if (document.getElementById('new-batter')) {
        // New batter after wicket
        const newBatter = document.getElementById('new-batter').value;
        
        if (newBatter) {
            currentMatch.batters.push({ 
                name: newBatter, 
                runs: 0, 
                balls: 0, 
                fours: 0, 
                sixes: 0, 
                out: false,
                howOut: ''
            });
            currentMatch.currentStriker = currentMatch.batters.length - 1;
            
            saveMatchData();
            modal.style.display = 'none';
            updateDisplay();
        }
    } else if (document.getElementById('new-bowler')) {
        // New bowler after over
        const newBowler = document.getElementById('new-bowler').value;
        
        if (newBowler) {
            currentMatch.bowlers.push({ 
                name: newBowler, 
                overs: 0, 
                balls: 0, 
                maidens: 0, 
                runs: 0, 
                wickets: 0 
            });
            currentMatch.currentBowler = currentMatch.bowlers.length - 1;
            
            saveMatchData();
            modal.style.display = 'none';
            updateDisplay();
        }
    }
}

function updateDisplay() {
    updateMatchTitle();
    updateScoreDisplay();
    updateBattersTable();
    updateBowlerTable();
    updateExtrasDisplay();
    updateCrrRrr();
    updateCurrentOver();
    updateCommentary();
    
    // Check if we need to prompt for player names
    if (!currentMatch.matchComplete) {
        promptForPlayerNames();
    }
}

function updateMatchTitle() {
    document.getElementById('match-title').textContent = 
        `${currentMatch.team1} vs ${currentMatch.team2}`;
}

function updateScoreDisplay() {
    const overs = Math.floor(currentMatch.balls / 6);
    const balls = currentMatch.balls % 6;
    
    if (currentMatch.innings === 1) {
        scoreDisplay.innerHTML = `
            <strong>${currentMatch.currentBattingTeam} ${currentMatch.totalRuns}/${currentMatch.wickets} (${overs}.${balls})</strong> 
            vs ${currentMatch.currentBowlingTeam}
        `;
    } else {
        scoreDisplay.innerHTML = `
            <strong>${currentMatch.currentBattingTeam} ${currentMatch.totalRuns}/${currentMatch.wickets} (${overs}.${balls})</strong> 
            vs ${currentMatch.currentBowlingTeam} ${currentMatch.firstInningsTotal}/all out (${currentMatch.overs}.0)
        `;
    }
}

function updateBattersTable() {
    battersTable.innerHTML = '';
    
    if (currentMatch.batters.length === 0) return;
    
    // Strike batter
    const striker = currentMatch.batters[currentMatch.currentStriker];
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
    const nonStriker = currentMatch.batters[currentMatch.currentNonStriker];
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
    
    if (currentMatch.bowlers.length === 0) return;
    
    const bowler = currentMatch.bowlers[currentMatch.currentBowler];
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

function updateExtrasDisplay() {
    extrasDisplay.innerHTML = `
        <div class="extras-item"><span>Wides:</span><span>${currentMatch.extrasBreakdown.wides}</span></div>
        <div class="extras-item"><span>No Balls:</span><span>${currentMatch.extrasBreakdown.noballs}</span></div>
        <div class="extras-item"><span>Byes:</span><span>${currentMatch.extrasBreakdown.byes}</span></div>
        <div class="extras-item"><span>Leg Byes:</span><span>${currentMatch.extrasBreakdown.legbyes}</span></div>
        <div class="extras-item"><strong>Total Extras:</strong><strong>${currentMatch.extras}</strong></div>
    `;
}

function updateCrrRrr() {
    const oversCompleted = currentMatch.balls / 6;
    const crr = oversCompleted > 0 ? (currentMatch.totalRuns / oversCompleted).toFixed(2) : 0;
    
    let rrr = '';
    if (currentMatch.innings === 2) {
        const runsNeeded = currentMatch.firstInningsTotal - currentMatch.totalRuns + 1;
        const ballsRemaining = currentMatch.overs * 6 - currentMatch.balls;
        const oversRemaining = ballsRemaining / 6;
        rrr = oversRemaining > 0 ? (runsNeeded / oversRemaining).toFixed(2) : '0.00';
    }
    
    crrRrrDisplay.innerHTML = `
        <p>Current Run Rate: <strong>${crr}</strong></p>
        ${currentMatch.innings === 2 ? `<p>Required Run Rate: <strong>${rrr}</strong></p>` : ''}
    `;
}

function updateCurrentOver() {
    const overProgress = [];
    const currentOver = Math.floor(currentMatch.balls / 6);
    
    for (let i = 0; i < 6; i++) {
        const ballIndex = currentOver * 6 + i;
        if (ballIndex < currentMatch.balls) {
            const ballEvent = currentMatch.commentary.find(c => 
                c.over === currentOver && c.ball === i + 1
            );
            overProgress.push(ballEvent ? ballEvent.event : '•');
        } else {
            overProgress.push('•');
        }
    }
    
    currentOverDisplay.innerHTML = `
        <p>Current Over: ${overProgress.join(' ')}</p>
        ${currentMatch.freeHit ? '<p class="free-hit">FREE HIT</p>' : ''}
    `;
}

function updateCommentary() {
    commentaryLog.innerHTML = '';
    
    currentMatch.commentary.forEach(comment => {
        const item = document.createElement('div');
        item.className = 'commentary-item';
        
        // Highlight wickets and boundaries
        if (comment.event === 'W' || comment.event === 'RO') {
            item.style.color = '#e74c3c';
            item.style.fontWeight = 'bold';
        } else if (comment.event === 4) {
            item.style.color = '#3498db';
        } else if (comment.event === 6) {
            item.style.color = '#2ecc71';
            item.style.fontWeight = 'bold';
        }
        
        item.textContent = comment.text;
        commentaryLog.appendChild(item);
    });
    
    // Scroll to bottom
    commentaryLog.scrollTop = commentaryLog.scrollHeight;
}

function resetForNewMatch() {
    // Preserve team and toss info but reset match progress
    currentMatch = {
        team1: currentMatch.team1,
        team2: currentMatch.team2,
        tossWinner: currentMatch.tossWinner,
        tossDecision: currentMatch.tossDecision,
        innings: 1,
        currentBattingTeam: '',
        currentBowlingTeam: '',
        overs: currentMatch.overs,
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
    
    // Determine initial batting/bowling teams
    currentMatch.currentBattingTeam = currentMatch.tossDecision === 'bat' ? currentMatch.tossWinner : 
                                   (currentMatch.tossWinner === currentMatch.team1 ? currentMatch.team2 : currentMatch.team1);
    currentMatch.currentBowlingTeam = currentMatch.currentBattingTeam === currentMatch.team1 ? currentMatch.team2 : currentMatch.team1;
    
    saveMatchData();
    promptForPlayerNames();
}

function navigateToSummary() {
    sessionStorage.setItem('fromSummary', 'true');
    window.location.href = 'summary.html';
}