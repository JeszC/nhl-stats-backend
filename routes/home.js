import express from "express";
import {
    getLatestSeason,
    getLatestUpcomingSeason,
    getStandings,
    getTopTenGoalies,
    getTopTenSkaters,
    getUpcomingGames
} from "../scripts/routes/home.js";
import {getFromCache, sendDataOrError} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getUpcomingGames/:date", async (request, response) => {
    let cacheKey = `homeGames${request.params.date}`;
    let upcomingGames = await getFromCache(cacheKey, () => getUpcomingGames(request.params.date));
    await sendDataOrError(upcomingGames, response, "Error fetching upcoming games:");
});

router.get("/getTopTen/skaters", async (_request, response) => {
    let cacheKey = "homeSkaters";
    let skaters = await getFromCache(cacheKey, () => getTopTenSkaters());
    await sendDataOrError(skaters, response, "Error fetching top ten skaters:");
});

router.get("/getTopTen/goalies", async (_request, response) => {
    let cacheKey = "homeGoalies";
    let goalies = await getFromCache(cacheKey, () => getTopTenGoalies());
    await sendDataOrError(goalies, response, "Error fetching top ten goalies:");
});

router.get("/getTopTen/teams", async (_request, response) => {
    let cacheKey = "homeTeams";
    let teams = await getFromCache(cacheKey, () => getStandings());
    await sendDataOrError(teams, response, "Error fetching top ten teams:");
});

router.get("/getLatestSeason", async (_request, response) => {
    let cacheKey = "homeLatestSeason";
    let latestSeason = await getFromCache(cacheKey, () => getLatestSeason());
    await sendDataOrError(latestSeason, response, "Error fetching latest season:");
});

router.get("/getLatestUpcomingSeason", async (_request, response) => {
    let cacheKey = "homeLatestUpcomingSeason";
    let season = await getFromCache(cacheKey, () => getLatestUpcomingSeason());
    await sendDataOrError(season, response, "Error fetching upcoming season:");
});

export default router;
