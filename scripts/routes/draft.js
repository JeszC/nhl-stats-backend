import {addCountryFlag, getResponseData} from "../shared/utils.js";

/**
 * Returns the draft results for the given season.
 *
 * @param season Season ID with start and end year as one string (YYYYYYYY, e.g., 20232024).
 *
 * @returns {Promise<[]>} A promise containing the draft results in an array.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
export async function getDraftResults(season) {
    let response = await fetch(`https://records.nhl.com/site/api/draft?cayenneExp=draftYear=${season.slice(4)}`);
    return await getResponseData(response, "data");
}

/**
 * Adds a country flag image for all the draftees.
 *
 * @param draft Draftees.
 */
export function addCountryFlagForDraftees(draft) {
    if (!draft.wasCached) {
        draft.data.forEach(player => addCountryFlag(player, "countryCode"));
    }
}
