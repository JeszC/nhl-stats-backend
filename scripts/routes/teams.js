import {
    addCountryFlag,
    filterMissingPlayers,
    getLatestStandingsForSeason,
    getNextSeasonStartAndEndDates,
    getSeasonStartAndEndDates,
    transferProperties
} from "../shared/utils.js";
import {getLatestSeason} from "./home.js";
import {getInjuriesForTeams} from "./injuries.js";

/**
 * Returns a list of teams for the given season. The teams are sorted in alphabetical order.
 *
 * @param season Season ID with start and end year as one string (YYYYYYYY, e.g., 20232024).
 *
 * @returns {Promise<[]>} List of teams in alphabetical order.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
export async function getListOfTeams(season) {
    let seasonsResponse = await fetch("https://api-web.nhle.com/v1/standings-season");
    if (seasonsResponse.ok) {
        let seasons = (await seasonsResponse.json()).seasons;
        let seasonStartDate = (await getSeasonStartAndEndDates(season, seasons)).seasonStartDate;
        let standingsResponse = await fetch(`https://api-web.nhle.com/v1/standings/${seasonStartDate}`);
        if (standingsResponse.ok) {
            let teams = [];
            let standings = (await standingsResponse.json()).standings;
            for (let team of standings) {
                teams.push({
                    name: team.teamName.default,
                    abbrev: team.teamAbbrev.default
                });
            }
            teams.sort((a, b) => a.name.localeCompare(b.name));
            return teams;
        }
        throw new Error("HTTP error");
    }
    throw new Error("HTTP error");
}

/**
 * Returns all team related data (roster, schedule, statistics, prospects, franchise information, injuries).
 *
 * @param team Three-letter team abbreviation.
 * @param season Season ID with start and end year as one string (YYYYYYYY, e.g., 20232024).
 *
 * @returns {Promise<{players: {}, schedule: [], teamStats: {}, prospects: {}, franchiseInfo: {}}>} A promise
 * containing the team data in a JSON object.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
export async function getTeamData(team, season) {
    let responses = await Promise.all([
        fetch(`https://api-web.nhle.com/v1/club-stats/${team}/${season}/2`),
        fetch(`https://api-web.nhle.com/v1/club-stats/${team}/${season}/3`),
        fetch(`https://api-web.nhle.com/v1/roster/${team}/${season}`),
        fetch(`https://api-web.nhle.com/v1/club-schedule-season/${team}/${season}`),
        fetch(`https://api-web.nhle.com/v1/prospects/${team}`),
        fetch(`https://records.nhl.com/site/api/franchise-team-totals?cayenneExp=triCode='${team}'`),
        fetch("https://api-web.nhle.com/v1/standings-season")
    ]);
    for (let response of responses) {
        if (!response.ok) {
            throw new Error("HTTP error");
        }
    }
    let playersSeason = await responses[0].json();
    let playersPlayoffs = await responses[1].json();
    let playerBios = await responses[2].json();
    let schedule = (await responses[3].json()).games;
    let franchiseInfo = (await responses[5].json()).data;
    let seasons = (await responses[6].json()).seasons;
    let seasonDates = await getSeasonStartAndEndDates(season, seasons);
    let nextSeasonDates = await getNextSeasonStartAndEndDates(season, seasons);
    let standings = await getLatestStandingsForSeason(season, seasons);
    if (standings.error) {
        console.error(`${new Date().toLocaleString()}:`, "Error fetching latest standings:", standings.error.message);
        throw new Error("HTTP error");
    } else {
        addPlayerInfo(playersSeason, playerBios, team, seasonDates, nextSeasonDates);
        addPlayerInfo(playersPlayoffs, playerBios, team, seasonDates, nextSeasonDates);
        let latestSeason = await getLatestSeason();
        let prospects = {};
        if (season === latestSeason) {
            prospects = await responses[4].json();
            prospects.forwards.forEach(forward => addProspectInfo(forward));
            prospects.defensemen.forEach(defenseman => addProspectInfo(defenseman));
            prospects.goalies.forEach(goalie => addProspectInfo(goalie));
            prospects.defenders = prospects.defensemen;
            delete prospects.defensemen;
        }
        let teamStats = getTeamStandingsInfo(standings.data, team);
        let players = {
            season: playersSeason,
            playoffs: playersPlayoffs
        };
        let injuries = await addInjuryData(players, team, seasonDates);
        return {players, schedule, teamStats, prospects, franchiseInfo, injuries};
    }
}

/**
 * Fetches the injury data for the given team. Players need to be given so that player ID and other relevant information
 * can be added to the injury data. Season dates need to be given so that the injuries will only be added for the
 * latest season.
 *
 * @param players JSON object containing the players for both season and playoffs.
 * @param team Three-letter team abbreviation.
 * @param seasonDates JSON object containing the season start and end dates.
 *
 * @returns {Promise<{}>} JSON object containing the injuries, or an empty object if fetching the data fails or if
 * the given season is not the latest season.
 */
async function addInjuryData(players, team, seasonDates) {
    let injuryArray = await getInjuriesForTeams([team]);
    if (injuryArray && injuryArray.length > 0) {
        let injuries = injuryArray[0];
        let seasonStart = parseInt(seasonDates.seasonStartDate.slice(0, 4));
        if (injuries.season === seasonStart && injuries.playerInjuries) {
            for (let injury of injuries.playerInjuries) {
                if (players && players.season && players.playoffs) {
                    let position = injury.player.position;
                    if (position.toLowerCase() === "defense") {
                        addPlayerDataToInjury(players.season.defenders, players.playoffs.defenders, injury);
                    } else if (position.toLowerCase() === "goaltender") {
                        addPlayerDataToInjury(players.season.goalies, players.playoffs.goalies, injury);
                    } else {
                        addPlayerDataToInjury(players.season.forwards, players.playoffs.forwards, injury);
                    }
                }
            }
            return injuries;
        }
    }
    return {};
}

/**
 * Finds the player specified in the injury data and adds the player ID and other relevant stats to the injury object.
 *
 * @param seasonPlayers Array of players during the season.
 * @param playoffsPlayers Array of players during playoffs.
 * @param injury JSON object containing the injured player data.
 */
function addPlayerDataToInjury(seasonPlayers, playoffsPlayers, injury) {
    let firstName = injury.player.firstName;
    let lastName = injury.player.lastName;
    let number = injury.player.number;
    if (seasonPlayers && seasonPlayers.length > 0) {
        for (let player of seasonPlayers) {
            if (player.firstName.default === firstName
                && player.lastName.default === lastName
                && player.number === number) {
                injury.player.headshot = player.headshot;
                injury.player.nhlId = player.playerId;
                return;
            }
        }
    }
    if (playoffsPlayers && playoffsPlayers.length > 0) {
        for (let player of playoffsPlayers) {
            if (player.firstName.default === firstName
                && player.lastName.default === lastName
                && player.number === number) {
                injury.player.headshot = player.headshot;
                injury.player.nhlId = player.playerId;
            }
        }
    }
}

/**
 * Adds player bios and other information to the players.
 *
 * @param players Players to whom the information will be added.
 * @param playerBios Player bios.
 * @param team Three-letter team abbreviation.
 * @param seasonDates JSON object containing the season start and end dates.
 * @param nextSeasonDates JSON object containing the next season start and end dates.
 */
function addPlayerInfo(players, playerBios, team, seasonDates, nextSeasonDates) {
    playerBios.skaters = playerBios.forwards.concat(playerBios.defensemen);
    filterMissingPlayers(players.goalies, playerBios.goalies);
    filterMissingPlayers(players.skaters, playerBios.skaters);
    transferProperties(players.goalies, playerBios.goalies, team, seasonDates, nextSeasonDates);
    transferProperties(players.skaters, playerBios.skaters, team, seasonDates, nextSeasonDates);
    players.skaters.forEach(skater => addCountryFlag(skater, "birthCountry"));
    players.goalies.forEach(goalie => addCountryFlag(goalie, "birthCountry"));
    players.skaters.sort(compareSkaters);
    players.goalies.sort(compareGoalies);
    players.forwards = players.skaters.filter(skater => skater.positionCode === "R"
                                                        || skater.positionCode === "L"
                                                        || skater.positionCode === "C");
    players.defenders = players.skaters.filter(skater => skater.positionCode === "D");
    delete players.skaters;
}

/**
 * Adds player information for the given prospect.
 *
 * @param prospect Prospect to whom the information will be added.
 */
function addProspectInfo(prospect) {
    addCountryFlag(prospect, "birthCountry");
    prospect.playerId = prospect.id;
    prospect.number = prospect.sweaterNumber;
    prospect.age = Math.floor(new Date(new Date() - new Date(prospect.birthDate)).getFullYear() - 1970);
    delete prospect.id;
    delete prospect.sweaterNumber;
}

/**
 * Returns the given team's standings data.
 *
 * @param standings Standings data for the NHL.
 * @param teamAbbreviation Three-letter team abbreviation.
 *
 * @returns {{}} A JSON object containing the team's standings data.
 */
function getTeamStandingsInfo(standings, teamAbbreviation) {
    for (let team of standings) {
        if (team.teamAbbrev.default === teamAbbreviation) {
            return team;
        }
    }
    return {};
}

/**
 * Comparison function for skaters. Criteria: points → goals → assists → games → name.
 *
 * @param skater1 Skater 1.
 * @param skater2 Skater 2.
 *
 * @returns {number} A negative number, a positive number, or 0.
 */
function compareSkaters(skater1, skater2) {
    if (skater1.points === skater2.points) {
        if (skater1.goals === skater2.goals) {
            if (skater1.assists === skater2.assists) {
                if (skater1.gamesPlayed === skater2.gamesPlayed) {
                    if (skater1.lastName.default === skater2.lastName.default) {
                        return skater1.firstName.default.localeCompare(skater2.firstName.default);
                    }
                    return skater1.lastName.default.localeCompare(skater2.lastName.default);
                }
                return -(skater1.gamesPlayed - skater2.gamesPlayed);
            }
            return -(skater1.assists - skater2.assists);
        }
        return -(skater1.goals - skater2.goals);
    }
    return -(skater1.points - skater2.points);
}

/**
 * Comparison function for goalies. Criteria: save percentage → goals against average → games → name.
 *
 * @param goalie1 Goalie 1.
 * @param goalie2 Goalie 2.
 *
 * @returns {number} A negative number, a positive number, or 0.
 */
function compareGoalies(goalie1, goalie2) {
    if (goalie1.savePercentage === goalie2.savePercentage) {
        if (goalie1.goalsAgainstAverage === goalie2.goalsAgainstAverage) {
            if (goalie1.gamesPlayed === goalie2.gamesPlayed) {
                if (goalie1.lastName.default === goalie2.lastName.default) {
                    return goalie1.firstName.default.localeCompare(goalie2.firstName.default);
                }
                return goalie1.lastName.default.localeCompare(goalie2.lastName.default);
            }
            return -(goalie1.gamesPlayed - goalie2.gamesPlayed);
        }
        return goalie1.goalsAgainstAverage - goalie2.goalsAgainstAverage;
    }
    return -(goalie1.savePercentage - goalie2.savePercentage);
}
