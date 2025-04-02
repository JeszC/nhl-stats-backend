import express from "express";
import {getListOfTeams, getTeamData} from "../scripts/routes/teams.js";
import {getFromCache} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getTeams/:season", async (request, response) => {
    let cacheKey = `teams${request.params.season}`;
    let teams = await getFromCache(cacheKey, getListOfTeams(request.params.season));
    if (teams.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching teams:", teams.error.message);
        response.send(teams.error.message);
    } else {
        response.json(teams.data);
    }
});

router.get("/getTeam/:team/:season", async (request, response) => {
    let cacheKey = `teams${request.params.team}${request.params.season}`;
    let team = await getFromCache(cacheKey, getTeamData(request.params.team, request.params.season));
    if (team.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching team:", team.error.message);
        response.send(team.error.message);
    } else {
        response.json(team.data);
    }
});

export default router;
