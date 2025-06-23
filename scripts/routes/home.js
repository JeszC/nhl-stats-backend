import {getResponseData, getResponsesData} from "../shared/utils.js";

const numberOfGamesToFetch = 12;
const numberOfPlayersToFetch = 10;

/**
 * Returns upcoming games from the given date onwards. The number of games is defined by the
 * numberOfGamesToFetch-variable.
 *
 * @param date Date from which onwards the games are fetched. Must be given as YYYY-MM-DD.
 *
 * @returns {Promise<[]>} A promise containing the upcoming games in an array.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
export async function getUpcomingGames(date) {
    let response = await fetch(`https://api-web.nhle.com/v1/schedule/${date}`);
    let weeklySchedule = await getResponseData(response);
    let gameWeek = weeklySchedule.gameWeek;
    let games = [];
    for (let day of gameWeek) {
        let dayGames = [];
        for (let game of day.games) {
            if (game.gameState !== "OFF" && game.gameState !== "FINAL") {
                dayGames.push(game);
            }
        }
        games = games.concat(dayGames);
    }
    let startDate = weeklySchedule.nextStartDate;
    while (games.length < numberOfGamesToFetch && startDate) {
        let response = await fetch(`https://api-web.nhle.com/v1/schedule/${startDate}`);
        let data = await getResponseData(response);
        let gameWeek = data.gameWeek;
        startDate = data.nextStartDate;
        for (let day of gameWeek) {
            let dayGames = [];
            for (let game of day.games) {
                if (game.gameState !== "OFF" && game.gameState !== "FINAL") {
                    dayGames.push(game);
                }
            }
            games = games.concat(dayGames);
        }
    }
    return games.slice(0, numberOfGamesToFetch);
}

/**
 * Returns the top ten skaters for the current season for both regular season and playoffs.
 *
 * @returns {Promise<{season: {}, playoff: {}}>} A promise containing the top skaters in a JSON object.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
export async function getTopTenSkaters() {
    let season = await getLatestSeason();
    let responses = await Promise.all([
        fetch(`https://api-web.nhle.com/v1/skater-stats-leaders/${season}/2?limit=${numberOfPlayersToFetch}`),
        fetch(`https://api-web.nhle.com/v1/skater-stats-leaders/${season}/3?limit=${numberOfPlayersToFetch}`)
    ]);
    let data = await getResponsesData(responses);
    let seasonSkaters = data[0];
    let playoffSkaters = data[1];
    return {
        season: seasonSkaters,
        playoff: playoffSkaters
    };
}

/**
 * Returns the top ten goalies for the current season for both regular season and playoffs.
 *
 * @returns {Promise<{season: {}, playoff: {}}>} A promise containing the top goalies in a JSON object.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
export async function getTopTenGoalies() {
    let season = await getLatestSeason();
    let responses = await Promise.all([
        fetch(`https://api-web.nhle.com/v1/goalie-stats-leaders/${season}/2?limit=${numberOfPlayersToFetch}`),
        fetch(`https://api-web.nhle.com/v1/goalie-stats-leaders/${season}/3?limit=${numberOfPlayersToFetch}`)
    ]);
    let data = await getResponsesData(responses);
    let seasonGoalies = data[0];
    let playoffGoalies = data[1];
    return {
        season: seasonGoalies,
        playoff: playoffGoalies
    };
}

/**
 * Fetches the latest team standings.
 *
 * @returns {Promise<[]>} A promise containing the team standings in an array.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
export async function getStandings() {
    let response = await fetch(`https://api-web.nhle.com/v1/standings/now`);
    return await getResponseData(response, "standings");
}

/**
 * Returns the latest (current) season ID (as YYYYYYYY, for example 20232024). If an upcoming season is already
 * listed but that season has not started yet, then the earlier season will be returned (since it is still
 * considered ongoing).
 *
 * @returns {Promise<string>} A promise containing the latest season as a string.
 *
 * @throws Error HTTP error if fetching the data fails.
 *
 * @see getLatestUpcomingSeason
 */
export async function getLatestSeason() {
    let response = await fetch("https://api-web.nhle.com/v1/standings-season");
    let seasons = await getResponseData(response, "seasons");
    let latestSeason = seasons[seasons.length - 1];
    let seasonStartDate = new Date(latestSeason.standingsStart);
    let today = new Date();
    if (today < seasonStartDate) {
        return seasons[seasons.length - 2].id.toString();
    }
    return latestSeason.id.toString();
}

/**
 * Returns the latest season ID (as YYYYYYYY, for example 20232024). If an upcoming season is already listed but
 * that season has not started yet, then that season will be returned.
 *
 * @returns {Promise<string>} A promise containing the latest season as a string.
 *
 * @throws Error HTTP error if fetching the data fails.
 *
 * @see getLatestSeason
 */
export async function getLatestUpcomingSeason() {
    let response = await fetch("https://api-web.nhle.com/v1/standings-season");
    let seasons = await getResponseData(response, "seasons");
    let latestSeason = seasons[seasons.length - 1];
    return latestSeason.id.toString();
}
