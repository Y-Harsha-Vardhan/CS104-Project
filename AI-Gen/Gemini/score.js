//The below block contains the logic implementation for the setup.html page
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Adding a function when the Start Match button is clicked
function startMatch() {

    //Assigning variables to the team1 and team2 names, toss-winner, toss-decision and error messages
    const team1_name = document.getElementById("team1").value;
    const team2_name = document.getElementById("team2").value;
    const tossWinner = document.getElementById("toss-winner").value;
    const tossDecision = document.getElementById("toss-decision").value;
    let errorMessage_1 = document.getElementById("error-message-1");
    let errorMessage_2 = document.getElementById("error-message-2");

    //Resetting error messages initially to hidden
    errorMessage_1.style.visibility = "hidden";
    errorMessage_2.style.visibility = "hidden";

    //Using a conditional to display error message when required
    if(!team1_name) {errorMessage_1.style.visibility = "visible"; return;}

    if(!team2_name) {errorMessage_2.style.visibility = "visible"; return;}

    if(team1_name==team2_name) { alert("Both teams cannot be the same. Please enter different teams."); return;}
    
    //Storing the setup data in matchData object
    const teamData = {
        team1_name: team1_name,
        team2_name: team2_name,
        tossWinner: tossWinner === "team1" ? team1_name : team2_name,
        tossDecision: tossDecision
    };
    
    //This stores the matchData object in browser's local storage by converting it into a JSON string
    //This information is not lost if the page is refreshed or closed
    localStorage.setItem("teamData", JSON.stringify(teamData));

    // CHANGED: Clear any potentially leftover cricket match data from previous sessions
    localStorage.removeItem('cricketMatchData'); 

    //Redirecting the user to live.html page, within the same website
    window.location.href = "live.html";
}

//This ensures that the submit button is clicked, even if we just press enter in the page, withoutmanually clicking it 
document.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      const submitButton = document.querySelector("button[type='submit'], #start-match");
      if (submitButton) {
        event.preventDefault();
        submitButton.click();
      }
    }
  });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//The below block contains the logic implementation for the live.html page
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Declaring all the global variables:
//Global variables
let matchData = {
    team1: '', team2: '', tossWinner: '', tossDecision: '',
    innings: 1, 
    currentBattingTeam: '', currentBowlingTeam: '', overs: 2, balls: 0,
    totalRuns: 0, wickets: 0,
    batters: [], bowlers: [],
    currentStriker: null, currentNonStriker: null, currentBowler: null,
    extras: 0, firstInningsTotal: 0,
    allOut: false, 
    commentary: [],
    // CHANGED: Added match status for game end//
    matchOver: false,
    statusMessage: ''
};

//Assigning the names of the teams, tossWinners and tossDecisions from the setup page to matchData
const storedTeamData = localStorage.getItem('teamData');
if (storedTeamData) {
    const teamData = JSON.parse(storedTeamData);
    matchData.team1 = teamData.team1_name;
    matchData.team2 = teamData.team2_name;
    matchData.tossWinner = teamData.tossWinner;
    matchData.tossDecision = teamData.tossDecision;
} 

//DOM elements are assigned to variables using their id
const scoreDisplay = document.getElementById('score-display');
const battersTable = document.getElementById('batters-table').querySelector('tbody');
const bowlerTable = document.getElementById('bowling-table').querySelector('tbody');
const runButtons = document.querySelectorAll('.run-btn');
const wicketButton = document.getElementById('wicket-btn');
const scorecardButton = document.getElementById('scorecard-btn');
const modal = document.getElementById('name-prompt-modal');
const modalTitle = document.getElementById('modal-title');
const nameInputs = document.getElementById('name-inputs');
const submitNamesButton = document.getElementById('submit-names');
const crrRrrDisplay = document.getElementById('crr-and-rrr');
const currentOverDisplay = document.getElementById('current-over-data');
// CHANGED: Added reference for status message display
const statusDisplay = document.getElementById('status-message'); 

//Initializing the app using loadMatchData(); setupEventListeners(); and promptForPlayerNames() functions
document.addEventListener('DOMContentLoaded', function() {
    loadMatchData(); // Load existing match state first
    setupEventListeners();
    // CHANGED: Prompt logic moved after potential load and initial setup
    if (!matchData.matchOver && matchData.batters.length === 0 && matchData.currentStriker === null) {
        // Only prompt if match isn't over and players aren't set up yet
         promptForPlayerNames();
    } else {
        // If data was loaded, update display immediately
        updateDisplay();
    }
});

//This function gets the match data that is stored as 'cricketMatchData' in the localStorage
//It then uses this data to call updateMatchData() function 
function loadMatchData() {
    const savedData = localStorage.getItem('cricketMatchData');
    if (savedData) {
        matchData = JSON.parse(savedData);
        // Ensure loaded data types are correct if needed (JSON parse might lose object methods)
    } 
    // CHANGED: Else block removed, initial matchData object serves as default
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
            // CHANGED: Added check if match is over
            if (matchData.matchOver) return;
            const runs = parseInt(this.getAttribute('data-runs'));
            addRuns(runs);
        });
    });

    //for wicket button
    wicketButton.addEventListener('click', function() {
         // CHANGED: Added check if match is over
        if (matchData.matchOver) return;
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
    // CHANGED: Simplified prompt logic based on current state
    if (matchData.innings === 1 && matchData.batters.length === 0) {
        // First innings, first time
        showNamePrompt(['Strike Batter', 'Non-Strike Batter', 'Bowler']);
    } else if (matchData.innings === 2 && matchData.batters.length === 0) {
        // Second innings start, need new batters and opening bowler
        showNamePrompt(['Strike Batter', 'Non-Strike Batter', 'Opening Bowler']);
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
        // CHANGED: Ensure unique IDs even if field names repeat (though not the case here)
        input.id = field.toLowerCase().replace(/ /g, '-'); 
        nameInputs.appendChild(input);
    });
    
    // CHANGED: Updated modal title logic
    modalTitle.textContent = (matchData.innings === 1) ? 'Enter Starting Players' : 'Enter 2nd Innings Players';
}

// CHANGED: Entire function structure revised for clarity and correctness
function submitPlayerNames() {
    if (matchData.innings === 1 && matchData.batters.length === 0) {
        // First innings setup
        const strikeBatter = document.getElementById('strike-batter').value.trim();
        const nonStrikeBatter = document.getElementById('non-strike-batter').value.trim();
        const bowler = document.getElementById('bowler').value.trim();
        
        if (strikeBatter && nonStrikeBatter && bowler) {
            if (strikeBatter === nonStrikeBatter) {
                alert("Strike and Non-Strike batters must be different.");
                return;
            }
            
            // Determine batting/bowling teams
            matchData.currentBattingTeam = matchData.tossDecision === 'bat' ? matchData.tossWinner : 
                                         (matchData.tossWinner === matchData.team1 ? matchData.team2 : matchData.team1);
            matchData.currentBowlingTeam = matchData.currentBattingTeam === matchData.team1 ? matchData.team2 : matchData.team1;
            
            // Initialize players
            matchData.batters = [
                { name: strikeBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
                { name: nonStrikeBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false }
            ];
            matchData.bowlers = [
                { name: bowler, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 }
            ];
            
            matchData.currentStriker = 0;
            matchData.currentNonStriker = 1;
            matchData.currentBowler = 0; // Index of the first bowler
            
            modal.style.display = 'none';
            saveMatchData();
            updateDisplay();
        } else {
             alert("Please fill in all player names.");
        }

    } else if (matchData.innings === 2 && matchData.batters.length === 0) {
        // Second innings setup
        const strikeBatter = document.getElementById('strike-batter').value.trim();
        const nonStrikeBatter = document.getElementById('non-strike-batter').value.trim();
        const bowler = document.getElementById('opening-bowler').value.trim(); // Get opening bowler for 2nd innings
        
        if (strikeBatter && nonStrikeBatter && bowler) {
             if (strikeBatter === nonStrikeBatter) {
                alert("Strike and Non-Strike batters must be different.");
                return;
            }
           
            // Teams are already swapped by startSecondInnings() function
            
            // Initialize new batters
            matchData.batters = [
                { name: strikeBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
                { name: nonStrikeBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false }
            ];
            
            matchData.currentStriker = 0;
            matchData.currentNonStriker = 1;

            // Find or add the opening bowler
            let bowlerIndex = matchData.bowlers.findIndex(b => b.name === bowler);
            if (bowlerIndex === -1) {
                 // If bowler didn't bowl in first innings, add them
                 matchData.bowlers.push({ name: bowler, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 });
                 bowlerIndex = matchData.bowlers.length - 1;
            }
             matchData.currentBowler = bowlerIndex;
            
            modal.style.display = 'none';
            saveMatchData();
            updateDisplay();
        } else {
             alert("Please fill in all player names.");
        }
    }
}

// CHANGED: Renamed checkForEndOfInnings for clarity
function checkForEndOfMatchOrInnings() {
    const oversCompleted = matchData.balls >= matchData.overs * 6;
    const allOut = matchData.wickets >= 10; // Assuming 10 wickets per innings

    if (matchData.innings === 1) {
        if (oversCompleted || allOut) {
            matchData.allOut = true; // Mark innings as finished
            startSecondInnings();
            return true; // Innings ended
        }
    } else { // Innings 2
        const targetReached = matchData.totalRuns > matchData.firstInningsTotal;
        if (targetReached) {
            endMatch(`${matchData.currentBattingTeam} won by ${10 - matchData.wickets} wicket(s)!`);
             return true; // Match ended
        }
        if (oversCompleted || allOut) {
             if (matchData.totalRuns > matchData.firstInningsTotal) {
                 // Should have been caught above, but safety check
                 endMatch(`${matchData.currentBattingTeam} won by ${10 - matchData.wickets} wicket(s)!`);
             } else if (matchData.totalRuns === matchData.firstInningsTotal) {
                 endMatch("Match Tied!");
             } else {
                 endMatch(`${matchData.currentBowlingTeam} won by ${matchData.firstInningsTotal - matchData.totalRuns} run(s)!`);
             }
            return true; // Match ended
        }
    }
    return false; // Match/Innings continues
}

// CHANGED: New function to handle transition
function startSecondInnings() {
    matchData.firstInningsTotal = matchData.totalRuns; // Store first innings score
    matchData.innings = 2;
    matchData.totalRuns = 0;
    matchData.wickets = 0;
    matchData.balls = 0;
    matchData.allOut = false; // Reset allOut flag for second innings
    matchData.batters = []; // Clear batters for new innings
    matchData.commentary.push({ text: `--- End of Innings 1 --- Target: ${matchData.firstInningsTotal + 1} ---` }); // Add marker to commentary
    
    // Swap teams
    const previousBattingTeam = matchData.currentBattingTeam;
    matchData.currentBattingTeam = matchData.currentBowlingTeam;
    matchData.currentBowlingTeam = previousBattingTeam;

    matchData.currentStriker = null; // Reset indices
    matchData.currentNonStriker = null;
    matchData.currentBowler = null; 

    alert(`End of Innings 1. ${matchData.currentBowlingTeam} scored ${matchData.firstInningsTotal}. Target for ${matchData.currentBattingTeam} is ${matchData.firstInningsTotal + 1}.`);

    saveMatchData();
    updateDisplay(); // Update display to show target etc.
    promptForPlayerNames(); // Prompt for 2nd innings players
}

// CHANGED: New function to handle end of match
function endMatch(message) {
    matchData.matchOver = true;
    matchData.statusMessage = message;
    alert(message); // Simple alert for now
    saveMatchData();
    updateDisplay(); 
    // Consider disabling input buttons here if needed
    runButtons.forEach(button => button.disabled = true);
    wicketButton.disabled = true;
}


function addRuns(runs) {
    // CHANGED: Guard clause uses matchOver now
    if (matchData.matchOver || matchData.allOut || !Number.isInteger(matchData.currentStriker)) return; // Also check if players are set
    
    // Update batter stats
    matchData.batters[matchData.currentStriker].runs += runs;
    matchData.batters[matchData.currentStriker].balls++;
    
    if (runs === 4) matchData.batters[matchData.currentStriker].fours++;
    if (runs === 6) matchData.batters[matchData.currentStriker].sixes++;
    
    // Update bowler stats
    // CHANGED: Added check if currentBowler is valid
    if (Number.isInteger(matchData.currentBowler) && matchData.bowlers[matchData.currentBowler]) {
        matchData.bowlers[matchData.currentBowler].runs += runs;
        matchData.bowlers[matchData.currentBowler].balls++;
    } else {
        console.error("Error: Current bowler not set correctly.");
        // Handle this error appropriately, maybe prompt for bowler again?
        return; // Stop processing if bowler isn't set
    }
    
    // Update match stats
    matchData.totalRuns += runs;
    matchData.balls++;
    
    addCommentary(runs); // Add commentary BEFORE potential end of match/innings

    // CHANGED: Check for end of match or innings BEFORE strike rotation or over change
    if (checkForEndOfMatchOrInnings()) {
        saveMatchData(); // Save state after potential match/innings end
        updateDisplay();
        return; // Stop processing further for this ball
    }
    
    // Rotate strike for odd runs (but not on the last ball of an over)
    if (runs % 2 !== 0 && matchData.balls % 6 !== 0) {
         // CHANGED: Ensure non-striker is valid before swapping
        if (Number.isInteger(matchData.currentNonStriker)) {
            [matchData.currentStriker, matchData.currentNonStriker] = [matchData.currentNonStriker, matchData.currentStriker];
        }
    }
    
    // Check for over completion
    if (matchData.balls % 6 === 0 && matchData.balls > 0) {
        // Rotate strike at the end of the over
        // CHANGED: Ensure non-striker is valid before swapping
        if (Number.isInteger(matchData.currentNonStriker)) {
            [matchData.currentStriker, matchData.currentNonStriker] = [matchData.currentNonStriker, matchData.currentStriker];
        }
        
        // Update bowler's overs count
         if (Number.isInteger(matchData.currentBowler) && matchData.bowlers[matchData.currentBowler]) {
             // Calculate overs based on total balls bowled by this bowler
             const bowlerTotalBalls = matchData.bowlers[matchData.currentBowler].balls;
             matchData.bowlers[matchData.currentBowler].overs = Math.floor(bowlerTotalBalls / 6); 
             // Check for maiden (Needs tracking runs in current over - complex, omitting for now)
         }
       
        // CHANGED: Prompt for new bowler only if match/innings isn't over
        if (!matchData.matchOver && !matchData.allOut && matchData.balls < matchData.overs * 6) {
             // Prompt for the next bowler
             const newBowlerName = prompt('End of Over. Enter next bowler name:');
             if (newBowlerName) {
                 let bowlerIndex = matchData.bowlers.findIndex(b => b.name === newBowlerName.trim());
                 if (bowlerIndex === -1) {
                     matchData.bowlers.push({ name: newBowlerName.trim(), overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 });
                     bowlerIndex = matchData.bowlers.length - 1;
                 }
                 matchData.currentBowler = bowlerIndex;
             } else {
                 alert("No bowler entered. Match cannot proceed without a bowler.");
                 // Consider pausing or handling this state
                 matchData.matchOver = true; // Halt game if no bowler provided?
                 matchData.statusMessage = "Match halted: No bowler provided for next over.";
             }
         }
    }
    
    saveMatchData();
    updateDisplay();
}

function takeWicket() {
    // CHANGED: Guard clause uses matchOver now
    if (matchData.matchOver || matchData.allOut || matchData.wickets >= 10 || !Number.isInteger(matchData.currentStriker)) return; // Also check if players set
    
    // Update bowler stats
    // CHANGED: Added check if currentBowler is valid
     if (Number.isInteger(matchData.currentBowler) && matchData.bowlers[matchData.currentBowler]) {
        matchData.bowlers[matchData.currentBowler].wickets++;
        matchData.bowlers[matchData.currentBowler].balls++;
     } else {
        console.error("Error: Current bowler not set correctly for wicket.");
        return; // Stop processing if bowler isn't set
     }
    
    // Update match stats
    matchData.wickets++;
    matchData.balls++;
    
    // Mark batter as out
    if (matchData.batters[matchData.currentStriker]) {
        matchData.batters[matchData.currentStriker].out = true;
    }

    const outBatterName = matchData.batters[matchData.currentStriker]?.name || 'Batter'; // Get name before potentially changing striker
    addCommentary('W'); // Add commentary BEFORE potential end of match/innings

    // CHANGED: Check for end of match or innings
    if (checkForEndOfMatchOrInnings()) {
        saveMatchData(); // Save state after potential match/innings end
        updateDisplay();
        return; // Stop processing further for this ball
    }
    
    // Prompt for new batter ONLY if not all out
    if (matchData.wickets < 10) {
         const newBatterName = prompt(`${outBatterName} is out! Enter new batter name:`);
         if (newBatterName && newBatterName.trim()) {
            // Check if new batter is same as non-striker
            const nonStrikerName = matchData.batters[matchData.currentNonStriker]?.name;
            if (newBatterName.trim() === nonStrikerName) {
                 alert("New batter cannot be the same as the non-striker.");
                 // How to handle this? Re-prompt or halt? Halting for now.
                 matchData.matchOver = true; 
                 matchData.statusMessage = "Match halted: Invalid new batter provided.";
            } else {
                matchData.batters.push({ name: newBatterName.trim(), runs: 0, balls: 0, fours: 0, sixes: 0, out: false });
                matchData.currentStriker = matchData.batters.length - 1; // New batter is now the striker
            }
         } else {
             alert("No new batter entered. Match cannot proceed.");
             matchData.matchOver = true; // Halt game if no batter provided
             matchData.statusMessage = "Match halted: No new batter provided.";
         }
    } else {
         // Should have been caught by checkForEndOfMatchOrInnings, but safety
         matchData.allOut = true;
    }

    // Check for over completion after wicket
     if (!matchData.matchOver && matchData.balls % 6 === 0 && matchData.balls > 0) {
        // Rotate strike at the end of the over (if non-striker exists)
        // CHANGED: Ensure non-striker is valid before swapping
        if (Number.isInteger(matchData.currentNonStriker) && matchData.batters[matchData.currentNonStriker] && !matchData.batters[matchData.currentNonStriker].out) {
            [matchData.currentStriker, matchData.currentNonStriker] = [matchData.currentNonStriker, matchData.currentStriker];
        } else if (matchData.wickets < 10) {
             // If non-striker was the one out or not set, the new batter (now striker) stays
        }
        
        // Update bowler's overs count
         if (Number.isInteger(matchData.currentBowler) && matchData.bowlers[matchData.currentBowler]) {
             const bowlerTotalBalls = matchData.bowlers[matchData.currentBowler].balls;
             matchData.bowlers[matchData.currentBowler].overs = Math.floor(bowlerTotalBalls / 6);
         }
       
        // CHANGED: Prompt for new bowler only if match/innings isn't over
         if (!matchData.matchOver && !matchData.allOut && matchData.balls < matchData.overs * 6) {
             const newBowlerName = prompt('End of Over. Enter next bowler name:');
              if (newBowlerName) {
                 let bowlerIndex = matchData.bowlers.findIndex(b => b.name === newBowlerName.trim());
                 if (bowlerIndex === -1) {
                     matchData.bowlers.push({ name: newBowlerName.trim(), overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 });
                     bowlerIndex = matchData.bowlers.length - 1;
                 }
                 matchData.currentBowler = bowlerIndex;
             } else {
                 alert("No bowler entered. Match cannot proceed without a bowler.");
                 matchData.matchOver = true; 
                 matchData.statusMessage = "Match halted: No bowler provided for next over.";
             }
         }
    }
    
    saveMatchData();
    updateDisplay();
}

function addCommentary(event) {
    // CHANGED: Added checks for valid player indices
    if (!Number.isInteger(matchData.currentStriker) || !Number.isInteger(matchData.currentBowler)) return; 
    
    const ballIndexJustBowled = matchData.balls - 1; // Ball index is based on balls *before* increment for commentary
    const over = Math.floor(ballIndexJustBowled / 6);
    const ball = (ballIndexJustBowled % 6) + 1;
    
    // CHANGED: Safer access to names
    const bowler = matchData.bowlers[matchData.currentBowler]?.name || 'Unknown Bowler';
    const batter = matchData.batters[matchData.currentStriker]?.name || 'Unknown Batter'; 
    
    let description;
    const eventStr = String(event);
    if (eventStr === 'W') {
        description = 'Wicket!';
    } else if (eventStr === '0'){
        description = 'no run';
    } else {
        const runValue = parseInt(eventStr, 10);
        // CHANGED: Handle potential NaN
        if (!isNaN(runValue)) {
            description = `${eventStr} run${runValue === 1 ? '' : 's'}`;
        } else {
            description = 'invalid event'; // Fallback for unexpected events
        }
    }
    
    matchData.commentary.push({
        over: over,
        ball: ball,
        bowler: bowler,
        batter: batter,
        event: eventStr,
        description: description,
        text: `${over}.${ball} ${bowler} to ${batter}, ${description}`
    });
}

function updateDisplay() {
    updateScoreDisplay();
    updateBattersTable();
    updateBowlerTable();
    updateCrrRrr();
    updateCurrentOver();
    // CHANGED: Update status message display
    updateStatusDisplay(); 
}

function updateScoreDisplay() {
    const overs = Math.floor(matchData.balls / 6);
    const balls = matchData.balls % 6;
    
    // CHANGED: Display formatting based on innings
    if (matchData.innings === 1) {
        scoreDisplay.innerHTML = `
            <strong>Innings 1: ${matchData.currentBattingTeam} ${matchData.totalRuns}/${matchData.wickets}</strong> 
            <br> Overs: ${overs}.${balls} (${matchData.overs}) 
            <br> vs ${matchData.currentBowlingTeam}
        `;
    } else { // Innings 2 or later (if extended)
        scoreDisplay.innerHTML = `
             <strong>Innings 2: ${matchData.currentBattingTeam} ${matchData.totalRuns}/${matchData.wickets}</strong> 
             <br> Overs: ${overs}.${balls} (${matchData.overs}) 
             <br> Target: ${matchData.firstInningsTotal + 1} (Chasing ${matchData.currentBowlingTeam}'s ${matchData.firstInningsTotal})
             ${matchData.matchOver ? '' : `<br> Need ${Math.max(0, matchData.firstInningsTotal + 1 - matchData.totalRuns)} runs from ${matchData.overs * 6 - matchData.balls} balls`}
        `;
    }
}

function updateBattersTable() {
    battersTable.innerHTML = ''; // Clear previous entries
    
    // CHANGED: Handle cases where strikers/non-strikers might not be set yet (e.g., innings break)
    const striker = Number.isInteger(matchData.currentStriker) ? matchData.batters[matchData.currentStriker] : null;
    const nonStriker = Number.isInteger(matchData.currentNonStriker) ? matchData.batters[matchData.currentNonStriker] : null;

    // Function to create a row
    const createBatterRow = (batter, isStriker) => {
        if (!batter || batter.out) return; // Don't display if null or out

        const row = document.createElement('tr');
        const sr = batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(2) : '0.00';
        row.innerHTML = `
            <td>${batter.name} ${isStriker ? '*' : ''}</td>
            <td>${batter.runs}</td>
            <td>${batter.balls}</td>
            <td>${batter.fours}</td>
            <td>${batter.sixes}</td>
            <td>${sr}</td>
        `;
        battersTable.appendChild(row);
    };

    // Add striker and non-striker rows
    if (striker) createBatterRow(striker, true);
    if (nonStriker) createBatterRow(nonStriker, false);

    // Optionally: Display 'out' batters for a full scorecard view (omitted for live view focus)
}


function updateBowlerTable() {
    bowlerTable.innerHTML = ''; // Clear previous entries

    // CHANGED: Handle case where bowler might not be set
    const bowler = Number.isInteger(matchData.currentBowler) ? matchData.bowlers[matchData.currentBowler] : null;

    if (bowler) {
        const row = document.createElement('tr');
        // CHANGED: Calculate current over balls more robustly
        const bowlerOvers = Math.floor(bowler.balls / 6);
        const bowlerBallsThisOver = bowler.balls % 6;
        // CHANGED: Calculate economy rate safely
        const economy = bowlerOvers > 0 || bowlerBallsThisOver > 0 ? (bowler.runs / (bowlerOvers + bowlerBallsThisOver / 6)).toFixed(2) : '0.00';

        row.innerHTML = `
            <td>${bowler.name} *</td> 
            <td>${bowlerOvers}.${bowlerBallsThisOver}</td>
            <td>${bowler.maidens}</td> 
            <td>${bowler.runs}</td>
            <td>${bowler.wickets}</td>
            <td>${economy}</td>
        `;
        bowlerTable.appendChild(row);
    } else {
         bowlerTable.innerHTML = '<tr><td colspan="6">Waiting for bowler...</td></tr>';
    }
     // Optionally: Display all bowlers who bowled (omitted for live view focus)
}

function updateCrrRrr() {
    const totalBallsBowled = matchData.balls;
    const oversCompleted = totalBallsBowled / 6; // Use fractional overs for accurate CRR
    const crr = oversCompleted > 0 ? (matchData.totalRuns / oversCompleted).toFixed(2) : '0.00';
    
    let rrr = 'N/A'; // Default for Innings 1
    let rrrHtml = '';
    if (matchData.innings === 2 && !matchData.matchOver) {
        const runsNeeded = matchData.firstInningsTotal - matchData.totalRuns + 1;
        const ballsRemaining = matchData.overs * 6 - totalBallsBowled;
        
        if (runsNeeded <= 0) {
            rrr = '0.00'; // Target achieved
        } else if (ballsRemaining <= 0) {
            rrr = '∞'; // Impossible to reach target
        } else {
             const oversRemaining = ballsRemaining / 6; // Use fractional overs
             rrr = (runsNeeded / oversRemaining).toFixed(2);
        }
        rrrHtml = `<p>Required Run Rate: <strong>${rrr}</strong></p>`;
    }
    
    crrRrrDisplay.innerHTML = `
        <p>Current Run Rate: <strong>${crr}</strong></p>
        ${rrrHtml}
    `;
}

function updateCurrentOver() {
    const currentOverEvents = [];
    // CHANGED: Calculate current over number correctly, even if balls === 0
    const currentOverNum = Math.floor(matchData.balls / 6); 
    const startBallIndexOfOver = currentOverNum * 6;
    
    // Find commentary entries for the balls already bowled in this over
    for (let i = 0; i < (matchData.balls % 6); i++) {
        const ballIndex = startBallIndexOfOver + i;
        // Find the commentary entry corresponding to the logical ball index (over*6 + ball_in_over - 1)
         const ballEvent = matchData.commentary.find(c => c.over === currentOverNum && c.ball === (i + 1));
         currentOverEvents.push(ballEvent ? String(ballEvent.event) : '?'); // Use '?' if event not found
    }

    // Fill remaining balls with '•'
    while (currentOverEvents.length < 6) {
        currentOverEvents.push('•');
    }
    
    // CHANGED: Display over number and bowler
    const bowlerName = (Number.isInteger(matchData.currentBowler) && matchData.bowlers[matchData.currentBowler]) ? matchData.bowlers[matchData.currentBowler].name : "---";
    currentOverDisplay.innerHTML = `
        <p>Over ${currentOverNum + 1} (Bowler: ${bowlerName}): ${currentOverEvents.join(' ')}</p>
    `;
}

// CHANGED: New function to display status messages
function updateStatusDisplay() {
    if (matchData.statusMessage && statusDisplay) {
        statusDisplay.textContent = matchData.statusMessage;
        statusDisplay.style.display = 'block'; // Make it visible
    } else if (statusDisplay) {
         statusDisplay.style.display = 'none'; // Hide if no message
    }
}

function saveMatchData() {
    localStorage.setItem('cricketMatchData', JSON.stringify(matchData));
}

// Keep original event listener for Enter key on modal submit
document.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        // Check if the modal is visible and the event target is inside the modal
        if (modal.style.display === 'flex' && modal.contains(event.target)) {
            const submitButton = document.getElementById('submit-names');
            if (submitButton) {
                event.preventDefault(); // Prevent default form submission if any
                submitButton.click();
            }
        }
    }
});