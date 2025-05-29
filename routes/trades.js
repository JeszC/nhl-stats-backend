import express from "express";
import {getTrades} from "../scripts/routes/trades.js";
import {getFromCache} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getTrades/:pageOffset", async (request, response) => {
    let cacheKey = `trades${request.params.pageOffset}`;
    let trades = await getFromCache(cacheKey, () => getTrades(request.params.pageOffset), 3_600_000);
    if (trades.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching trades:", trades.error.message);
        response.send(trades.error.message);
    } else {
        response.json(trades.data);
    }
});

export default router;
