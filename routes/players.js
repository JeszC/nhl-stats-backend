import express from "express";
import {getPlayer, getPlayers} from "../scripts/routes/players.js";
import {getFromCache} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getPlayers/:team/:season", async (request, response) => {
    let cacheKey = `players${request.params.team}${request.params.season}`;
    let players = await getFromCache(cacheKey, () => getPlayers(request.params.team, request.params.season));
    if (players.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching players:", players.error.message);
        response.send(players.error.message);
    } else {
        response.json(players.data);
    }
});

router.get("/getPlayer/:playerID", async (request, response) => {
    let cacheKey = `players${request.params.playerID}`;
    let player = await getFromCache(cacheKey, () => getPlayer(request.params.playerID));
    if (player.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching player:", player.error.message);
        response.send(player.error.message);
    } else {
        response.json(player.data);
    }
});

export default router;
