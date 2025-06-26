import express from "express";
import {addCountryFlagForDraftees, getDraftResults} from "../scripts/routes/draft.js";
import {getFromCache, sendDataOrError} from "../scripts/shared/utils.js";

const router = express.Router();

router.get("/getDraftResults/:season", async (request, response) => {
    let cacheKey = `draft${request.params.season}`;
    let draft = await getFromCache(cacheKey, () => getDraftResults(request.params.season));
    await sendDataOrError(draft, response, "Error fetching draft results:", () => addCountryFlagForDraftees(draft));
});

export default router;
