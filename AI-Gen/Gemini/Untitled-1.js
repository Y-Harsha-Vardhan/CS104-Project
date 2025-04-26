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

    //Deleting any possibly leftover cricket match data from previous sessions
    localStorage.removeItem('cricketMatchData'); 

    //Redirecting the user to live.html page, within the same website
    window.location.href = "live.html";
}

//This ensures that the submit button is clicked, even if we just press enter in the page, without manually clicking it 
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
const statusDisplay = document.getElementById('status-message'); 

//Initializing the app using loadMatchData(); setupEventListeners(); and promptForPlayerNames() functions
document.addEventListener('DOMContentLoaded', function() {
    loadMatchData(); // Load existing match state first
    setupEventListeners();
    if (!matchData.matchOver && matchData.batters.length === 0 && matchData.currentStriker === null) {
        //Only showing the prompt if match isn't over and players aren't set up yet
         promptForPlayerNames();
    } else {
        //If data was loaded, updating the display immediately
        updateDisplay();
    }
});

//This function gets the match data that is stored as 'cricketMatchData' in the localStorage
//It then uses this data to call updateMatchData() function 
function loadMatchData() {
    const savedData = localStorage.getItem('cricketMatchData');
    if (savedData) {
        matchData = JSON.parse(savedData);
        //Ensuring loaded data types are correct if required
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
            if (matchData.matchOver) return;
            const runs = parseInt(this.getAttribute('data-runs'));
            addRuns(runs);
        });
    });

    //for wicket button
    wicketButton.addEventListener('click', function() {
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

//This function gives the text to be shown in the modal that appears when the live page is first loaded
//and when the first innings complete, and the second innings are about to start 
function promptForPlayerNames() {
    if (matchData.innings === 1 && matchData.batters.length === 0) {
        //This is displayed the first time in the first innings
        showNamePrompt(['Strike Batter', 'Non-Strike Batter', 'Opening Bowler']);
    } else if (matchData.innings === 2 && matchData.batters.length === 0) {
        //This is displayed when the second innings start
        showNamePrompt(['Strike Batter', 'Non-Strike Batter', 'Opening Bowler']);
    }
}

//This function takes input from the previous function (promptForPlayerNames) and 
//dynamically creates the placeholder text for the input fields in the modal
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
        input.id = field.toLowerCase().replace(/ /g, '-'); 
        nameInputs.appendChild(input);
    });
    
    modalTitle.textContent = (matchData.innings === 1) ? 'Enter Starting Players:' : 'Enter Players for 2nd Innings:';
}

//This function checks for the correctness of the player names entered, and then stores them
function submitPlayerNames() {
    if (matchData.innings === 1 && matchData.batters.length === 0) {
        //This is for the First innings 
        const strikeBatter = document.getElementById('strike-batter').value.trim();
        const nonStrikeBatter = document.getElementById('non-strike-batter').value.trim();
        const bowler = document.getElementById('bowler').value.trim();
        
        if (strikeBatter && nonStrikeBatter && bowler) {
            if (strikeBatter === nonStrikeBatter) {
                alert("Strike and Non-Strike batters must be different.");
                return;
            }
            
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
            
            modal.style.display = 'none';
            saveMatchData();
            updateDisplay();
        } else {
             alert("Please fill in all player names.");
        }

    } else if (matchData.innings === 2 && matchData.batters.length === 0) {
        //This is for the Second innings
        const strikeBatter = document.getElementById('strike-batter').value.trim();
        const nonStrikeBatter = document.getElementById('non-strike-batter').value.trim();
        const bowler = document.getElementById('opening-bowler').value.trim(); 
        
        if (strikeBatter && nonStrikeBatter && bowler) {
             if (strikeBatter === nonStrikeBatter) {
                alert("Strike and Non-Strike batters must be different.");
                return;
            }
            
            matchData.batters = [
                { name: strikeBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
                { name: nonStrikeBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false }
            ];
            
            matchData.currentStriker = 0;
            matchData.currentNonStriker = 1;

            let bowlerIndex = matchData.bowlers.findIndex(b => b.name === bowler);
            if (bowlerIndex === -1) {
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

//This function checks if the match has ended or if the innings has ended
function checkForEndOfMatchOrInnings() {
    const oversCompleted = matchData.balls >= matchData.overs * 6;
    const allOut = matchData.wickets >= 10; 

    if (matchData.innings === 1) {
        if (oversCompleted || allOut) {
            matchData.allOut = true; 
            startSecondInnings();
            return true; 
        }
    } else { 
        const targetReached = matchData.totalRuns > matchData.firstInningsTotal;
        if (targetReached) {
            endMatch(`${matchData.currentBattingTeam} won by ${10 - matchData.wickets} wicket(s)!`);
             return true;
        }
        if (oversCompleted || allOut) {
             if (matchData.totalRuns > matchData.firstInningsTotal) {
                 endMatch(`${matchData.currentBattingTeam} won by ${10 - matchData.wickets} wicket(s)!`);
             } else if (matchData.totalRuns === matchData.firstInningsTotal) {
                 endMatch("Match Tied!");
             } else {
                 endMatch(`${matchData.currentBowlingTeam} won by ${matchData.firstInningsTotal - matchData.totalRuns} run(s)!`);
             }
            return true; 
        }
    }
    return false; 
}

//This function handles the transition from the first innings to the second innings
function startSecondInnings() {
    matchData.firstInningsTotal = matchData.totalRuns;
    matchData.innings = 2;
    matchData.totalRuns = 0;
    matchData.wickets = 0;
    matchData.balls = 0;
    matchData.allOut = false; 
    matchData.batters = []; 
    matchData.commentary.push({ text: `--- End of Innings 1 --- Target: ${matchData.firstInningsTotal + 1} ---` }); 
    
    const previousBattingTeam = matchData.currentBattingTeam;
    matchData.currentBattingTeam = matchData.currentBowlingTeam;
    matchData.currentBowlingTeam = previousBattingTeam;

    matchData.currentStriker = null; 
    matchData.currentNonStriker = null;
    matchData.currentBowler = null; 

    alert(`End of Innings 1. ${matchData.currentBowlingTeam} scored ${matchData.firstInningsTotal}. Target for ${matchData.currentBattingTeam} is ${matchData.firstInningsTotal + 1}.`);

    saveMatchData();
    updateDisplay(); 
    promptForPlayerNames(); 
}

//This function handles the end of match
function endMatch(message) {
    matchData.matchOver = true;
    matchData.statusMessage = message;
    alert(message); 
    saveMatchData();
    updateDisplay(); 
    //This is to disable all the run buttons, so that score isn't altered any further
    runButtons.forEach(button => button.disabled = true);
    wicketButton.disabled = true;
}

//This function updates the scores of the batsman based on the value of the run button clicked
//Check the else statement here //
function addRuns(runs) {

    if (matchData.matchOver || matchData.allOut || !Number.isInteger(matchData.currentStriker)) return;
    
    matchData.batters[matchData.currentStriker].runs += runs;
    matchData.batters[matchData.currentStriker].balls++;
    
    if (runs === 4) matchData.batters[matchData.currentStriker].fours++;
    if (runs === 6) matchData.batters[matchData.currentStriker].sixes++;
    
    if (Number.isInteger(matchData.currentBowler) && matchData.bowlers[matchData.currentBowler]) {
        matchData.bowlers[matchData.currentBowler].runs += runs;
        matchData.bowlers[matchData.currentBowler].balls++;
    } else {
        console.error("Error: Current bowler not set correctly.");
        // Handle this error appropriately, maybe prompt for bowler again?
        return; // Stop processing if bowler isn't set
    }
    
    matchData.totalRuns += runs;
    matchData.balls++;
    
    addCommentary(runs); 

    if (checkForEndOfMatchOrInnings()) {
        saveMatchData(); 
        updateDisplay();
        return; 
    }

    if (runs % 2 !== 0 && matchData.balls % 6 !== 0) {
        if (Number.isInteger(matchData.currentNonStriker)) {
            [matchData.currentStriker, matchData.currentNonStriker] = [matchData.currentNonStriker, matchData.currentStriker];
        }
    }
    
    if (matchData.balls % 6 === 0 && matchData.balls > 0) {
        if (Number.isInteger(matchData.currentNonStriker)) {
            [matchData.currentStriker, matchData.currentNonStriker] = [matchData.currentNonStriker, matchData.currentStriker];
        }
        
         if (Number.isInteger(matchData.currentBowler) && matchData.bowlers[matchData.currentBowler]) {
             const bowlerTotalBalls = matchData.bowlers[matchData.currentBowler].balls;
             matchData.bowlers[matchData.currentBowler].overs = Math.floor(bowlerTotalBalls / 6); 
         }
       
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

//This function handles the tasks when the wicket button is clicked 
function takeWicket() {
    
    if (matchData.matchOver || matchData.allOut || matchData.wickets >= 10 || !Number.isInteger(matchData.currentStriker)) return; 
    
     if (Number.isInteger(matchData.currentBowler) && matchData.bowlers[matchData.currentBowler]) {
        matchData.bowlers[matchData.currentBowler].wickets++;
        matchData.bowlers[matchData.currentBowler].balls++;
     } else {
        console.error("Error: Current bowler not set correctly for wicket.");
        return; 
     }
    
    matchData.wickets++;
    matchData.balls++;
    
    if (matchData.batters[matchData.currentStriker]) {
        matchData.batters[matchData.currentStriker].out = true;
    }

    const outBatterName = matchData.batters[matchData.currentStriker]?.name || 'Batter'; 
    addCommentary('W'); 

    if (checkForEndOfMatchOrInnings()) {
        saveMatchData();
        updateDisplay();
        return;
    }
    
    if (matchData.wickets < 10) {
         const newBatterName = prompt(`${outBatterName} is out! Enter new batter name:`);
         if (newBatterName && newBatterName.trim()) {
            const nonStrikerName = matchData.batters[matchData.currentNonStriker]?.name;
            if (newBatterName.trim() === nonStrikerName) {
                 alert("New batter cannot be the same as the non-striker.");
                 matchData.matchOver = true; 
                 matchData.statusMessage = "Match halted: Invalid new batter provided.";
            } else {
                matchData.batters.push({ name: newBatterName.trim(), runs: 0, balls: 0, fours: 0, sixes: 0, out: false });
                matchData.currentStriker = matchData.batters.length - 1; 
            }
         } else {
             alert("No new batter entered. Match cannot proceed.");
             matchData.matchOver = true; 
             matchData.statusMessage = "Match halted: No new batter provided.";
         }
    } else {
         matchData.allOut = true;
    }

     if (!matchData.matchOver && matchData.balls % 6 === 0 && matchData.balls > 0) {
        
        if (Number.isInteger(matchData.currentNonStriker) && matchData.batters[matchData.currentNonStriker] && !matchData.batters[matchData.currentNonStriker].out) {
            [matchData.currentStriker, matchData.currentNonStriker] = [matchData.currentNonStriker, matchData.currentStriker];
        } else if (matchData.wickets < 10) {
             
        }
        
         if (Number.isInteger(matchData.currentBowler) && matchData.bowlers[matchData.currentBowler]) {
             const bowlerTotalBalls = matchData.bowlers[matchData.currentBowler].balls;
             matchData.bowlers[matchData.currentBowler].overs = Math.floor(bowlerTotalBalls / 6);
         }
       
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

    if (!Number.isInteger(matchData.currentStriker) || !Number.isInteger(matchData.currentBowler)) return; 
    
    const ballIndexJustBowled = matchData.balls - 1; 
    const over = Math.floor(ballIndexJustBowled / 6);
    const ball = (ballIndexJustBowled % 6) + 1;
    
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
        if (!isNaN(runValue)) {
            description = `${eventStr} run${runValue === 1 ? '' : 's'}`;
        } else {
            description = 'invalid event'; 
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

//This parent function calls all the other child functions that together will change the display of the runs and wickets in the entire page
function updateDisplay() {
    updateScoreDisplay();
    updateBattersTable();
    updateBowlerTable();
    updateCrrRrr();
    updateCurrentOver();
    updateStatusDisplay(); 
}

function updateScoreDisplay() {
    const overs = Math.floor(matchData.balls / 6);
    const balls = matchData.balls % 6;
    
    if (matchData.innings === 1) {
        scoreDisplay.innerHTML = `
            <strong>Innings 1: ${matchData.currentBattingTeam} ${matchData.totalRuns}/${matchData.wickets}</strong> 
            <br> Overs: ${overs}.${balls} (${matchData.overs}) 
            <br> vs ${matchData.currentBowlingTeam}
        `;
    } else { 
        scoreDisplay.innerHTML = `
             <strong>Innings 2: ${matchData.currentBattingTeam} ${matchData.totalRuns}/${matchData.wickets}</strong> 
             <br> Overs: ${overs}.${balls} (${matchData.overs}) 
             <br> Target: ${matchData.firstInningsTotal + 1} (Chasing ${matchData.currentBowlingTeam}'s ${matchData.firstInningsTotal})
             ${matchData.matchOver ? '' : `<br> Need ${Math.max(0, matchData.firstInningsTotal + 1 - matchData.totalRuns)} runs from ${matchData.overs * 6 - matchData.balls} balls`}
        `;
    }
}

function updateBattersTable() {
    battersTable.innerHTML = ''; 
    
    const striker = Number.isInteger(matchData.currentStriker) ? matchData.batters[matchData.currentStriker] : null;
    const nonStriker = Number.isInteger(matchData.currentNonStriker) ? matchData.batters[matchData.currentNonStriker] : null;

    //This function is to create a row
    const createBatterRow = (batter, isStriker) => {
        if (!batter || batter.out) return;

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

    if (striker) createBatterRow(striker, true);
    if (nonStriker) createBatterRow(nonStriker, false);

}


function updateBowlerTable() {
    bowlerTable.innerHTML = ''; 

    const bowler = Number.isInteger(matchData.currentBowler) ? matchData.bowlers[matchData.currentBowler] : null;

    if (bowler) {
        const row = document.createElement('tr');
        
        const bowlerOvers = Math.floor(bowler.balls / 6);
        const bowlerBallsThisOver = bowler.balls % 6;
       
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
     
}

function updateCrrRrr() {
    const totalBallsBowled = matchData.balls;
    const oversCompleted = totalBallsBowled / 6; 
    const crr = oversCompleted > 0 ? (matchData.totalRuns / oversCompleted).toFixed(2) : '0.00';
    
    let rrr = 'N/A'; 
    let rrrHtml = '';
    if (matchData.innings === 2 && !matchData.matchOver) {
        const runsNeeded = matchData.firstInningsTotal - matchData.totalRuns + 1;
        const ballsRemaining = matchData.overs * 6 - totalBallsBowled;
        
        if (runsNeeded <= 0) {
            rrr = '0.00'; 
        } else if (ballsRemaining <= 0) {
            rrr = '∞'; 
        } else {
             const oversRemaining = ballsRemaining / 6; 
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
    
    const currentOverNum = Math.floor(matchData.balls / 6); 
    const startBallIndexOfOver = currentOverNum * 6;
    
    for (let i = 0; i < (matchData.balls % 6); i++) {
        const ballIndex = startBallIndexOfOver + i;
         const ballEvent = matchData.commentary.find(c => c.over === currentOverNum && c.ball === (i + 1));
         currentOverEvents.push(ballEvent ? String(ballEvent.event) : '?'); // Use '?' if event not found
    }

    while (currentOverEvents.length < 6) {
        currentOverEvents.push('•');
    }
    
    const bowlerName = (Number.isInteger(matchData.currentBowler) && matchData.bowlers[matchData.currentBowler]) ? matchData.bowlers[matchData.currentBowler].name : "---";
    currentOverDisplay.innerHTML = `
        <p>Over ${currentOverNum + 1} (Bowler: ${bowlerName}): ${currentOverEvents.join(' ')}</p>
    `;
}

//This function displays the status message, if the match is halted or if the first innings is completed
function updateStatusDisplay() {
    if (matchData.statusMessage && statusDisplay) {
        statusDisplay.textContent = matchData.statusMessage;
        statusDisplay.style.display = 'block'; 
    } else if (statusDisplay) {
         statusDisplay.style.display = 'none'; 
    }
}

function saveMatchData() {
    localStorage.setItem('cricketMatchData', JSON.stringify(matchData));
}

//This will listen to click of keys, if the enter key is pressed
//It will automatically click on the submit names, without clicking on it manually 
document.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        if (modal.style.display === 'flex' && modal.contains(event.target)) {
            const submitButton = document.getElementById('submit-names');
            if (submitButton) {
                event.preventDefault(); 
                submitButton.click();
            }
        }
    }
});