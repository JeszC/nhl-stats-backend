import express from "express";
import {getListOfTeams, getTeamData} from "../scripts/routes/teams.js";
import {getFromCache, sendDataOrError} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getTeams/:season", async (request, response) => {
    let cacheKey = `teams${request.params.season}`;
    let teams = await getFromCache(cacheKey, () => getListOfTeams(request.params.season));
    await sendDataOrError(teams, response, "Error fetching teams:");
});

router.get("/getTeam/:team/:season", async (request, response) => {
    let cacheKey = `teams${request.params.team}${request.params.season}`;
    let team = await getFromCache(cacheKey, () => getTeamData(request.params.team, request.params.season));
    await sendDataOrError(team, response, "Error fetching team:");
});

export default router;
