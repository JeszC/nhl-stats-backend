import express from "express";
import {getPlayoffSeries, getPlayoffTree} from "../scripts/routes/playoffs.js";
import {getFromCache, sendDataOrError} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getPlayoffTree/:season", async (request, response) => {
    let cacheKey = `playoffTree${request.params.season}`;
    let playoffTree = await getFromCache(cacheKey, () => getPlayoffTree(request.params.season));
    await sendDataOrError(playoffTree, response, "Error fetching playoff tree:");
});

router.get("/getPlayoffSeries/:season/:seriesLetter", async (request, response) => {
    let season = request.params.season;
    let seriesLetter = request.params.seriesLetter;
    let cacheKey = `playoffSeries${season}${seriesLetter}`;
    let playoffSeries = await getFromCache(cacheKey, () => getPlayoffSeries(season, seriesLetter));
    await sendDataOrError(playoffSeries, response, "Error fetching playoff series:");
});

export default router;
