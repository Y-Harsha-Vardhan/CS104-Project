document.addEventListener("DOMContentLoaded", function () {
    let matchData = JSON.parse(localStorage.getItem("matchData"));
    let summary = `Final Score: ${matchData.score.runs}/${matchData.score.wickets} (Overs: ${matchData.score.overs})`;
    document.getElementById("score-summary").textContent = summary;
    function restartMatch() {
        localStorage.removeItem("matchData");
        window.location.href = "setup.html";
    }
    window.restartMatch = restartMatch;
});
