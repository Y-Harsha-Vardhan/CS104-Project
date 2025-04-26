document.addEventListener('DOMContentLoaded', function() {
    const setupForm = document.getElementById('setup-form');
    
    setupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const team1 = document.getElementById('team1').value;
        const team2 = document.getElementById('team2').value;
        const tossWinner = document.getElementById('toss-winner').value;
        const tossDecision = document.getElementById('toss-decision').value;
        const overs = parseInt(document.getElementById('overs').value);
        
        if (!team1 || !team2 || !tossWinner || !tossDecision) {
            alert('Please fill all fields');
            return;
        }
        
        const matchData = {
            team1,
            team2,
            tossWinner: tossWinner === 'team1' ? team1 : team2,
            tossDecision,
            overs,
            innings: 1,
            currentBattingTeam: '',
            currentBowlingTeam: '',
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
        matchData.currentBattingTeam = tossDecision === 'bat' ? matchData.tossWinner : 
                                     (matchData.tossWinner === matchData.team1 ? matchData.team2 : matchData.team1);
        matchData.currentBowlingTeam = matchData.currentBattingTeam === matchData.team1 ? matchData.team2 : matchData.team1;
        
        localStorage.setItem('currentCricketMatch', JSON.stringify(matchData));
        localStorage.setItem('cricketMatchHistory', JSON.stringify([]));
        
        window.location.href = 'live.html';
    });
});