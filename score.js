//The below block contains the logic implementation for the setup.html page
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

//This function is called when the 'Start Match' Button is clicked
function startMatch() {

    //Assigning variables to the team1 and team2 names, toss-winner, toss-decision, overs-input and error messages
    const team1_name = document.getElementById("team1").value;
    const team2_name = document.getElementById("team2").value;
    const tossWinner = document.getElementById("toss-winner").value;
    const tossDecision = document.getElementById("toss-decision").value;
    const oversInput = document.getElementById("overs-input").value;
    let errorMessage_1 = document.getElementById("error-message-1");
    let errorMessage_2 = document.getElementById("error-message-2");

    //Resetting error messages initially to hidden
    errorMessage_1.innerText = "* Please enter Team-1 Name";
    errorMessage_2.innerText = "* Please enter Team-2 Name";
    errorMessage_1.style.visibility = "hidden";
    errorMessage_2.style.visibility = "hidden";

    //Using conditional statements to display error message when required
    if (!team1_name) {errorMessage_1.style.visibility = "visible"; return;}
    if (!team2_name) {errorMessage_2.style.visibility = "visible"; return;}
    if (team1_name==team2_name) {
        errorMessage_1.innerText = "* Both names cannot be same";
        errorMessage_2.innerText = "* Both names cannot be same";
        errorMessage_1.style.visibility = "visible";
        errorMessage_2.style.visibility = "visible"; 
        return;
    }
    
    //Storing the setup data in teamData object
    const teamData = {
        team1_name: team1_name,
        team2_name: team2_name,
        tossWinner: tossWinner === "team1" ? team1_name : team2_name,
        tossDecision: tossDecision,
        oversInput: oversInput
    };
    
    //This stores the teamData object in browser's local storage by converting it into a JSON string
    //This information is not lost if the page is refreshed or closed
    localStorage.setItem("teamData", JSON.stringify(teamData));

    //Clearing any leftover cricket match data from previous sessions
    localStorage.removeItem('cricketMatchData'); 

    //Redirecting the user to live.html page, within the same website
    window.location.href = "live.html";
}

//This ensures that the submit button is clicked, even if we just press enter in the page, without manually clicking on the button 
document.addEventListener("keydown", function(event) {
    if (event.key !== "Enter") {return;}

    const targetButton = document.querySelector("#start-match, #continue");
    if (targetButton && targetButton.offsetParent !== null) {
         event.preventDefault(); // Prevent default action
         targetButton.click();
    }
  });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//The below block contains the logic implementation for the live.html page
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Declaring all the global variables in a matchData object
let matchData = {
    team1: '', team2: '', tossWinner: '', tossDecision: '',
    innings: 1, 
    currentBattingTeam: '', currentBowlingTeam: '', overs: 2, balls: 0,
    totalRuns: 0, wickets: 0,
    batters: [], bowlers: [],
    currentStriker: null, currentNonStriker: null, currentBowler: null,
    extras: 0, firstInningsTotal: 0, firstInningsBatters: [], firstInningsBowlers: [],
    allOut: false, 
    commentary: [],
    matchOver: false,
    statusMessage: '',
    isFreeHit: false
};

//Assigning the names of the teams, tossWinners, tossDecisions and oversInput from the setup page to matchData
const storedTeamData = localStorage.getItem('teamData');
if (storedTeamData) {
    const teamData = JSON.parse(storedTeamData);
    matchData.team1 = teamData.team1_name;
    matchData.team2 = teamData.team2_name;
    matchData.tossWinner = teamData.tossWinner;
    matchData.tossDecision = teamData.tossDecision;
    if (teamData.oversInput >= 1) matchData.overs = teamData.oversInput;
} 

//DOM elements are assigned to variables using their id
const scoreDisplay = document.getElementById('score-display');
const battersTable = document.getElementById('batters-table').querySelector('tbody');
const bowlerTable = document.getElementById('bowling-table').querySelector('tbody');
const runButtons = document.querySelectorAll('.run-btn');
const wicketButton = document.getElementById('wicket-btn');
const wideButton = document.getElementById('wide-btn');
const runOutButton = document.getElementById('runOut-btn');
const noBallButton = document.getElementById('noBall-btn')
const scorecardButton = document.getElementById('scorecard-btn');
const modal = document.getElementById('name-prompt-modal');
const modalTitle = document.getElementById('modal-title');
const nameInputs = document.getElementById('name-inputs');
const submitNamesButton = document.getElementById('submit-names');
const crrRrrDisplay = document.getElementById('crr-and-rrr');
const currentOverDisplay = document.getElementById('current-over-data');
const statusDisplay = document.getElementById('status-message'); 

//Initializing the app using loadMatchData(); setupEventListeners(); promptForPlayerNames() and updateDisplay() functions
document.addEventListener('DOMContentLoaded', function() {
    loadMatchData(); 
    setupEventListeners();
    
    if (!matchData.matchOver && matchData.batters.length === 0 && matchData.currentStriker === null) {promptForPlayerNames();} 
    else {updateDisplay();}
});

//This function gets the match data that is stored as 'cricketMatchData' in the localStorage
function loadMatchData() {
    const savedData = localStorage.getItem('cricketMatchData');
    if (savedData) {matchData = JSON.parse(savedData);} 
}

//This function contains all the processes that happen when a button is clicked
//It calls addRuns() when a specific run button is clicked
//It calls takeWicket() when the wicket button is clicked
//It calls addWide(), promptForRunOut() and addNoBall() when respective buttons are clicked
//It redirects to scorecard.html, when scorecard button is clicked
//It calls submitPlayerNames() when the submit names button is clicked in the modal that appears when the page is first loaded
function setupEventListeners() {
    runButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (matchData.matchOver) return;
            const runs = parseInt(this.getAttribute('data-runs'));
            addRuns(runs);
        });
    });

    wicketButton.addEventListener('click', function() {
        if (matchData.matchOver) return;
        takeWicket();
    });

    wideButton.addEventListener('click', function () {
        if (matchData.matchOver) return;
        addWide();
    });

    runOutButton.addEventListener('click', function () {
        if (matchData.matchOver) return;
        promptForRunOut();
    })

    noBallButton.addEventListener('click', function () {
        if (matchData.matchOver) return;
        addNoBall();
    });

    scorecardButton.addEventListener('click', function() { window.location.href = 'scorecard.html';});

    submitNamesButton.addEventListener('click', function() {submitPlayerNames();});
}

//This function gives the text to be shown in the modal that appears when the live page is first loaded
//and when the first innings complete, and the second innings are about to start
function promptForPlayerNames() {
    if (matchData.innings === 1 && matchData.batters.length === 0) {showNamePrompt(['Strike Batter', 'Non-Strike Batter', 'Bowler']);} 

    else if (matchData.innings === 2 && matchData.batters.length === 0) {showNamePrompt(['Strike Batter', 'Non-Strike Batter', 'Opening Bowler']);}
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
    
    modalTitle.textContent = (matchData.innings === 1) ? 'Enter Starting Players' : 'Enter 2nd Innings Players';
}

//This function takes: title, message and callback as arguments and assigns title and message to respective elements in the modal
//It calls a function that is taken in as callback argument when the Continue Button of the Modal is clicked
function showModal(title, message, callback) {
    const modal = document.getElementById('message-modal');
    modal.style.display = 'flex';

    document.getElementById('custom_modal-title').textContent = title;
    document.getElementById('custom_modal-message').innerHTML = message;

    const btn = document.getElementById('continue')
    btn.onclick = () => {
        modal.style.display = 'none';
        if (callback) callback();
    };
}

//This function shows the error message in modal if the data entered is incorrect
function showModalError(message) {
    const errorElement = document.getElementById('modal-error');
    if (!errorElement) {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'modal-error';
        errorDiv.style.color = 'red';
        nameInputs.prepend(errorDiv);
    }
    document.getElementById('modal-error').textContent = message;

    const inputs = modal.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (document.getElementById('modal-error')) {document.getElementById('modal-error').textContent = '';}
        });
    });
}

//This function checks for the correctness of the player names entered, and then stores them
function submitPlayerNames() {
    //First innings
    if (matchData.innings === 1 && matchData.batters.length === 0) {
        const strikeBatter = document.getElementById('strike-batter').value.trim();
        const nonStrikeBatter = document.getElementById('non-strike-batter').value.trim();
        const bowler = document.getElementById('bowler').value.trim();
        const name1 = matchData.team1; const name2 = matchData.team2;
        
        if (strikeBatter && nonStrikeBatter && bowler) {
            if ([name1, name2].includes(strikeBatter) || [name1, name2].includes(nonStrikeBatter) || [name1, name2].includes(bowler)) {showModalError("Player Names can't be same as Team Names"); return;}
            if (strikeBatter === nonStrikeBatter) {showModalError("Strike and Non-Strike batters must be different."); return;}
            
            matchData.currentBattingTeam = matchData.tossDecision === 'bat' ? matchData.tossWinner : 
                                         (matchData.tossWinner === matchData.team1 ? matchData.team2 : matchData.team1);
            matchData.currentBowlingTeam = matchData.currentBattingTeam === matchData.team1 ? matchData.team2 : matchData.team1;
            
            matchData.batters = [
                { name: strikeBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
                { name: nonStrikeBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false }
            ];
            matchData.bowlers = [{ name: bowler, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 }];
    
            matchData.currentStriker = 0;
            matchData.currentNonStriker = 1;
            matchData.currentBowler = 0; 
            
            modal.style.display = 'none';
            saveMatchData();
            updateDisplay();
        } 
        else {showModalError("Please fill in all player names."); return;}

    } 

    //Second innings
    else if (matchData.innings === 2 && matchData.batters.length === 0) {
        const strikeBatter = document.getElementById('strike-batter').value.trim();
        const nonStrikeBatter = document.getElementById('non-strike-batter').value.trim();
        const bowler = document.getElementById('opening-bowler').value.trim(); 
        const name1 = matchData.team1; const name2 = matchData.team2;

        if (strikeBatter && nonStrikeBatter && bowler) {
            if ([name1, name2].includes(strikeBatter) || [name1, name2].includes(nonStrikeBatter) || [name1, name2].includes(bowler)) {showModalError("Player Names can't be same as Team Names"); return;}
            if (strikeBatter === nonStrikeBatter) {showModalError("Strike and Non-Strike batters must be different."); return;}
            
            if(isDuplicatePlayer(strikeBatter,'batting') || isDuplicatePlayer(nonStrikeBatter,'batting')) {showModalError("Invalid Batter Names"); return;}
            if(isDuplicatePlayer(bowler,'bowling')) {showModalError("Invalid Bowler Name"); return;}
            
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
        } 
        else {showModalError("Please fill in all player names."); return;}
    }
}

//This function checks if a player with the same name is already present in any one of the teams or not
function isDuplicatePlayer(name, team) {
    const innings = matchData.innings
    if (innings === 1) return (matchData.bowlers.some(b => b.name === name) || matchData.batters.some(b => b.name === name));
    if (innings === 2) {
        if (team == 'batting') return (matchData.batters.some(b => b.name === name) || matchData.bowlers.some(b => b.name === name) || matchData.firstInningsBatters.some(b => b.name === name));
        else return (matchData.batters.some(b => b.name === name) || matchData.bowlers.some(b => b.name === name) || matchData.firstInningsBowlers.some(b => b.name === name));
    }
}

//This function is used to show a prompt when a batsman gets out and handle the data insertion in various parts of the webpage
//It also checks the validity of the entered input using isDuplicatePlayer() and shows error if not.
function showNewBatterPrompt(outBatterName) {
    const originalSubmit = submitNamesButton.onclick;
    modal.style.display = 'flex';
    nameInputs.innerHTML = '';
    modalTitle.textContent = `${outBatterName} is out! Enter new batter`;
    
    const label = document.createElement('label');
    label.textContent = 'New Batter:';
    nameInputs.appendChild(label);
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter new batter name';
    input.id = 'new-batter';
    nameInputs.appendChild(input);
    
    if (document.getElementById('modal-error')) document.getElementById('modal-error').textContent = '';
    
    submitNamesButton.onclick = function() {
        const newBatter = document.getElementById('new-batter').value.trim();
        if (!newBatter) {showModalError("Please enter a batter name."); return;}
        if (isDuplicatePlayer(newBatter, 'batting')) {showModalError("Invalid Batter Name"); return;}
        
        matchData.batters.push({ 
            name: newBatter, 
            runs: 0, 
            balls: 0, 
            fours: 0, 
            sixes: 0, 
            out: false 
        });
        matchData.currentStriker = matchData.batters.length - 1;
        
        modal.style.display = 'none';
        submitNamesButton.onclick = originalSubmit;
        
        saveMatchData();
        updateDisplay();
    };
}

//This function is used to show a prompt when an over gets completed, to add a new bowler and handles it
//It also checks the validity of the entered input using isDuplicatePlayer() and shows error if not.
function showNewBowlerPrompt() {
    const originalSubmit = submitNamesButton.onclick;
    modal.style.display = 'flex';
    nameInputs.innerHTML = '';
    modalTitle.textContent = 'End of Over - Enter new bowler';
    
    const label = document.createElement('label');
    label.textContent = 'New Bowler:';
    nameInputs.appendChild(label);
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter new bowler name';
    input.id = 'new-bowler';
    nameInputs.appendChild(input);
    
    if (document.getElementById('modal-error')) document.getElementById('modal-error').textContent = '';

    submitNamesButton.onclick = function() {
        const newBowlerName = document.getElementById('new-bowler').value.trim();        
        if (!newBowlerName) {showModalError("Please enter a bowler name."); return;}
        if (isDuplicatePlayer(newBowlerName,'bowling')) {showModalError("Invalid Bowler Name"); return;}
        let bowlerIndex = matchData.bowlers.findIndex(b => b.name === newBowlerName);
        if (bowlerIndex === -1) {
            matchData.bowlers.push({ 
                name: newBowlerName, 
                overs: 0, 
                balls: 0, 
                maidens: 0, 
                runs: 0, 
                wickets: 0 
            });
            bowlerIndex = matchData.bowlers.length - 1;
        }
        matchData.currentBowler = bowlerIndex;
        
        modal.style.display = 'none';
        submitNamesButton.onclick = originalSubmit;
        
        saveMatchData();
        updateDisplay();
        
        if (!matchData.matchOver) {
            runButtons.forEach(btn => btn.disabled = false);
            wicketButton.disabled = false;
            wideButton.disabled = false;
            runOutButton.disabled = false;
        }
    };
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
            endMatch(`${matchData.currentBattingTeam} won by ${10 - matchData.wickets} wicket(s) (${matchData.overs*6 - matchData.balls} balls left)! `);
             return true; 
        }
        if (oversCompleted || allOut) {
            if (matchData.totalRuns > matchData.firstInningsTotal) {endMatch(`${matchData.currentBattingTeam} won by ${10 - matchData.wickets} wicket(s)!`);} 
            else if (matchData.totalRuns === matchData.firstInningsTotal) {endMatch("Match Tied!");} 
            else {endMatch(`${matchData.currentBowlingTeam} won by ${matchData.firstInningsTotal - matchData.totalRuns} run(s)!`);}
            return true; 
        }
    }
    return false; 
}

//This function handles the transition from the first innings to the second innings
function startSecondInnings() {
    matchData.firstInningsTotal = matchData.totalRuns; 
    matchData.firstInningsWickets = matchData.wickets;
    matchData.firstInningsBatters = matchData.batters;
    matchData.firstInningsBowlers = matchData.bowlers;
    let a = matchData.balls;
    let balls = a%6;
    let overs = (a - balls)/6;
    matchData.firstInningsBalls = overs.toString() + "." + balls.toString()
    matchData.innings = 2;
    matchData.totalRuns = 0;
    matchData.wickets = 0;
    matchData.balls = 0;
    matchData.allOut = false; 
    matchData.batters = [];
    matchData.bowlers = []; 
    matchData.commentary.push({ text: `--- End of Innings 1 --- Target: ${matchData.firstInningsTotal + 1} ---` });
    
    const previousBattingTeam = matchData.currentBattingTeam;
    matchData.currentBattingTeam = matchData.currentBowlingTeam;
    matchData.currentBowlingTeam = previousBattingTeam;

    matchData.currentStriker = null; 
    matchData.currentNonStriker = null;
    matchData.currentBowler = null; 

    showModal(
        "Innings Break!",
        `${matchData.currentBowlingTeam} scored ${matchData.firstInningsTotal}.<br>
        <strong>Target for ${matchData.currentBattingTeam}: ${matchData.firstInningsTotal + 1}</strong>`,
        promptForPlayerNames
    )
}

//This function handles the end of match
//And disables all control buttons, so that no change in score can take place
function endMatch(message) {
    matchData.matchOver = true;
    matchData.statusMessage = message;
    saveMatchData();
    updateDisplay(); 

    showModal("Match Over", "Thank you for following the match!", () => {
        setTimeout(() => {
            window.location.href = "summary.html";
        }, 2000);
    });

    runButtons.forEach(button => button.disabled = true);
    wicketButton.disabled = true;
    wideButton.disabled = true;
    runOutButton.disabled = true;
}

//This function updates the scores of the batsman based on the value of the run button clicked
//Check the else statement here //
function addRuns(runs) {
    if (matchData.matchOver || matchData.allOut || !Number.isInteger(matchData.currentStriker)) return; 
    consumeFreeHitIfNotExtra(false);
    
    matchData.batters[matchData.currentStriker].runs += runs;
    matchData.batters[matchData.currentStriker].balls++;
    
    if (runs === 4) matchData.batters[matchData.currentStriker].fours++;
    if (runs === 6) matchData.batters[matchData.currentStriker].sixes++;
    
    if (Number.isInteger(matchData.currentBowler) && matchData.bowlers[matchData.currentBowler]) {
        matchData.bowlers[matchData.currentBowler].runs += runs;
        matchData.bowlers[matchData.currentBowler].balls++;
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
        if (Number.isInteger(matchData.currentNonStriker)) {[matchData.currentStriker, matchData.currentNonStriker] = [matchData.currentNonStriker, matchData.currentStriker];}
    }
    
    if (matchData.balls % 6 === 0 && matchData.balls > 0) {
        if (Number.isInteger(matchData.currentNonStriker)) {[matchData.currentStriker, matchData.currentNonStriker] = [matchData.currentNonStriker, matchData.currentStriker];}
        
        if (Number.isInteger(matchData.currentBowler) && matchData.bowlers[matchData.currentBowler]) {
            const bowlerTotalBalls = matchData.bowlers[matchData.currentBowler].balls;
            matchData.bowlers[matchData.currentBowler].overs = Math.floor(bowlerTotalBalls / 6);      
        }
       
        if (!matchData.matchOver && !matchData.allOut && matchData.balls < matchData.overs * 6) {     
            runButtons.forEach(btn => btn.disabled = true)
            wicketButton.disabled = true;
            showNewBowlerPrompt()
            return;
        }
    }
    
    saveMatchData();
    updateDisplay();
}

//This function handles the tasks when the wicket button is clicked
function takeWicket() {
    if (matchData.matchOver || matchData.allOut || matchData.wickets >= 10 || !Number.isInteger(matchData.currentStriker)) return; 
    consumeFreeHitIfNotExtra(false);

    if (Number.isInteger(matchData.currentBowler) && matchData.bowlers[matchData.currentBowler]) {
        matchData.bowlers[matchData.currentBowler].wickets++;
        matchData.bowlers[matchData.currentBowler].balls++;
    } 
    
    matchData.wickets++;
    matchData.balls++;
    
    if (matchData.batters[matchData.currentStriker]) {matchData.batters[matchData.currentStriker].out = true;}

    const outBatterName = matchData.batters[matchData.currentStriker]?.name || 'Batter'; 
    addCommentary('W'); 

    if (checkForEndOfMatchOrInnings()) {
        saveMatchData(); 
        updateDisplay();
        return; 
    }
    
    if (matchData.wickets < 10) {
        const newBatterName = showNewBatterPrompt(outBatterName); 
        return;
    } else {matchData.allOut = true;}

    if (!matchData.matchOver && matchData.balls % 6 === 0 && matchData.balls > 0) {
        
        if (Number.isInteger(matchData.currentNonStriker) && matchData.batters[matchData.currentNonStriker] && !matchData.batters[matchData.currentNonStriker].out) {
            [matchData.currentStriker, matchData.currentNonStriker] = [matchData.currentNonStriker, matchData.currentStriker];
        } 

        if (Number.isInteger(matchData.currentBowler) && matchData.bowlers[matchData.currentBowler]) {
             const bowlerTotalBalls = matchData.bowlers[matchData.currentBowler].balls;
             matchData.bowlers[matchData.currentBowler].overs = Math.floor(bowlerTotalBalls / 6);
        }
       
         if (!matchData.matchOver && !matchData.allOut && matchData.balls < matchData.overs * 6) {
             const newBowlerName = showNewBowlerPrompt('End of Over. Enter next bowler name:');
                if (newBowlerName) {
                 let bowlerIndex = matchData.bowlers.findIndex(b => b.name === newBowlerName.trim());
                 if (bowlerIndex === -1) {
                     matchData.bowlers.push({ name: newBowlerName.trim(), overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 });
                     bowlerIndex = matchData.bowlers.length - 1;
                }
                matchData.currentBowler = bowlerIndex;
            }
        }
    }
    
    saveMatchData();
    updateDisplay();
}

//This function handles the tasks when the 'Wicket' Button is clicked
function addWide() {
    if (matchData.matchOver || matchData.allOut || !Number.isInteger(matchData.currentBowler)) return;
    consumeFreeHitIfNotExtra(true);

    matchData.extras += 1;
    matchData.totalRuns += 1;

    if (Number.isInteger(matchData.currentBowler) && matchData.bowlers[matchData.currentBowler]) {matchData.bowlers[matchData.currentBowler].runs += 1;}
    
    addCommentary('Wd');
    
    saveMatchData();
    updateDisplay();
}

//This function handles the tasks when 'No Ball' button is clicked
function addNoBall() {
    if (matchData.matchOver || matchData.allOut || !Number.isInteger(matchData.currentBowler)) return;
    consumeFreeHitIfNotExtra(true);

    matchData.extras += 1;
    matchData.totalRuns += 1;

    if (Number.isInteger(matchData.currentBowler) && matchData.bowlers[matchData.currentBowler]) {matchData.bowlers[matchData.currentBowler].runs += 1;}
    else {
        console.error("Error: Current bowler not set correctly for no-ball."); // [cite: 97]
        return;
    }

    matchData.isFreeHit = true;
    addCommentary('Nb');

    saveMatchData(); 
    updateDisplay(); 
}

//This is a helper function that is used to reset the Match to dafult state after a Free Hit is consumed
function consumeFreeHitIfNotExtra(isDeliveryExtra) {
    if (matchData.isFreeHit && !isDeliveryExtra) matchData.isFreeHit = false;
}

//This function dynamically creates and appends the labels and input fields to add a new batsman after a run out
//It then hides the created modal after clicking on the submit button
//It also checks if the Run Out is called at the end of an over and then calls showNewBowlerPrompt() to start the next over
function promptForRunOut() {
    const originalSubmit = submitNamesButton.onclick;
    
    modal.style.display = 'flex';
    nameInputs.innerHTML = '';
    modalTitle.textContent = 'Run Out! Enter runs scored and new batter';
    
    const runsLabel = document.createElement('label');
    runsLabel.textContent = 'Runs scored before out:';
    nameInputs.appendChild(runsLabel);
    
    const runsInput = document.createElement('input');
    runsInput.type = 'number';
    runsInput.min = '0';
    runsInput.placeholder = 'Enter runs (0 if no runs)';
    runsInput.id = 'run-out-runs';
    nameInputs.appendChild(runsInput);
    
    const batterLabel = document.createElement('label');
    batterLabel.textContent = 'New Batter:';
    nameInputs.appendChild(batterLabel);
    
    const batterInput = document.createElement('input');
    batterInput.type = 'text';
    batterInput.placeholder = 'Enter new batter name';
    batterInput.id = 'new-batter';
    nameInputs.appendChild(batterInput);
    
    if (document.getElementById('modal-error')) {document.getElementById('modal-error').textContent = '';}
    
    submitNamesButton.onclick = function() {
        const runs = parseInt(document.getElementById('run-out-runs').value) || 0;
        const newBatter = document.getElementById('new-batter').value.trim();
        const nonStrikerName = matchData.batters[matchData.currentNonStriker]?.name;
        
        if (!newBatter) {showModalError("Please enter a batter name."); return;}
        if (newBatter === nonStrikerName) {showModalError("New batter cannot be the same as the non-striker."); return;}
        if (isDuplicatePlayer(newBatter,'batting')) {showModalError("Invalid Batter Name"); return;}

        processRunOut(runs, newBatter);
        
        modal.style.display = 'none';
        submitNamesButton.onclick = originalSubmit;

        setTimeout(() => {
            if (!matchData.matchOver && !matchData.allOut && matchData.balls < matchData.overs * 6) {
                if (matchData.balls % 6 === 0 && matchData.balls > 0) {
                    runButtons.forEach(btn => btn.disabled = true);
                    wicketButton.disabled = true;
                    wideButton.disabled = true;
                    runOutButton.disabled = true;
                    showNewBowlerPrompt();
                }
            }
        }, 100);
        
    };
}

//This function takes runs, newBatterName as arguments and then updates the new batsman into the cricketMatchData
function processRunOut(runs, newBatterName) {

    if (matchData.matchOver || matchData.allOut || matchData.wickets >= 10) return;
    consumeFreeHitIfNotExtra(false); 
    const strikerBeforeRunout = matchData.currentStriker;
    const outBatterObject = matchData.batters[strikerBeforeRunout];
    const outBatterName = outBatterObject?.name || 'Batter';

    if (runs >= 0) {
        matchData.totalRuns += runs;
        matchData.batters[matchData.currentStriker].runs += runs;
        matchData.batters[matchData.currentStriker].balls++;
        
        if (Number.isInteger(matchData.currentBowler) && matchData.bowlers[matchData.currentBowler]) {
            matchData.bowlers[matchData.currentBowler].runs += runs;
            matchData.bowlers[matchData.currentBowler].balls++;
        }
    }

    matchData.wickets++;
    matchData.balls++; 
    
    matchData.batters[matchData.currentStriker].out = true;
    
    const originalNonStrikerIndex = matchData.currentNonStriker;
    
    matchData.batters.push({ 
        name: newBatterName, 
        runs: 0, 
        balls: 0, 
        fours: 0, 
        sixes: 0, 
        out: false 
    });
    const newBatterIndex = matchData.batters.length - 1;
    
    // --- Determines the Strike Batsman for Next Ball ---
    const crossed = runs % 2 !== 0; 
    const remainingBatterIndex = originalNonStrikerIndex;

    if (Number.isInteger(remainingBatterIndex) && matchData.batters[remainingBatterIndex] && !matchData.batters[remainingBatterIndex].out) {
        if (crossed) {
            matchData.currentStriker = remainingBatterIndex;
            matchData.currentNonStriker = newBatterIndex;
        } else {
            matchData.currentStriker = newBatterIndex;
            matchData.currentNonStriker = remainingBatterIndex;
        }
    } 
    else {
        matchData.currentStriker = newBatterIndex;
        matchData.currentNonStriker = null; 
        console.warn("Original non-striker was invalid or out during run out, setting new batter as striker.");
    }
    
    addCommentary(`Run Out (${runs})`, {runsOnEvent: runs, outBatterName: outBatterName});

    if (matchData.balls % 6 === 0 && matchData.balls > 0 && Number.isInteger(matchData.currentNonStriker)) {
        [matchData.currentStriker, matchData.currentNonStriker] = [matchData.currentNonStriker, matchData.currentStriker];
    }
    
    if (checkForEndOfMatchOrInnings()) {
        saveMatchData();
        updateDisplay();
        return;
    }
    
    saveMatchData();
    updateDisplay();
}

//This function handles the creation of the Commentary for every action performed in the Live Page
function addCommentary(eventCode, details = {}) {
    if (!Number.isInteger(matchData.currentStriker) || !Number.isInteger(matchData.currentBowler)) {
        console.warn("Cannot add commentary: Striker or Bowler not set.");
        return;
    }

    const bowler = matchData.bowlers[matchData.currentBowler];
    const batter = matchData.batters[matchData.currentStriker];

    if (!bowler || !batter) {console.warn("Cannot add commentary: Batter or Bowler object not found."); return;}

    let ballIndexForOverCalc;
    if (eventCode === 'Wd' || eventCode === 'Nb') {
        ballIndexForOverCalc = matchData.balls; 
    } else {
        ballIndexForOverCalc = matchData.balls - 1; 
        if (ballIndexForOverCalc < 0) ballIndexForOverCalc = 0;
    }

    const over = Math.floor(ballIndexForOverCalc / 6);
    const ballInOver = (ballIndexForOverCalc % 6) + 1;

    const bowlerName = bowler.name || 'Unknown Bowler';
    let batterName = batter.name || 'Unknown Batter';

    let description;
    let commentaryEventCode = String(eventCode);
    if (commentaryEventCode.startsWith('Run Out')) {commentaryEventCode = 'Ro';}
   
    switch (commentaryEventCode) {
        case 'W': description = 'WICKET!'; break;
        case 'Wd': description = 'Wide'; break;
        case 'Nb': description = 'No Ball'; break;
        case 'Wf': description = 'Wicket (Free Hit)'; break; 
        case 'Ro':
            const runs = details.runsOnEvent !== undefined ? details.runsOnEvent : '0';
            const runOutBatterName = details.outBatterName || batterName;
            batterName = runOutBatterName; 
            description = `Run Out (${runs})`;
            break;
        case '0': description = 'no run'; break;
        case '1': description = '1 run'; break;
        case '2': description = '2 runs'; break;
        case '3': description = '3 runs'; break;
        case '4': description = '4 runs'; break;
        case '6': description = '6 runs'; break;
        default:
            console.warn("Unknown commentary event code:", commentaryEventCode);
            description = `event: ${commentaryEventCode}`;
    }

    const commentaryText = `${over}.${ballInOver} ${bowlerName} to ${batterName}, ${description}`;
    
    matchData.commentary.push({
        innings: matchData.innings, over: over, ball: ballInOver,
        bowler: bowlerName, batter: batterName, event: commentaryEventCode, 
        runsOnEvent: details.runsOnEvent, 
        description: description, text: commentaryText
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

//This function updates the score display in the top of the live page container
function updateScoreDisplay() {
    const overs = Math.floor(matchData.balls / 6);
    const balls = matchData.balls % 6;
    let freeHitIndicator = matchData.isFreeHit ? ' <strong style="color: red;">(Free Hit)</strong>' : '';
    if (matchData.innings === 1) {
        scoreDisplay.innerHTML = `
            <strong> ${matchData.currentBattingTeam} ${matchData.totalRuns}/${matchData.wickets} (${overs}.${balls}) vs. ${matchData.currentBowlingTeam}</strong> ${freeHitIndicator} 
        `;
    } else { 
        scoreDisplay.innerHTML = `
             <strong> ${matchData.currentBattingTeam} ${matchData.totalRuns}/${matchData.wickets} (${overs}.${balls}) vs. ${matchData.currentBowlingTeam} ${matchData.firstInningsTotal}/${matchData.firstInningsWickets} (${matchData.firstInningsBalls}) </strong> ${freeHitIndicator}
             <br> Target: ${matchData.firstInningsTotal + 1} (Chasing ${matchData.currentBowlingTeam}'s ${matchData.firstInningsTotal})
             ${matchData.matchOver ? '' : `<br> Need ${Math.max(0, matchData.firstInningsTotal + 1 - matchData.totalRuns)} runs from ${matchData.overs * 6 - matchData.balls} balls`}
        `;
    }
}

//This function updates the batter table on the left side of the live page container
function updateBattersTable() {
    battersTable.innerHTML = ''; 
    
    const striker = Number.isInteger(matchData.currentStriker) ? matchData.batters[matchData.currentStriker] : null;
    const nonStriker = Number.isInteger(matchData.currentNonStriker) ? matchData.batters[matchData.currentNonStriker] : null;

    const createBatterRow = (batter, isStriker) => {
        if (!batter || batter.out) return; 

        const row = document.createElement('tr');
        const sr = batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(2) : '0.00';
        row.innerHTML = `
            <td class="player-name" data-player="${batter.name}">${batter.name} ${isStriker ? '*' : ''}</td>
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

//This function updates the bowler table on the right side of the live page container
function updateBowlerTable() {
    bowlerTable.innerHTML = ''; 

    const bowler = Number.isInteger(matchData.currentBowler) ? matchData.bowlers[matchData.currentBowler] : null;

    if (bowler) {
        const row = document.createElement('tr');
        
        const bowlerOvers = Math.floor(bowler.balls / 6);
        const bowlerBallsThisOver = bowler.balls % 6;
        
        const economy = bowlerOvers > 0 || bowlerBallsThisOver > 0 ? (bowler.runs / (bowlerOvers + bowlerBallsThisOver / 6)).toFixed(2) : '0.00';

        row.innerHTML = `
            <td class="player-name" data-player="${bowler.name}">${bowler.name} *</td> 
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

//This function updates the CRR and RRR in the live page
//It contains the logic by which the RRR and CRR are calculated
function updateCrrRrr() {
    const totalBallsBowled = matchData.balls;
    const oversCompleted = totalBallsBowled / 6; 
    const crr = oversCompleted > 0 ? (matchData.totalRuns / oversCompleted).toFixed(2) : '0.00';
    
    let rrr = 'N/A'; 
    let rrrHtml = '';
    if (matchData.innings === 2 && !matchData.matchOver) {
        const runsNeeded = matchData.firstInningsTotal - matchData.totalRuns + 1;
        const ballsRemaining = matchData.overs * 6 - totalBallsBowled;
        
        if (runsNeeded <= 0) { rrr = '0.00';}
        else if (ballsRemaining <= 0) { rrr = '∞'; } 
        else {
            const oversRemaining = ballsRemaining / 6; 
            rrr = (runsNeeded / oversRemaining).toFixed(2);
        }
        rrrHtml = `<p>Required Run Rate: <strong>${rrr}</strong></p>`;
    }
    
    crrRrrDisplay.innerHTML = `
        <br>
        <p>Current Run Rate: <strong>${crr}</strong></p>
        ${rrrHtml}
    `;
}

//This function updates the Current Over segment in the Live Page using the commentary data
function updateCurrentOver() {
    const currentOverEventsOutput = []; 
    let targetOverIndex = 0; 

    const currentInningsCommentary = matchData.commentary.filter(c => c.innings === matchData.innings);
    if (currentInningsCommentary.length > 0) {targetOverIndex = currentInningsCommentary[currentInningsCommentary.length - 1].over;} 
    else targetOverIndex = Math.floor(Math.max(0, matchData.balls) / 6);
    
    matchData.commentary.forEach(entry => {
        if (entry.innings === matchData.innings && entry.over === targetOverIndex) {
            let displayEvent;
            switch (entry.event) {
                case 'Wd':
                    displayEvent = 'WD'; 
                    break;
                case 'Nb':
                    displayEvent = 'NB'; 
                    break;
                case 'W':
                    displayEvent = 'W'; 
                    break;
                case 'Wf':
                     displayEvent = 'Wf'; 
                     break;
                case 'Ro':
                    displayEvent = `RO`;
                    break;
                case '0': case '1': case '2': case '3': case '4': case '6':
                    displayEvent = entry.event; 
                    break;
                default:
                    displayEvent = '?';
            }
            currentOverEventsOutput.push(displayEvent);
        }
    });

    const bowlerName = (Number.isInteger(matchData.currentBowler) && matchData.bowlers && matchData.bowlers[matchData.currentBowler])
                       ? matchData.bowlers[matchData.currentBowler].name
                       : "---"; 

    currentOverDisplay.innerHTML = `
        <p>Current Over:</p>
        <p class="over-balls">${currentOverEventsOutput.join(' ')}</p>
        <p>(Bowler: ${bowlerName})</p>
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

//This function saves all the information regarding the match in a JSON string in the localStorage
function saveMatchData() {
    localStorage.setItem('cricketMatchData', JSON.stringify(matchData));
}

//This will listen to click of keys, if the enter key is pressed
//It will automatically click on the submit names, without clicking on it manually
document.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        if (modal.style.display === 'flex' && modal.contains(event.target)) {
            const submitButton = document.getElementById('submit-names');
            if (submitButton) { event.preventDefault();  submitButton.click();}
        }
    }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//The below block contains the logic implementation of the scorecard.html page
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

//This function redirects to the previous page from which ViewScoreCard Btn is clicked
function goBack() { window.history.back();}

function formatOvers(balls) {
    const overs = Math.floor(balls/6);
    const remainingBalls = balls%6;
    return `${overs}.${remainingBalls}`;
}

//This function gets all the necessary data from the localStorage of the browser and stores it in arrays
//It then populates the tables using these arrays
function loadScorecard() {
    const MatchData = JSON.parse(localStorage.getItem('cricketMatchData'));
    if (!MatchData) return;

    const firstInningsBatters = MatchData.firstInningsBatters || [];
    const secondInningsBatters = MatchData.batters || [];
    const firstInningsBowlers = MatchData.firstInningsBowlers || [];
    const secondInningsBowlers = MatchData.bowlers;
    
    const battingData1 = firstInningsBatters || [];
    const bowlingData1 = firstInningsBowlers || [];
    const battingData2 = secondInningsBatters || [];
    const bowlingData2 = secondInningsBowlers || [];
  
    const battingTable = document.querySelector('#batting-scorecard tbody');
    const bowlingTable = document.querySelector('#bowling-scorecard tbody');

    if (!battingTable || !bowlingTable) return;

    battingTable.innerHTML = "";
    bowlingTable.innerHTML = "";
  
    //Populating the  Batting Table
    battingData1.forEach(player => {
        const strikeRate = player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(2) : "0.00";
        battingTable.innerHTML += `
            <tr class="team1-row">
                <td>${player.name}</td>
                <td>${player.runs}</td>
                <td>${player.balls}</td>
                <td>${player.fours}</td>
                <td>${player.sixes}</td>
                <td>${strikeRate}</td>
            </tr>
        `;
    });
    
    battingData2.forEach(player => {
        const strikeRate = player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(2) : "0.00";
        battingTable.innerHTML += `
            <tr class="team2-row">
                <td>${player.name}</td>
                <td>${player.runs}</td>
                <td>${player.balls}</td>
                <td>${player.fours}</td>
                <td>${player.sixes}</td>
                <td>${strikeRate}</td>
            </tr>
        `;
    });

    //Populating the Bowling Table
    bowlingData1.forEach(bowler => {
      const overs = formatOvers(bowler.balls);
      const economy = bowler.balls > 0 ? (bowler.runs / (bowler.balls / 6)).toFixed(2) : "0.00";
      bowlingTable.innerHTML += `
        <tr class="team2-row">
          <td>${bowler.name}</td>
          <td>${overs}</td>
          <td>${bowler.maidens}</td>
          <td>${bowler.runs}</td>
          <td>${bowler.wickets}</td>
          <td>${economy}</td>
        </tr>
      `;
    });
    
    bowlingData2.forEach(bowler => {
        const overs = formatOvers(bowler.balls);
        const economy = bowler.balls > 0 ? (bowler.runs / (bowler.balls / 6)).toFixed(2) : "0.00";
        bowlingTable.innerHTML += `
          <tr class="team1-row">
            <td>${bowler.name}</td>
            <td>${overs}</td>
            <td>${bowler.maidens}</td>
            <td>${bowler.runs}</td>
            <td>${bowler.wickets}</td>
            <td>${economy}</td>
          </tr>
        `;
    });

    //Calling the commentary function
    setupCommentaryHover();
}
  
function setupCommentaryHover() {
    const MatchData = JSON.parse(localStorage.getItem('cricketMatchData'));
    if (!MatchData || !MatchData.commentary) return;

    const commentary = MatchData.commentary;
    const batterCommentaryMap = {};
    const bowlerCommentaryMap = {};

    // Group commentaries by batter name
    commentary.forEach(entry => {
        if (!entry.batter || !entry.text) return;
        if (!batterCommentaryMap[entry.batter]) {
            batterCommentaryMap[entry.batter] = [];
        }
        batterCommentaryMap[entry.batter].push(entry.text);
    });

    // Group commentaries by bowler name
    commentary.forEach(entry => {
        if (!entry.bowler || !entry.text) return;
        if (!bowlerCommentaryMap[entry.bowler]) {
            bowlerCommentaryMap[entry.bowler] = [];
        }
        bowlerCommentaryMap[entry.bowler].push(entry.text);
    })

    // Attach hover events to each batsman and bowler rows
    const batterRows = document.querySelectorAll('#batting-scorecard tbody tr');
    const bowlerRows = document.querySelectorAll('#bowling-scorecard tbody tr');
    batterRows.forEach(row => {
        const playerName = row.children[0]?.textContent.trim();
        if (!playerName) return;

        row.addEventListener('mouseenter', () => {
            const popup = document.createElement('div');
            popup.className = 'commentary-popup';
            popup.innerHTML = batterCommentaryMap[playerName]?.length
                ? `<strong>${playerName}'s Commentary:</strong><ul>${batterCommentaryMap[playerName].map(line => `<li>${line}</li>`).join('')}</ul>`
                : `<em>No commentary yet for ${playerName}</em>`;

            document.body.appendChild(popup);
            const rect = row.getBoundingClientRect();
            popup.style.left = (rect.right + 10) + 'px';
            popup.style.top = rect.top + 'px';
        });

        row.addEventListener('mouseleave', () => {
            const popup = document.querySelector('.commentary-popup');
            if (popup) popup.remove();
        });
    });
    bowlerRows.forEach(row => {
        const playerName = row.children[0]?.textContent.trim();
        if(!playerName) return;

        row.addEventListener('mouseenter', () => {
            const popup = document.createElement('div');
            popup.className = 'commentary-popup';
            popup.innerHTML = bowlerCommentaryMap[playerName]?.length
                ? `<strong>${playerName}'s Commentary:</strong><ul>${bowlerCommentaryMap[playerName].map(line => `<li>${line}</li>`).join('')}</ul>`
                : `<em>No commentary yet for ${playerName}</em>`;

            document.body.appendChild(popup);
            const rect = row.getBoundingClientRect();
            popup.style.left = (rect.right + 10) + 'px';
            popup.style.top = rect.top + 'px';
        });

        row.addEventListener('mouseleave', () => {
            const popup = document.querySelector('.commentary-popup');
            if (popup) popup.remove();
        });
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//The below block contains the logic implementation of the summary.html page 
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

//This function gets the status-message from the localStorage of the web browser and 
//updates the result-display in the Summary Page
function displayResult() { 
    const resultDisplay = document.getElementById("match-result"); 
    if (resultDisplay) {
        const data = JSON.parse(localStorage.getItem('cricketMatchData') || '{}'); 
        resultDisplay.textContent = data.statusMessage || "Match status not available."; 
    }
}

//This function checks if either the Reset or View Scorecard buttons are clicked on the Summary Page
//If the Reset button is clicked, it first prompts the User if he surely wants to quit and then redirects to the Setup Page and clears all the match-data from localStorage
//If the View Scorecard button is clicked, it redirects to Scorecard Page
//It calls the diplayResult function when the page loads
function setupSummaryPage() {
    const resetButton = document.getElementById('reset-btn');
    const scorecardButtonSummary = document.querySelector('.summary-container #scorecard-btn'); 

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            const modal = document.getElementById('reset-modal');
            modal.style.display = 'flex';
            
            document.getElementById('reset-confirm').onclick = () => {
                localStorage.clear();
                window.location.href = 'setup.html';
            };
            
            document.getElementById('reset-cancel').onclick = () => {
                modal.style.display = 'none';
            };
        });
    }

    if(scorecardButtonSummary) {
        scorecardButtonSummary.addEventListener('click', function() {
            window.location.href = 'scorecard.html'; 
        });
    }

    displayResult();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////