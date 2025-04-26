import { currentMatch, matchHistory, loadMatchData, saveMatchData } from './score.js';

document.addEventListener('DOMContentLoaded', function() {
    loadMatchData();
    displayMatchResult();
    setupEventListeners();
});

function displayMatchResult() {
    const resultDisplay = document.getElementById('result-display');
    const team1Summary = document.getElementById('team1-summary');
    const team2Summary = document.getElementById('team2-summary');
    const motmDisplay = document.getElementById('man-of-the-match');
    
    if (!currentMatch.matchComplete) {
        resultDisplay.innerHTML = '<p class="result-text">Match in progress</p>';
        return;
    }
    
    const team1 = currentMatch.team1;
    const team2 = currentMatch.team2;
    const team1Score = currentMatch.tossDecision === 'bat' ? currentMatch.firstInningsTotal : currentMatch.totalRuns;
    const team2Score = currentMatch.tossDecision === 'bowl' ? currentMatch.firstInningsTotal : currentMatch.totalRuns;
    
    let resultText = '';
    let winner = '';
    
    if (team1Score > team2Score) {
        const margin = team1Score - team2Score;
        resultText = `${team1} wins by ${margin} runs!`;
        winner = team1;
    } else if (team2Score > team1Score) {
        const wicketsLeft = 10 - currentMatch.wickets;
        const ballsLeft = currentMatch.overs * 6 - currentMatch.balls;
        resultText = `${team2} wins by ${wicketsLeft} wickets (${ballsLeft} balls remaining)!`;
        winner = team2;
    } else {
        resultText = "Match tied!";
    }
    
    resultDisplay.innerHTML = `<p class="result-text">${resultText}</p>`;
    
    // Team summaries
    team1Summary.innerHTML = getTeamSummary(team1, team1Score);
    team2Summary.innerHTML = getTeamSummary(team2, team2Score);
    
    // Man of the match
    const motm = determineManOfTheMatch();
    motmDisplay.innerHTML = `
        <h3>Player of the Match</h3>
        <p><strong>${motm.name}</strong></p>
        <p>${motm.role === 'batter' ? 
            `${motm.runs} runs (${motm.balls} balls), SR: ${((motm.runs / motm.balls) * 100).toFixed(2)}` : 
            `${motm.wickets}/${motm.runs} in ${motm.overs}.${motm.balls % 6} overs, ER: ${(motm.runs / motm.overs).toFixed(2)}`}
        </p>
    `;
}

function getTeamSummary(team, score) {
    const isBattingFirst = (team === currentMatch.team1 && currentMatch.tossDecision === 'bat') || 
                         (team === currentMatch.team2 && currentMatch.tossDecision === 'bowl');
    
    const batters = currentMatch.batters.filter(b => 
        team === currentMatch.currentBattingTeam || 
        (isBattingFirst && currentMatch.innings === 1) ||
        (!isBattingFirst && currentMatch.innings === 2)
    );
    
    const bowlers = currentMatch.bowlers.filter(b => 
        team === currentMatch.currentBowlingTeam || 
        (isBattingFirst && currentMatch.innings === 2) ||
        (!isBattingFirst && currentMatch.innings === 1)
    );
    
    // Find top scorer
    const topScorer = batters.reduce((top, batter) => 
        batter.runs > top.runs ? batter : top, {runs: -1});
    
    // Find top bowler
    const topBowler = bowlers.reduce((top, bowler) => 
        bowler.wickets > top.wickets || 
        (bowler.wickets === top.wickets && bowler.runs < top.runs) ? bowler : top, {wickets: -1, runs: Infinity});
    
    return `
        <div class="team-summary">
            <h3>${team}</h3>
            <p><strong>${score}</strong> ${isBattingFirst ? `(First Innings)` : `(Second Innings)`}</p>
            
            <div class="top-scorer">
                <h4>Top Scorer</h4>
                ${topScorer.runs >= 0 ? `
                    <p>${topScorer.name}: ${topScorer.runs} runs</p>
                    <p>${topScorer.balls} balls, ${topScorer.fours} fours, ${topScorer.sixes} sixes</p>
                    <p>SR: ${((topScorer.runs / topScorer.balls) * 100).toFixed(2)}</p>
                ` : '<p>No batters</p>'}
            </div>
            
            <div class="top-bowler">
                <h4>Top Bowler</h4>
                ${topBowler.wickets >= 0 ? `
                    <p>${topBowler.name}: ${topBowler.wickets}/${topBowler.runs}</p>
                    <p>${topBowler.overs}.${topBowler.balls % 6} overs</p>
                    <p>ER: ${(topBowler.runs / topBowler.overs).toFixed(2)}</p>
                ` : '<p>No bowlers</p>'}
            </div>
        </div>
    `;
}

function determineManOfTheMatch() {
    // Find top batter (most runs, then better strike rate)
    const topBatter = [...currentMatch.batters].sort((a, b) => 
        b.runs - a.runs || (b.runs / b.balls) - (a.runs / a.balls));
    
    // Find top bowler (most wickets, then better economy)
    const topBowler = [...currentMatch.bowlers].sort((a, b) => 
        b.wickets - a.wickets || (a.runs / a.overs) - (b.runs / b.overs))[0];
    
    // Decide who had more impact
    if (topBatter.runs >= 30 || (topBatter.runs >= 20 && topBatter.balls <= 12)) {
        return {
            name: topBatter.name,
            role: 'batter',
            runs: topBatter.runs,
            balls: topBatter.balls,
            fours: topBatter.fours,
            sixes: topBatter.sixes
        };
    } else if (topBowler.wickets >= 2 || (topBowler.wickets >= 1 && topBowler.runs <= 8)) {
        return {
            name: topBowler.name,
            role: 'bowler',
            wickets: topBowler.wickets,
            runs: topBowler.runs,
            overs: topBowler.overs,
            balls: topBowler.balls
        };
    } else {
        // Default to top batter if no clear standout
        return {
            name: topBatter.name,
            role: 'batter',
            runs: topBatter.runs,
            balls: topBatter.balls,
            fours: topBatter.fours,
            sixes: topBatter.sixes
        };
    }
}

function setupEventListeners() {
    document.getElementById('new-match-btn').addEventListener('click', function() {
        sessionStorage.setItem('fromSummary', 'true');
        window.location.href = 'live.html';
    });
    
    document.getElementById('reset-all-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to reset all match data?')) {
            localStorage.removeItem('currentCricketMatch');
            localStorage.removeItem('cricketMatchHistory');
            window.location.href = 'setup.html';
        }
    });
    
    document.getElementById('view-scorecard-btn').addEventListener('click', function() {
        window.location.href = 'scorecard.html';
    });
}