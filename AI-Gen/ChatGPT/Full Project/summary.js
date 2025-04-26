document.addEventListener("DOMContentLoaded", function () {
    let matchData = JSON.parse(localStorage.getItem("matchScore")) || {};
    
    document.getElementById("final-score").textContent = `Final Score: ${matchData.score.runs}/${matchData.score.wickets} (${matchData.score.overs.toFixed(1)})`;
    
    let battingSummary = document.getElementById("batting-summary");
    Object.values(matchData.battingStats).forEach(player => {
        let row = `<tr>
            <td>${player.name}</td>
            <td>${player.runs}</td>
            <td>${player.balls}</td>
            <td>${player.fours}</td>
            <td>${player.sixes}</td>
            <td>${(player.runs / (player.balls || 1) * 100).toFixed(2)}</td>
        </tr>`;
        battingSummary.innerHTML += row;
    });
    
    document.getElementById("bowler-summary").textContent = `${matchData.bowler.name} - ${matchData.bowler.overs} Overs, ${matchData.bowler.runs} Runs, ${matchData.bowler.wickets} Wickets`;
});
