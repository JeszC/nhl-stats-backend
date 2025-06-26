import express from "express";
import {addPlayerData, getGame, getSchedule, getSeasons} from "../scripts/routes/schedule.js";
import {getFromCache, getSeasonStartAndEndDates, sendDataOrError} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getSchedule/:season/:team", async (request, response) => {
    let cacheKey = `schedule${request.params.season}${request.params.team}`;
    let schedule = await getFromCache(cacheKey, () => getSchedule(request.params.season, request.params.team));
    await sendDataOrError(schedule, response, "Error fetching schedules:");
});

router.get("/getGame/:gameID", async (request, response) => {
    let cacheKey = `scheduleGame${request.params.gameID}`;
    let game = await getFromCache(cacheKey, () => getGame(request.params.gameID), 300_000);
    await sendDataOrError(game, response, "Error fetching game:", () => addPlayerData(game));
});

router.get("/getSeasonDates/:season", async (request, response) => {
    let cacheKeySeasons = "scheduleSeasons";
    let seasons = await getFromCache(cacheKeySeasons, () => getSeasons());
    if (seasons.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching list of seasons:", seasons.error.message);
        response.send(seasons.error.message);
    } else {
        let cacheKeyDates = `scheduleSeasonDates${request.params.season}`;
        let dates = await getFromCache(cacheKeyDates, () => getSeasonStartAndEndDates(request.params.season, seasons.data));
        if (dates.error) {
            console.error(`${new Date().toLocaleString()}:`, "Error fetching season dates:", dates.error.message);
            response.send(dates.error.message);
        } else {
            response.json(dates.data);
        }
    }
});

export default router;
