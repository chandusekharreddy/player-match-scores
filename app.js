const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

app.use(express.json());

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

// API 1 GET all Players
app.get("/players/", async (request, response) => {
  const getPlayerDetailsQuery = `
    SELECT * FROM player_details;`;
  const playersArray = await db.all(getPlayerDetailsQuery);
  response.send(playersArray.map((eachPlayer) => convertDbObject(eachPlayer)));
});

// API 2 GET Single Player with player_id
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSinglePlayerQuery = `
    SELECT * FROM player_details WHERE player_id = ${playerId}`;
  const playerDetails = await db.get(getSinglePlayerQuery);
  response.send(convertDbObject(playerDetails));
});

// API 3 PUT Player Details
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `
  UPDATE
    player_details
  SET 
    player_name = '${playerName}'
  WHERE 
    player_id = ${playerId};`;

  await db.run(updateQuery);
  response.send("Player Details Updated");
});

const convertingMatchObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
// API 4 GET all match_details
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const responseQuery = await db.get(getMatchDetailsQuery);
  response.send(convertingMatchObject(responseQuery));
});

// API 5 GET all matches of player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
  SELECT * FROM player_match_score NATURAL JOIN match_details
  WHERE player_id = ${playerId};`;
  const responseQuery = await db.all(getPlayerMatchesQuery);
  response.send(
    responseQuery.map((eachObject) => convertingMatchObject(eachObject))
  );
});

// API 6 GET all players of specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getDetailsQuery = `
  SELECT * FROM player_match_score NATURAL JOIN player_details
  WHERE match_id = ${matchId};`;
  const responseQuery = await db.all(getDetailsQuery);
  response.send(responseQuery.map((eachPlayer) => convertDbObject(eachPlayer)));
});

// API 7 return total scores, fours, sixes of a specific player
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getTotalScoresQuery = `
  SELECT 
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
  FROM player_match_score
     NATURAL JOIN player_details
  WHERE player_id = ${playerId};`;
  const playerTotalScore = await db.get(getTotalScoresQuery);
  response.send(playerTotalScore);
});

module.exports = app;
