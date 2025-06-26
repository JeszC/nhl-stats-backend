import express from "express";
import {getTrades} from "../scripts/routes/trades.js";
import {getFromCache, sendDataOrError} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getTrades/:pageOffset", async (request, response) => {
    let cacheKey = `trades${request.params.pageOffset}`;
    let trades = await getFromCache(cacheKey, () => getTrades(request.params.pageOffset), 3_600_000);
    await sendDataOrError(trades, response, "Error fetching trades:");
});

export default router;
