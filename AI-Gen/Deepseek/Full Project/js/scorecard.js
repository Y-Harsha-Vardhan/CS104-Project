import { currentMatch, loadMatchData } from './score.js';

document.addEventListener('DOMContentLoaded', function() {
    loadMatchData();
    updateScorecard();
    
    document.getElementById('back-to-live').addEventListener('click', function() {
        window.location.href = 'live.html';
    });
    
    document.getElementById('view-summary').addEventListener('click', function() {
        window.location.href = 'summary.html';
    });
});

function updateScorecard() {
    updateMatchInfo();
    updateBattingScorecard();
    updateBowlingScorecard();
    updateExtras();
    updateFallOfWickets();
    updateCommentary();
}

function updateMatchInfo() {
    document.getElementById('scorecard-title').textContent = 
        `${currentMatch.team1} vs ${currentMatch.team2}`;
        
    const firstInningsOvers = currentMatch.overs;
    const firstInningsBalls = currentMatch.overs * 6;
    const secondInningsOvers = Math.floor(currentMatch.balls / 6);
    const secondInningsBalls = currentMatch.balls % 6;
    
    let scoreText = '';
    
    if (currentMatch.innings === 1) {
        scoreText = `
            <p><strong>${currentMatch.currentBattingTeam}</strong>: ${currentMatch.totalRuns}/${currentMatch.wickets} (${secondInningsOvers}.${secondInningsBalls})</p>
        `;
    } else {
        scoreText = `
            <p><strong>${currentMatch.team1}</strong>: ${currentMatch.tossDecision === 'bat' ? currentMatch.firstInningsTotal : currentMatch.totalRuns}</p>
            <p><strong>${currentMatch.team2}</strong>: ${currentMatch.tossDecision === 'bowl' ? currentMatch.firstInningsTotal : currentMatch.totalRuns}</p>
        `;
    }
    
    document.getElementById('scorecard-score-display').innerHTML = scoreText;
}

function updateBattingScorecard() {
    const table = document.getElementById('batting-scorecard').querySelector('tbody');
    table.innerHTML = '';
    
    currentMatch.batters.forEach(batter => {
        const row = document.createElement('tr');
        
        if (batter.out) {
            row.innerHTML = `
                <td>${batter.name}</td>
                <td>${batter.runs}</td>
                <td>${batter.balls}</td>
                <td>${batter.fours}</td>
                <td>${batter.sixes}</td>
                <td>${batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(2) : '0.00'}</td>
                <td>${batter.howOut}</td>
            `;
        } else {
            row.innerHTML = `
                <td>${batter.name} ${currentMatch.currentStriker === currentMatch.batters.indexOf(batter) ? '*' : 
                    currentMatch.currentNonStriker === currentMatch.batters.indexOf(batter) ? '+' : ''}</td>
                <td>${batter.runs}</td>
                <td>${batter.balls}</td>
                <td>${batter.fours}</td>
                <td>${batter.sixes}</td>
                <td>${batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(2) : '0.00'}</td>
                <td>not out</td>
            `;
        }
        
        table.appendChild(row);
    });
}

function updateBowlingScorecard() {
    const table = document.getElementById('bowling-scorecard').querySelector('tbody');
    table.innerHTML = '';
    
    currentMatch.bowlers.forEach(bowler => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${bowler.name}</td>
            <td>${bowler.overs}.${bowler.balls % 6}</td>
            <td>${bowler.maidens}</td>
            <td>${bowler.runs}</td>
            <td>${bowler.wickets}</td>
            <td>${bowler.overs > 0 ? (bowler.runs / bowler.overs).toFixed(2) : '0.00'}</td>
        `;
        table.appendChild(row);
    });
}

function updateExtras() {
    document.getElementById('scorecard-extras').innerHTML = `
        <p>Wides: ${currentMatch.extrasBreakdown.wides}</p>
        <p>No Balls: ${currentMatch.extrasBreakdown.noballs}</p>
        <p>Byes: ${currentMatch.extrasBreakdown.byes}</p>
        <p>Leg Byes: ${currentMatch.extrasBreakdown.legbyes}</p>
        <p><strong>Total Extras: ${currentMatch.extras}</strong></p>
    `;
}

function updateFallOfWickets() {
    const container = document.getElementById('fall-of-wickets');
    container.innerHTML = '';
    
    const wicketComments = currentMatch.commentary.filter(c => c.event === 'W' || c.event === 'RO');
    
    if (wicketComments.length === 0) {
        container.innerHTML = '<p>No wickets fallen yet</p>';
        return;
    }
    
    wicketComments.forEach((comment, index) => {
        const wicketItem = document.createElement('div');
        wicketItem.className = 'wicket-item';
        wicketItem.innerHTML = `
            <strong>${index + 1}-${comment.runsAtWicket || currentMatch.totalRuns}</strong>
            <p>${comment.batter} ${comment.description}</p>
            <small>${comment.over}.${comment.ball} overs</small>
        `;
        container.appendChild(wicketItem);
    });
}

function updateCommentary() {
    const container = document.getElementById('scorecard-commentary');
    container.innerHTML = '';
    
    if (currentMatch.commentary.length === 0) {
        container.innerHTML = '<p>No commentary yet</p>';
        return;
    }
    
    currentMatch.commentary.forEach(comment => {
        const entry = document.createElement('div');
        entry.className = 'commentary-entry';
        entry.textContent = comment.text;
        container.appendChild(entry);
    });
}