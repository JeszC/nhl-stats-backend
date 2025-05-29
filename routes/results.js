import express from "express";
import {getGamesByDate} from "../scripts/routes/results.js";
import {getFromCache} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getResults/:date", async (request, response) => {
    let cacheKey = `results${request.params.date}`;
    let schedule = await getFromCache(cacheKey, () => getGamesByDate(request.params.date));
    if (schedule.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching game results:", schedule.error.message);
        response.send(schedule.error.message);
    } else {
        response.json(schedule.data);
    }
});

export default router;
