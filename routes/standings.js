import express from "express";
import {getStandings} from "../scripts/routes/standings.js";
import {getFromCache} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getStandings/:season", async (request, response) => {
    let cacheKey = `standings${request.params.season}`;
    let standings = await getFromCache(cacheKey, getStandings(request.params.season));
    if (standings.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching standings:", standings.error.message);
        response.send(standings.error.message);
    } else {
        response.json(standings.data);
    }
});

export default router;
