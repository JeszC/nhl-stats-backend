import express from "express";
import {getStandings} from "../scripts/routes/standings.js";
import {getFromCache, sendDataOrError} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getStandings/:season", async (request, response) => {
    let cacheKey = `standings${request.params.season}`;
    let standings = await getFromCache(cacheKey, () => getStandings(request.params.season));
    await sendDataOrError(standings, response, "Error fetching standings:");
});

export default router;
