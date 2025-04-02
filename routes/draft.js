import express from "express";
import {getDraftResults} from "../scripts/routes/draft.js";
import {addCountryFlag, getFromCache} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getDraftResults/:season", async (request, response) => {
    let cacheKey = `draft${request.params.season}`;
    let draft = await getFromCache(cacheKey, getDraftResults(request.params.season));
    if (draft.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching draft results:", draft.error.message);
        response.send(draft.error.message);
    } else {
        if (!draft.wasCached) {
            draft.data.forEach(player => addCountryFlag(player, "countryCode"));
        }
        response.json(draft.data);
    }
});

export default router;
