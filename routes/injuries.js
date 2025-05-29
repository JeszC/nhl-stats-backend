import express from "express";
import {getInjuries, getInjuriesForTeams} from "../scripts/routes/injuries.js";
import {getFromCache} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getInjuries", async (_request, response) => {
    let cacheKey = "allInjuries";
    let injuries = await getFromCache(cacheKey, () => getInjuries());
    if (injuries.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching injuries:", injuries.error.message);
        response.send(injuries.error.message);
    } else {
        response.json(injuries.data);
    }
});

router.get("/getInjuries/:teams", async (request, response) => {
    let teams = (request.params.teams).split("&");
    let cacheKey = `injuries${teams.join("")}`;
    let injuries = await getFromCache(cacheKey, () => getInjuriesForTeams(teams));
    if (injuries.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching injuries:", injuries.error.message);
        response.send(injuries.error.message);
    } else {
        response.json(injuries.data);
    }
});

export default router;
