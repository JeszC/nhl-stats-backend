import express from "express";
import {
    getLatestSeason,
    getLatestUpcomingSeason,
    getStandings,
    getTopTenGoalies,
    getTopTenSkaters,
    getUpcomingGames
} from "../scripts/routes/home.js";
import {getFromCache} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getUpcomingGames/:date", async (request, response) => {
    let cacheKey = `homeGames${request.params.date}`;
    let upcomingGames = await getFromCache(cacheKey, getUpcomingGames(request.params.date));
    if (upcomingGames.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching upcoming games:", upcomingGames.error.message);
        response.send(upcomingGames.error.message);
    } else {
        response.json(upcomingGames.data);
    }
});

router.get("/getTopTen/skaters", async (_request, response) => {
    let cacheKey = "homeSkaters";
    let skaters = await getFromCache(cacheKey, getTopTenSkaters());
    if (skaters.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching top ten skaters:", skaters.error.message);
        response.send(skaters.error.message);
    } else {
        response.json(skaters.data);
    }
});

router.get("/getTopTen/goalies", async (_request, response) => {
    let cacheKey = "homeGoalies";
    let goalies = await getFromCache(cacheKey, getTopTenGoalies());
    if (goalies.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching top ten goalies:", goalies.error.message);
        response.send(goalies.error.message);
    } else {
        response.json(goalies.data);
    }
});

router.get("/getTopTen/teams", async (_request, response) => {
    let cacheKey = "homeTeams";
    let teams = await getFromCache(cacheKey, getStandings());
    if (teams.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching top ten teams:", teams.error.message);
        response.send(teams.error.message);
    } else {
        response.json(teams.data);
    }
});

router.get("/getLatestSeason", async (_request, response) => {
    let cacheKey = "homeLatestSeason";
    let latestSeason = await getFromCache(cacheKey, getLatestSeason());
    if (latestSeason.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching latest season:", latestSeason.error.message);
        response.send(latestSeason.error.message);
    } else {
        response.json(latestSeason.data);
    }
});

router.get("/getLatestUpcomingSeason", async (_request, response) => {
    let cacheKey = "homeLatestUpcomingSeason";
    let season = await getFromCache(cacheKey, getLatestUpcomingSeason());
    if (season.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching upcoming season:", season.error.message);
        response.send(season.error.message);
    } else {
        response.json(season.data);
    }
});

export default router;
