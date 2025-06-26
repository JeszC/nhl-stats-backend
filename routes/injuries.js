import express from "express";
import {getInjuries, getInjuriesForTeams} from "../scripts/routes/injuries.js";
import {getFromCache, sendDataOrError} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getInjuries", async (_request, response) => {
    let cacheKey = "allInjuries";
    let injuries = await getFromCache(cacheKey, () => getInjuries());
    await sendDataOrError(injuries, response, "Error fetching injuries:");
});

router.get("/getInjuries/:teams", async (request, response) => {
    let teams = (request.params.teams).split("&");
    let cacheKey = `injuries${teams.join("")}`;
    let injuries = await getFromCache(cacheKey, () => getInjuriesForTeams(teams));
    await sendDataOrError(injuries, response, "Error fetching injuries:");
});

export default router;
