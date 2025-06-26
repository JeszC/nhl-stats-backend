import express from "express";
import {getTrophies, getTrophyWinners, sortWinnersBySeason} from "../scripts/routes/awards.js";
import {getFromCache, sendDataOrError} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getTrophies", async (_request, response) => {
    let cacheKey = "trophies";
    let trophies = await getFromCache(cacheKey, () => getTrophies(), 86_400_000);
    await sendDataOrError(trophies, response, "Error fetching trophies:");
});

router.get("/getTrophyWinners/:trophyCategoryID/:trophyID", async (request, response) => {
    let category = request.params.trophyCategoryID;
    let trophy = request.params.trophyID;
    let cacheKey = `winners${category}${trophy}`;
    let winners = await getFromCache(cacheKey, () => getTrophyWinners(category, trophy), 3_600_000);
    await sendDataOrError(winners, response, "Error fetching trophy winners:", () => sortWinnersBySeason(winners));
});

export default router;
