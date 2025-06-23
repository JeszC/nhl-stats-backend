import {
    addCountryFlag,
    filterMissingPlayers,
    getNextSeasonStartAndEndDates, getResponseData,
    getSeasonStartAndEndDates,
    transferProperties
} from "../shared/utils.js";

/**
 * Returns the given team's players for the given season. The returned JSON object contains player data for both
 * regular season and playoffs.
 *
 * @param team Three-letter team abbreviation.
 * @param season Season ID with start and end year as one string (YYYYYYYY, e.g., 20232024).
 *
 * @returns {Promise<{regularSeason: {}, playoffs: {}}>} A promise containing the players in a JSON object.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
export async function getPlayers(team, season) {
    let responses = await Promise.all([
        fetch(`https://api-web.nhle.com/v1/club-stats/${team}/${season}/2`),
        fetch(`https://api-web.nhle.com/v1/club-stats/${team}/${season}/3`),
        fetch(`https://api-web.nhle.com/v1/roster/${team}/${season}`),
        fetch("https://api-web.nhle.com/v1/standings-season")
    ]);
    for (let response of responses) {
        if (!response.ok) {
            throw new Error("HTTP error");
        }
    }
    let playerStatsSeason = await responses[0].json();
    let playerStatsPlayoffs = await responses[1].json();
    let playerBios = await responses[2].json();
    let seasons = (await responses[3].json()).seasons;
    let seasonDates = await getSeasonStartAndEndDates(season, seasons);
    let nextSeasonDates = await getNextSeasonStartAndEndDates(season, seasons);

    playerBios.skaters = playerBios.forwards.concat(playerBios.defensemen);
    filterMissingPlayers(playerStatsSeason.goalies, playerBios.goalies);
    filterMissingPlayers(playerStatsSeason.skaters, playerBios.skaters);
    filterMissingPlayers(playerStatsPlayoffs.goalies, playerBios.goalies);
    filterMissingPlayers(playerStatsPlayoffs.skaters, playerBios.skaters);
    transferProperties(playerStatsSeason.goalies, playerBios.goalies, team, seasonDates, nextSeasonDates);
    transferProperties(playerStatsSeason.skaters, playerBios.skaters, team, seasonDates, nextSeasonDates);
    transferProperties(playerStatsPlayoffs.goalies, playerBios.goalies, team, seasonDates, nextSeasonDates);
    transferProperties(playerStatsPlayoffs.skaters, playerBios.skaters, team, seasonDates, nextSeasonDates);
    playerStatsSeason.skaters.forEach(skater => addCountryFlag(skater, "birthCountry"));
    playerStatsSeason.goalies.forEach(goalie => addCountryFlag(goalie, "birthCountry"));
    playerStatsPlayoffs.skaters.forEach(skater => addCountryFlag(skater, "birthCountry"));
    playerStatsPlayoffs.goalies.forEach(goalie => addCountryFlag(goalie, "birthCountry"));
    addSkaterStats(playerStatsSeason.skaters);
    addGoalieStats(playerStatsSeason.goalies);
    addSkaterStats(playerStatsPlayoffs.skaters);
    addGoalieStats(playerStatsPlayoffs.goalies);
    return {
        regularSeason: playerStatsSeason,
        playoffs: playerStatsPlayoffs
    };
}

/**
 * Returns the player with the given player ID.
 *
 * @param playerID Player ID.
 *
 * @returns {Promise<{}>} A promise containing the player data in a JSON object.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
export async function getPlayer(playerID) {
    let responses = await Promise.all([
        fetch(`https://api-web.nhle.com/v1/player/${playerID}/landing`),
        fetch(`https://forge-dapi.d3.nhle.com/v2/content/en-us/players?tags.slug=playerid-${playerID}`)
    ]);
    for (let response of responses) {
        if (!response.ok) {
            throw new Error("HTTP error");
        }
    }
    let player = await responses[0].json();
    let biography = await responses[1].json();
    addCountryFlag(player, "birthCountry");
    addPlayerBiography(player, biography);
    await addLastFiveGamesDates(player);
    await addPlayerAwardInformation(player);
    return player;
}

/**
 * Adds the given biography for the given player. If the biography or its subproperties are undefined, an empty
 * string is added instead.
 *
 * @param player Player to whom the biography is added.
 * @param biography Biography to add.
 */
function addPlayerBiography(player, biography) {
    player.biography = "";
    if (biography && biography.items.length > 0 && biography.items[0].fields && biography.items[0].fields.biography) {
        player.biography = biography.items[0].fields.biography;
    }
}

/**
 * Adds last five games data for the given player. If the player hasn't played any games, then an empty array is
 * added instead.
 *
 * @param player Player to whom the data is added.
 *
 * @returns {Promise<void>} A void promise.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
async function addLastFiveGamesDates(player) {
    let promises = [];
    if (player.last5Games) {
        for (let game of player.last5Games) {
            promises.push(fetch(`https://api-web.nhle.com/v1/gamecenter/${game.gameId}/landing`));
        }
        let responses = await Promise.all(promises);
        for (let response of responses) {
            if (!response.ok) {
                throw new Error("HTTP error");
            }
        }
        for (let i = 0; i < responses.length; i++) {
            let game = await responses[i].json();
            player.last5Games[i].startTimeUTC = game.startTimeUTC;
        }
    } else {
        player.last5Games = [];
    }
}

/**
 * Adds award information (image, description) to the given player.
 *
 * @param player Player to whom the award information is added.
 *
 * @returns {Promise<void>} A void promise.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
async function addPlayerAwardInformation(player) {
    if (player.awards) {
        let response = await fetch("https://records.nhl.com/site/api/trophy");
        let trophies = await getResponseData(response, "data");
        for (let award of player.awards) {
            for (let trophy of trophies) {
                if (trophy.name.trim().toLowerCase() === award.trophy.default.trim().toLowerCase()) {
                    award.briefDescription = trophy.briefDescription;
                    award.imageUrl = trophy.imageUrl;
                    break;
                }
            }
        }
    }
}

/**
 * Adds skater-specific stats for the given skaters.
 *
 * @param skaters Array of skaters to which the stats will be added.
 */
function addSkaterStats(skaters) {
    skaters.forEach(skater => {
        skater.shotsPerGame = skater.shots / skater.gamesPlayed;
    });
}

/**
 * Adds goalie-specific stats for the given goalies.
 *
 * @param goalies Array of goalies to which the stats will be added.
 */
function addGoalieStats(goalies) {
    goalies.forEach(goalie => {
        if (goalie.overtimeLosses === undefined) {
            goalie.totalLosses = goalie.losses;
        } else {
            goalie.totalLosses = goalie.losses + goalie.overtimeLosses;
        }
        goalie.shotsAgainstPerGame = goalie.shotsAgainst / goalie.gamesPlayed;
        goalie.savesPerGame = goalie.saves / goalie.gamesPlayed;
        goalie.timeOnIcePerGame = goalie.timeOnIce / goalie.gamesPlayed;
    });
}
