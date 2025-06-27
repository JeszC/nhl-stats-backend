import {getResponseData} from "../shared/utils.js";

const baseURL = "https://records.nhl.com/site/api/award-details?cayenneExp=";
const playerFields = "&include=player.firstName&include=player.lastName&include=player.position";
const teamFields = "&include=team.placeName&include=team.commonName&include=team.triCode&include=team.logos&include=coach.firstName&include=coach.lastName&include=coach.id";

/**
 * Returns an array of all NHL trophies.
 *
 * @returns {Promise<{}>} A promise containing the array.
 */
export async function getTrophies() {
    let response = await fetch("https://records.nhl.com/site/api/trophy");
    return await getResponseData(response, "data");
}

/**
 * Returns the winner(s) and runner-ups for the given trophy for every season.
 *
 * @param {number} trophyCategoryID Trophy category ID.
 * @param {number} trophyID Trophy ID.
 *
 * @returns {Promise<{}>} A promise containing the winner(s) and runner-ups.
 */
export async function getTrophyWinners(trophyCategoryID, trophyID) {
    let url = `${baseURL}trophyCategoryId=${trophyCategoryID} and trophyId=${trophyID}${playerFields}${teamFields}`;
    let response = await fetch(url);
    return await getResponseData(response, "data");
}

/**
 * Sorts the winner array based on the season ID (latest season first).
 *
 * @param winners Trophy winners.
 */
export function sortWinnersBySeason(winners) {
    if (!winners.wasCached) {
        winners.data.sort((a, b) => -(a.seasonId - b.seasonId));
    }
}
