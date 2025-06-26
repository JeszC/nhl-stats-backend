import express from "express";
import {getSignings} from "../scripts/routes/signings.js";
import {getFromCache, sendDataOrError} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getSignings/:pageOffset", async (request, response) => {
    let cacheKey = `signings${request.params.pageOffset}`;
    let signings = await getFromCache(cacheKey, () => getSignings(request.params.pageOffset), 3_600_000);
    await sendDataOrError(signings, response, "Error fetching signings:");
});

export default router;
