import express from "express";
import {getPlayer, getPlayers} from "../scripts/routes/players.js";
import {getFromCache, sendDataOrError} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getPlayers/:team/:season", async (request, response) => {
    let cacheKey = `players${request.params.team}${request.params.season}`;
    let players = await getFromCache(cacheKey, () => getPlayers(request.params.team, request.params.season));
    await sendDataOrError(players, response, "Error fetching players:");
});

router.get("/getPlayer/:playerID", async (request, response) => {
    let cacheKey = `players${request.params.playerID}`;
    let player = await getFromCache(cacheKey, () => getPlayer(request.params.playerID));
    await sendDataOrError(player, response, "Error fetching player:");
});

export default router;
