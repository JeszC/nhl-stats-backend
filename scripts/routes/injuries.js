const url = "https://datacrunch.9c9media.ca/statsapi/sports/hockey/leagues/nhl/playerInjuries?type=json";

/**
 * Comparison function for date. Newest date is sorted first.
 *
 * @param date1 Date 1.
 * @param date2 Date 2.
 * @returns {number} A negative number, a positive number, or 0.
 */
function compareDate(date1, date2) {
    let dateA = new Date(date1.date);
    let dateB = new Date(date2.date);
    return dateA > dateB ? -1 : 1;
}

/**
 * Returns injuries for all teams.
 *
 * @returns {Promise<[]>} A promise containing the injuries in an array.
 */
export async function getInjuries() {
    let response = await fetch(url);
    if (response.ok) {
        let data = await response.json();
        let injuries = [];
        for (let team of data) {
            if (team.playerInjuries && team.playerInjuries.length > 0) {
                for (let injury of team.playerInjuries) {
                    injury.teamAbbrev = team.competitor?.shortName;
                    injury.teamName = team.competitor?.name;
                    injuries.push(injury);
                }
            }
        }
        injuries.sort(compareDate);
        return injuries;
    }
    throw new Error("HTTP error");
}

/**
 * Returns injuries for the given teams.
 *
 * @param teams Array consisting of three-letter team abbreviations.
 *
 * @returns {Promise<{}>} JSON object containing the teams' injuries.
 */
export async function getInjuriesForTeams(teams) {
    let response = await fetch(url);
    if (response.ok) {
        let data = await response.json();
        let injuries = [];
        for (let team of teams) {
            for (let teamData of data) {
                if (teamData.competitor?.shortName.toLowerCase().trim() === team.toLowerCase().trim()) {
                    injuries.push(teamData);
                }
            }
        }
        return injuries;
    }
    throw new Error("HTTP error");
}
