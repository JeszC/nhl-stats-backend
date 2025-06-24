import express from "express";
import {getTrophies, getTrophyWinners} from "../scripts/routes/awards.js";
import {getFromCache} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getTrophies", async (_request, response) => {
    let cacheKey = "trophies";
    let trophies = await getFromCache(cacheKey, () => getTrophies());
    if (trophies.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching trophies:", trophies.error.message);
        response.send(trophies.error.message);
    } else {
        let sortedData = trophies.data.sort((a, b) => a.seasonId - b.seasonId);
        response.json(sortedData);
    }
});

router.get("/getTrophyWinners/:trophyCategoryID/:trophyID", async (request, response) => {
    let category = request.params.trophyCategoryID;
    let trophy = request.params.trophyID;
    let cacheKey = `winners${category}${trophy}`;
    let winners = await getFromCache(cacheKey, () => getTrophyWinners(category, trophy));
    if (winners.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching trophy winners:", winners.error.message);
        response.send(winners.error.message);
    } else {
        response.json(winners.data);
    }
});

export default router;
