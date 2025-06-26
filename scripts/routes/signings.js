import {getResponseData} from "../shared/utils.js";

/**
 * Returns an array of ten latest signings.
 *
 * @param {number} pageOffset An integer representing the 'page' that contains the signings. A bigger number represents
 * earlier signings. The argument should be in multiples of ten, e.g., 0, 10, 20, etc. For example, number 0 would
 * give the ten latest signings and number 10 would give the ten penultimate signings.
 *
 * @returns {Promise<{}>} A promise containing the trades in an array.
 *
 */
export async function getSignings(pageOffset) {
    let response = await fetch(`https://www.sportsnet.ca/wp-json/sportsnet/v1/signings-tracker?offset=${pageOffset}`);
    return await getResponseData(response);
}
