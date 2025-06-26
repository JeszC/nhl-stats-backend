import express from "express";
import {getSignings} from "../scripts/routes/signings.js";
import {getFromCache} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getSignings/:pageOffset", async (request, response) => {
    let cacheKey = `signings${request.params.pageOffset}`;
    let signings = await getFromCache(cacheKey, () => getSignings(request.params.pageOffset), 3_600_000);
    if (signings.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching signings:", signings.error.message);
        response.send(signings.error.message);
    } else {
        response.json(signings.data);
    }
});

export default router;
