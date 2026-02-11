import {addCountryFlag, getResponseData, getResponsesData} from "../shared/utils.js";

/**
 * Adds missing data for players.
 *
 * @param game Game.
 */
export async function addPlayerData(game) {
    if (!game.wasCached && Object.keys(game.data).length > 0) {
        try {
            let rosters = await getRosters(game.data.awayTeam.abbrev, game.data.homeTeam.abbrev, game.data.season);
            addScratchPlayerData(game.data, rosters);
            addPenaltyTakerHeadshots(game.data, rosters);
        } catch (ignored) {
            /*
             Do nothing because the roster fetch likely failed. Most likely because of preseason games against
             international teams (international teams don't have a valid endpoint on NHL API, so the fetch fails).
             */
        }
    }
}

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
    return await getResponseData(response);
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
        fetch("https://records.nhl.com/site/api/coach"),
        fetch("https://records.nhl.com/site/api/officials")
    ]);
    let data = await getResponsesData(responses);
    let gameData = data[0];
    let gameStats = data[1];
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
            gameData.summary.playerByGameStats = data[2].playerByGameStats;
            gameData.plays = data[3].plays;
            for (let play of gameData.plays) {
                if (play.details) {
                    play.details.yCoord = -play.details.yCoord;
                }
            }
            let coaches = data[4].data;
            addCoachData(gameData.season, gameData.awayTeam.abbrev, gameData.summary.gameInfo.awayTeam, coaches);
            addCoachData(gameData.season, gameData.homeTeam.abbrev, gameData.summary.gameInfo.homeTeam, coaches);
            let officials = data[5].data;
            addOfficialData(gameData.summary.gameInfo.referees, officials);
            addOfficialData(gameData.summary.gameInfo.linesmen, officials);
        }
    } else {
        fixTeamRecord(gameData.awayTeam);
        fixTeamRecord(gameData.homeTeam);
    }
    return gameData;
}

/**
 * Adds information for the coaches.
 *
 * @param season Season ID with start and end year as one string (YYYYYYYY, e.g., 20232024).
 * @param teamAbbrev Three-letter team abbreviation.
 * @param teamData JSON object containing the team staff data.
 * @param coaches Array containing all NHL coaches.
 */
function addCoachData(season, teamAbbrev, teamData, coaches) {
    if (teamData.headCoach?.default) {
        for (let coach of coaches) {
            if (coach.fullName === teamData.headCoach.default) {
                let headCoach = teamData.headCoach;
                headCoach.headshot = `https://assets.nhle.com/mugs/nhl/${season}/${teamAbbrev}/coaches/${coach.id}.png`;
                headCoach.nationalityCode = coach.nationalityCode;
                addCountryFlag(teamData.headCoach, "nationalityCode");
                return;
            }
        }
    }
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
                if (penalty.teamAbbrev.default === "CSE") {
                    penalty.teamAbbrev.default = "CGS";
                } else if (penalty.teamAbbrev.default === "CBN") {
                    penalty.teamAbbrev.default = "CLE";
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
 * Returns a list of all NHL seasons.
 *
 * @returns {Promise<[]>} A promise containing the seasons in an array.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
export async function getSeasons() {
    let response = await fetch("https://api-web.nhle.com/v1/standings-season");
    return await getResponseData(response, "seasons");
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
    let data = await getResponsesData(responses);
    let awayRosters = data[0];
    let homeRosters = data[1];
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
 * Adds information for the scratched player from the given roster.
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
 * Adds information for the game officials from the official data.
 *
 * @param gameOfficials Officials in the game.
 * @param officialData All NHL officials.
 */
function addOfficialData(gameOfficials, officialData) {
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
