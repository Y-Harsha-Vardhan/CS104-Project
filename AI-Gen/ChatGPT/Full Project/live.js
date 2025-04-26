document.addEventListener("DOMContentLoaded", function () {
    let matchData = JSON.parse(localStorage.getItem("matchData"));
    document.getElementById("match-title").textContent = `${matchData.team1} vs ${matchData.team2}`;
    function updateScore(runs) {
        matchData.score.runs += runs;
        localStorage.setItem("matchData", JSON.stringify(matchData));
        document.getElementById("score-display").textContent = `${matchData.score.runs}/${matchData.score.wickets} (Overs: ${matchData.score.overs})`;
    }
    function registerWicket() {
        matchData.score.wickets++;
        localStorage.setItem("matchData", JSON.stringify(matchData));
        updateScore(0);
    }
    function viewScorecard() {
        window.location.href = "scorecard.html";
    }
    window.updateScore = updateScore;
    window.registerWicket = registerWicket;
    window.viewScorecard = viewScorecard;
});
