import {addCountryFlag} from "../shared/utils.js";

/**
 * Returns the schedule for the given team for the given season.
 *
 * @param season Season ID with start and end year as one string (YYYYYYYY, e.g., 20232024).
 * @param team Three-letter team abbreviation.
 *
 * @returns {Promise<{}>} A promise containing the schedule in a JSON object.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
export async function getSchedule(season, team) {
    let response = await fetch(`https://api-web.nhle.com/v1/club-schedule-season/${team}/${season}`);
    if (!response.ok) {
        throw new Error("HTTP error");
    }
    return await response.json();
}

/**
 * Returns the game information for the given game ID.
 *
 * @param gameID Game ID.
 *
 * @returns {Promise<{}>} A promise containing the game information in a JSON object.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
export async function getGame(gameID) {
    let responses = await Promise.all([
        fetch(`https://api-web.nhle.com/v1/gamecenter/${gameID}/landing`),
        fetch(`https://api-web.nhle.com/v1/gamecenter/${gameID}/right-rail`),
        fetch(`https://api-web.nhle.com/v1/gamecenter/${gameID}/boxscore`),
        fetch(`https://api-web.nhle.com/v1/gamecenter/${gameID}/play-by-play`),
        fetch("https://records.nhl.com/site/api/officials")
    ]);
    for (let response of responses) {
        if (!response.ok) {
            throw new Error("HTTP error");
        }
    }
    let gameData = await responses[0].json();
    let gameStats = await responses[1].json();
    if (gameData.matchup) {
        if (gameStats.teamSeasonStats) {
            gameData.matchup.teamSeasonStats = gameStats.teamSeasonStats;
        }
        if (gameStats.seasonSeriesWins) {
            gameData.matchup.seasonSeriesWins = gameStats.seasonSeriesWins;
        }
        if (gameStats.last10Record) {
            gameData.matchup.last10Record = gameStats.last10Record;
        }
    }
    if (gameData.gameState !== "FUT" && gameData.gameState !== "PRE") {
        if (gameData.summary) {
            gameData.gameVideo = gameStats.gameVideo;
            for (let key of Object.keys(gameStats)) {
                gameData.summary[key] = gameStats[key];
            }
            delete gameData.summary.gameVideo;
            gameData.summary.playerByGameStats = (await responses[2].json()).playerByGameStats;
            gameData.plays = (await responses[3].json()).plays;
            for (let play of gameData.plays) {
                if (play.details) {
                    play.details.yCoord = -play.details.yCoord;
                }
            }
            let officials = (await responses[4].json()).data;
            addOfficialProperties(gameData.summary.gameInfo.referees, officials);
            addOfficialProperties(gameData.summary.gameInfo.linesmen, officials);
        }
    } else {
        fixTeamRecord(gameData.awayTeam);
        fixTeamRecord(gameData.homeTeam);
    }
    return gameData;
}

/**
 * Adds headshot images for the penalty takers.
 *
 * @param game JSON object containing the penalties.
 * @param rosters JSON object containing the team rosters.
 */
export function addPenaltyTakerHeadshots(game, rosters) {
    if (Object.keys(game).length > 0 && game.summary) {
        for (let period of game.summary.penalties) {
            for (let penalty of period.penalties) {
                let player;
                if (penalty.committedByPlayer) {
                    player = penalty.committedByPlayer.default;
                } else if (penalty.servedBy) {
                    player = penalty.servedBy.default;
                }
                if (!addPenaltyHeadshot(rosters.awayRosters, penalty, player)) {
                    addPenaltyHeadshot(rosters.homeRosters, penalty, player);
                }
            }
        }
    }
}

/**
 * Adds player information for scratched players.
 *
 * @param game JSON object containing the scratched players.
 * @param rosters JSON object containing the team rosters.
 */
export function addScratchPlayerData(game, rosters) {
    if (Object.keys(game).length > 0 && game.summary) {
        for (let scratch of game.summary.gameInfo.awayTeam.scratches) {
            addScratchData(rosters.awayRosters, scratch);
        }
        for (let scratch of game.summary.gameInfo.homeTeam.scratches) {
            addScratchData(rosters.homeRosters, scratch);
        }
    }
}

/**
 * Fixes some naming inconsistencies for selected teams.
 *
 * @param game JSON object containing the teams.
 */
export function fixTeamPlaceNames(game) {
    if (Object.keys(game).length > 0) {
        if (game.awayTeam.abbrev === "NYR" || game.awayTeam.abbrev === "NYI") {
            game.awayTeam.placeName.default = "New York";
        }
        if (game.homeTeam.abbrev === "NYR" || game.homeTeam.abbrev === "NYI") {
            game.homeTeam.placeName.default = "New York";
        }
    }
}

/**
 * Returns a list of all NHL seasons.
 *
 * @returns {Promise<[]>} A promise containing the seasons in an array.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
export async function getSeasons() {
    let response = await fetch("https://api-web.nhle.com/v1/standings-season");
    if (response.ok) {
        return (await response.json()).seasons;
    }
    throw new Error("HTTP error");
}

/**
 * Returns the rosters for both the away and home team for the given season.
 *
 * @param awayTeam Three-letter team abbreviation.
 * @param homeTeam Three-letter team abbreviation.
 * @param season Season ID with start and end year as one string (YYYYYYYY, e.g., 20232024).
 *
 * @returns {Promise<{awayRosters: {}, homeRosters: {}}>} A promise containg the rosters in a JSON object.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
export async function getRosters(awayTeam, homeTeam, season) {
    let responses = await Promise.all([
        fetch(`https://api-web.nhle.com/v1/roster/${awayTeam}/${season}`),
        fetch(`https://api-web.nhle.com/v1/roster/${homeTeam}/${season}`)
    ]);
    for (let response of responses) {
        if (!response.ok) {
            throw new Error("HTTP error");
        }
    }
    let awayRosters = await responses[0].json();
    let homeRosters = await responses[1].json();
    awayRosters.players = awayRosters.forwards.concat(awayRosters.defensemen).concat(awayRosters.goalies);
    homeRosters.players = homeRosters.forwards.concat(homeRosters.defensemen).concat(homeRosters.goalies);
    return {awayRosters, homeRosters};
}

/**
 * Adds a penalty headshot image to the given player on the given roster based on the given first and last names. If
 * successful, the function returns true; otherwise a default headshot is added, and the function returns false.
 *
 * @param roster Roster JSON object.
 * @param penalty Penalty JSON object.
 * @param penaltyTakerName Name of the player who served the penalty.
 *
 * @returns {boolean} True if the headshot was successfully added, otherwise false.
 */
function addPenaltyHeadshot(roster, penalty, penaltyTakerName) {
    if (penaltyTakerName) {
        for (let player of roster.players) {
            let playerFullName = `${player.firstName.default} ${player.lastName.default}`;
            if (playerFullName.trim().toLowerCase() === penaltyTakerName.trim().toLowerCase()) {
                penalty.playerId = player.id;
                penalty.headshot = player.headshot;
                return true;
            }
        }
    }
    penalty.headshot = "https://assets.nhle.com/mugs/nhl/default-skater.png";
    return false;
}

/**
 * Adds player information for the scratched player from the given roster.
 *
 * @param roster Roster JSON object.
 * @param scratch Scratched player JSON object.
 */
function addScratchData(roster, scratch) {
    for (let player of roster.players) {
        if (player.id === scratch.id) {
            scratch.headshot = player.headshot;
            scratch.sweaterNumber = player.sweaterNumber;
            scratch.positionCode = player.positionCode;
            return;
        }
    }
    scratch.headshot = "https://assets.nhle.com/mugs/nhl/default-skater.png";
}

/**
 * Adds properties for the game officials from the official data.
 *
 * @param gameOfficials Officials in the game.
 * @param officialData All NHL officials.
 */
function addOfficialProperties(gameOfficials, officialData) {
    for (let gameOfficial of gameOfficials) {
        for (let official of officialData) {
            let officialName = `${official.firstName} ${official.lastName}`;
            if (gameOfficial.default.trim().toLowerCase() === officialName.trim().toLowerCase()) {
                gameOfficial.nationalityCode = official.nationalityCode;
                addCountryFlag(gameOfficial, "nationalityCode");
                gameOfficial.headshot = official.headshot_url;
                gameOfficial.sweaterNumber = official.sweaterNumber;
            }
        }
    }
}

/**
 * Fixes an undefined team record to 0-0-0.
 *
 * @param team JSON object containing the team record.
 */
function fixTeamRecord(team) {
    if (team.record !== undefined) {
        if (team.record.trim() === "- -") {
            team.record = "0-0-0";
        }
    }
}
