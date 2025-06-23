import {getLatestStandingsForSeason, getResponseData, getResponsesData} from "../shared/utils.js";

/**
 * Returns the playoff tree for the given season.
 *
 * @param season Season ID with start and end year as one string (YYYYYYYY, e.g., 20232024).
 *
 * @returns {Promise<{}>} A promise containing the playoff tree in a JSON object.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
export async function getPlayoffTree(season) {
    let responses = await Promise.all([
        fetch(`https://api-web.nhle.com/v1/playoff-bracket/${season.slice(4)}`),
        fetch("https://api-web.nhle.com/v1/standings-season")
    ]);
    let data = await getResponsesData(responses);
    let playoffTree = data[0];
    let seasons = data[1].seasons;
    let standings = await getLatestStandingsForSeason(season, seasons);
    if (standings.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching latest standings:", standings.error.message);
        throw new Error("HTTP error");
    }
    addSeriesData(playoffTree, season, standings.data);
    populatePlayoffTree(playoffTree);
    return playoffTree;
}

/**
 * Returns the playoff series for the given season and series letter.
 *
 * @param season Season ID with start and end year as one string (YYYYYYYY, e.g., 20232024).
 * @param seriesLetter Series letter (most likely between a and o).
 *
 * @returns {Promise<{}>} A promise containing the playoff series in a JSON object.
 *
 * @throws HTTP error if fetching the data fails.
 */
export async function getPlayoffSeries(season, seriesLetter) {
    let response = await fetch(`https://api-web.nhle.com/v1/schedule/playoff-series/${season}/${seriesLetter}`);
    let playoffSeries = await getResponseData(response);
    capitalizeRoundName(playoffSeries);
    return playoffSeries;
}

/**
 * Capitalizes the round label text (Stanley Cup final, 1st round, conference semifinals etc.).
 *
 * @param playoffSeries Playoff series whose data will be modified.
 */
function capitalizeRoundName(playoffSeries) {
    if (playoffSeries.roundLabel) {
        let words = playoffSeries.roundLabel.split("-");
        let capitalizedWords = [];
        for (let word of words) {
            if (word.toLowerCase() === "round") {
                capitalizedWords.push(word);
            } else {
                capitalizedWords.push(word.slice(0, 1).toUpperCase() + word.slice(1));
            }
        }
        playoffSeries.roundLabel = capitalizedWords.join(" ");
    }
}

/**
 * Adds conference/division and logo to teams in the given playoff tree.
 *
 * @param playoffTree Playoff tree to which the data will be added.
 * @param season Season ID.
 * @param standings Standings from which the conference/division data is added.
 */
function addSeriesData(playoffTree, season, standings) {
    if (playoffTree.series) {
        for (let series of playoffTree.series) {
            series.season = season;
            if (series.topSeedTeam) {
                addLogo(series.topSeedTeam);
                addConferenceAndDivision(series.topSeedTeam, standings);
            }
            if (series.bottomSeedTeam) {
                addLogo(series.bottomSeedTeam);
                addConferenceAndDivision(series.bottomSeedTeam, standings);
            }
        }
    }
}

/**
 * Populates the given playoff tree with placeholder data if necessary. This is to ensure certain keys are present
 * in the JSON data.
 *
 * @param playoffTree Playoff tree to which the data will be added.
 */
function populatePlayoffTree(playoffTree) {
    if (!playoffTree.series) {
        playoffTree.series = [];
    }
    const numberOfSeries = 15;
    let oldLength = playoffTree.series.length;
    if (numberOfSeries === oldLength) {
        for (let series of playoffTree.series) {
            if (!series.topSeedTeam) {
                series.topSeedTeam = {};
            }
            if (!series.bottomSeedTeam) {
                series.bottomSeedTeam = {};
            }
        }
    } else {
        for (let i = oldLength; i < numberOfSeries; i++) {
            let series = {
                seriesAbbrev: `N/A${i}`,
                seriesLetter: `N/A${i}`,
                topSeedTeam: {},
                bottomSeedTeam: {}
            };
            playoffTree.series.push(series);
        }
    }
}

/**
 * Replaces the default dark logo on the given team to the light logo.
 *
 * @param seriesTeam Team.
 */
function addLogo(seriesTeam) {
    if (seriesTeam.logo) {
        seriesTeam.logo = seriesTeam.logo.replace("dark", "light");
    }
}

/**
 * Adds conference and division to the given team from the standings.
 *
 * @param seriesTeam Team.
 * @param standings Standings.
 */
function addConferenceAndDivision(seriesTeam, standings) {
    for (let team of standings) {
        if (team.teamAbbrev.default === seriesTeam.abbrev) {
            seriesTeam.conference = team.conferenceAbbrev;
            seriesTeam.division = team.divisionAbbrev;
        }
    }
}
