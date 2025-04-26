function startMatch() {
    let team1 = document.getElementById("team1").value;
    let team2 = document.getElementById("team2").value;
    let players = document.getElementById("players").value.split(",").map(p => p.trim());
    let bowler = document.getElementById("bowler").value;
    let matchData = { team1, team2, players, bowler, score: { runs: 0, wickets: 0, overs: 0 } };
    localStorage.setItem("matchData", JSON.stringify(matchData));
    window.location.href = "live.html";
}
