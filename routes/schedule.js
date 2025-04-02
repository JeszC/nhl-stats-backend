import express from "express";
import {
    addPenaltyTakerHeadshots,
    addScratchPlayerData,
    fixTeamPlaceNames,
    getGame,
    getRosters,
    getSchedule,
    getSeasons
} from "../scripts/routes/schedule.js";
import {getFromCache, getSeasonStartAndEndDates} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getSchedule/:season/:team", async (request, response) => {
    let cacheKey = `schedule${request.params.season}${request.params.team}`;
    let schedule = await getFromCache(cacheKey, getSchedule(request.params.season, request.params.team));
    if (schedule.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching schedules:", schedule.error.message);
        response.send(schedule.error.message);
    } else {
        response.json(schedule.data);
    }
});

router.get("/getGame/:gameID", async (request, response) => {
    let cacheKey = `scheduleGame${request.params.gameID}`;
    let game = await getFromCache(cacheKey, getGame(request.params.gameID));
    if (game.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching game:", game.error.message);
        response.send(game.error.message);
    } else {
        if (!game.wasCached && Object.keys(game.data).length > 0) {
            try {
                let rosters = await getRosters(game.data.awayTeam.abbrev, game.data.homeTeam.abbrev, game.data.season);
                fixTeamPlaceNames(game.data);
                addScratchPlayerData(game.data, rosters);
                addPenaltyTakerHeadshots(game.data, rosters);
            } catch (ignored) {
                /*
                 Do nothing because the roster fetch likely failed.
                 Most likely because of preseason games against international teams (international teams don't have
                 a valid endpoint on NHL API, so the fetch fails).
                 */
            }
        }
        response.json(game.data);
    }
});

router.get("/getSeasonDates/:season", async (request, response) => {
    let cacheKeySeasons = "scheduleSeasons";
    let cacheKeyDates = `scheduleSeasonDates${request.params.season}`;
    let seasons = await getFromCache(cacheKeySeasons, getSeasons());
    if (seasons.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching list of seasons:", seasons.error.message);
        response.send(seasons.error.message);
    } else {
        let dates = await getFromCache(cacheKeyDates, getSeasonStartAndEndDates(request.params.season, seasons.data));
        if (dates.error) {
            console.error(`${new Date().toLocaleString()}:`, "Error fetching season dates:", dates.error.message);
            response.send(dates.error.message);
        } else {
            response.json(dates.data);
        }
    }
});

export default router;
