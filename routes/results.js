import express from "express";
import {getGamesByDate} from "../scripts/routes/results.js";
import {getFromCache, sendDataOrError} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getResults/:date", async (request, response) => {
    let cacheKey = `results${request.params.date}`;
    let schedule = await getFromCache(cacheKey, () => getGamesByDate(request.params.date));
    await sendDataOrError(schedule, response, "Error fetching game results:");
});

export default router;
