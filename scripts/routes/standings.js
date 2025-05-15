import {getLatestStandingsForSeason} from "../shared/utils.js";

/**
 * Returns the latest team standings with added data for the given season.
 *
 * @param season Season ID with start and end year as one string (YYYYYYYY, e.g., 20232024).
 *
 * @returns {Promise<[]>} A promise containing the latest team standings in an array.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
export async function getStandings(season) {
    let responses = await Promise.all([
        fetch(`https://api.nhle.com/stats/rest/en/team/summary?cayenneExp=seasonId=${season}`),
        fetch(`https://api.nhle.com/stats/rest/en/team/penalties?cayenneExp=seasonId=${season}`),
        fetch(`https://api.nhle.com/stats/rest/en/team/powerplay?cayenneExp=seasonId=${season}`),
        fetch(`https://api.nhle.com/stats/rest/en/team/penaltykill?cayenneExp=seasonId=${season}`),
        fetch(`https://api.nhle.com/stats/rest/en/team/faceoffwins?cayenneExp=seasonId=${season}`),
        fetch("https://api-web.nhle.com/v1/standings-season")
    ]);
    for (let response of responses) {
        if (!response.ok) {
            throw new Error("HTTP error");
        }
    }

    let shotData = (await responses[0].json()).data;
    let penaltyData = (await responses[1].json()).data;
    let powerPlayData = (await responses[2].json()).data;
    let penaltyKillData = (await responses[3].json()).data;
    let faceOffData = (await responses[4].json()).data;
    let seasons = (await responses[5].json()).seasons;
    let standings = await getLatestStandingsForSeason(season, seasons);
    if (standings.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching latest standings:", standings.error.message);
        throw new Error("HTTP error");
    }
    addDataToStandings(standings.data, shotData, penaltyData, powerPlayData, penaltyKillData, faceOffData);
    return standings.data;
}

/**
 * Adds the given data (power play, penalty kill etc.) to the standings.
 *
 * @param standings Standings to which the data is added.
 * @param shotData Shot data (shots for/against).
 * @param penaltyData Penalty data (penalty minutes).
 * @param powerPlayData Power play data (power play percentage).
 * @param penaltyKillData Penalty kill data (penalty kill percentage).
 * @param faceOffData Face-off data (face-off win percentage).
 */
function addDataToStandings(standings, shotData, penaltyData, powerPlayData, penaltyKillData, faceOffData) {
    shotData.sort((a, b) => a.teamFullName.localeCompare(b.teamFullName));
    penaltyData.sort((a, b) => a.teamFullName.localeCompare(b.teamFullName));
    powerPlayData.sort((a, b) => a.teamFullName.localeCompare(b.teamFullName));
    penaltyKillData.sort((a, b) => a.teamFullName.localeCompare(b.teamFullName));
    faceOffData.sort((a, b) => a.teamFullName.localeCompare(b.teamFullName));
    standings.sort((a, b) => a.teamName.default.localeCompare(b.teamName.default));
    if (shotData.length === standings.length) {
        for (let i = 0; i < shotData.length; i++) {
            standings[i].shotsForPerGame = shotData[i].shotsForPerGame;
            standings[i].shotsAgainstPerGame = shotData[i].shotsAgainstPerGame;
            standings[i].pimPerGame = penaltyData[i].penaltySecondsPerGame / 60;
            standings[i].powerPlayPct = powerPlayData[i].powerPlayNetPct;
            standings[i].penaltyKillPct = penaltyKillData[i].penaltyKillNetPct;
            standings[i].goalsAgainstPctg = standings[i].goalAgainst / standings[i].gamesPlayed;
            if (faceOffData.length > 0 && faceOffData[i].faceoffWinPct) {
                standings[i].faceOffWinPct = faceOffData[i].faceoffWinPct;
            }
        }
    }
    for (let team of standings) {
        team.totalLosses = team.losses + team.otLosses;
        team.overtimePlusShootoutWins = team.wins - team.regulationWins;
    }
}
