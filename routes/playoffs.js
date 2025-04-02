import express from "express";
import {getPlayoffSeries, getPlayoffTree} from "../scripts/routes/playoffs.js";
import {getFromCache} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getPlayoffTree/:season", async (request, response) => {
    let cacheKey = `playoffTree${request.params.season}`;
    let playoffTree = await getFromCache(cacheKey, getPlayoffTree(request.params.season));
    if (playoffTree.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching playoff tree:", playoffTree.error.message);
        response.send(playoffTree.error.message);
    } else {
        response.json(playoffTree.data);
    }
});

router.get("/getPlayoffSeries/:season/:seriesLetter", async (request, response) => {
    let season = request.params.season;
    let seriesLetter = request.params.seriesLetter;
    let cacheKey = `playoffSeries${season}${seriesLetter}`;
    let playoffSeries = await getFromCache(cacheKey, getPlayoffSeries(season, seriesLetter));
    if (playoffSeries.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching playoff series:", playoffSeries.error.message);
        response.send(playoffSeries.error.message);
    } else {
        response.json(playoffSeries.data);
    }
});

export default router;
