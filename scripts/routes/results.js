/**
 * Returns a week's worth of games from the given date onwards.
 *
 * @param date Date from which onwards the games are fetched. Must be given as YYYY-MM-DD.
 *
 * @returns {Promise<*[]>} A promise containing the games in an array.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
export async function getGamesByDate(date) {
    let response = await fetch(`https://api-web.nhle.com/v1/schedule/${date}`);
    if (response.ok) {
        let schedule = (await response.json()).gameWeek;
        let games = [];
        for (let day of schedule) {
            games = games.concat(day.games);
        }
        return games;
    }
    throw new Error("HTTP error");
}
