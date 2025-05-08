import cache from "memory-cache";
import {getCountryTwoLetterCode} from "./countryCodeConverter.js";

/**
 * Returns the data associated with the given key from the cache. If the data does not exist, the data will be
 * fetched using the supplied function. A JSON object is returned (wrapped in a promise), with keys
 * 'data', 'wasCached' and 'error'. The first contains the actual data (as a JSON object, or an array of JSON objects),
 * the second indicates whether the data was fetched from cache or by the supplied function, and the third is the
 * error that occurred during the supplied fetch function. If no error occurred, then this value will be undefined.
 *
 * The second value (wasCached) is to help in cases where there is need for additional data processing after
 * fetching the data, as this processing would be redundant if the data was fetched from cache. Note that the data
 * returned is the same as the data stored in the cache, which means that changing the returned data will also
 * change the data in the cache. This is by design, as otherwise after the additional processing the cache would
 * need to be updated again manually.
 *
 * @param cacheKey Cache key.
 * @param dataFetchFunction Function to execute if the data does not exist in the cache.
 * @param expireTime Time (in milliseconds) after which the cache will be invalidated.
 *
 * @returns {Promise<{data: {}|[], wasCached: boolean, error: Error}>}
 */
export async function getFromCache(cacheKey, dataFetchFunction, expireTime = 1_800_000) {
    let cachedData = cache.get(cacheKey);
    if (cachedData === null) {
        try {
            let fetchedData = await dataFetchFunction;
            cache.put(cacheKey, fetchedData, expireTime);
            return {
                data: fetchedData,
                wasCached: false,
                error: undefined
            };
        } catch (error) {
            return {
                data: undefined,
                wasCached: false,
                error
            };
        }
    } else {
        return {
            data: cachedData,
            wasCached: true,
            error: undefined
        };
    }
}

/**
 * Adds a link to a country flag for the given player based on the given country key. The country key should be a
 * three-letter country abbreviation. The country flag will be set on countryFlag-property. If a country with the
 * given country key is not found, an empty string is set instead.
 *
 * @param person Person (player, staff member, official, etc.) for whom the country flag will be added.
 * @param countryKey Three-letter country key with which the flag is added.
 */
export function addCountryFlag(person, countryKey) {
    let code = getCountryTwoLetterCode(person[countryKey]);
    if (code) {
        person.countryFlag = `https://flagcdn.com/${code.toLowerCase()}.svg`;
    } else {
        person.countryFlag = "";
    }
}

/**
 * Returns the start and end dates for the given season. The 'seasons' argument should be an array of all NHL
 * seasons, which can be fetched from the NHL API. This is so that the network requests can be made asynchronously
 * outside this function. If the season cannot be found, then empty date strings will be returned.
 *
 * @param season Season ID with start and end year as one string (YYYYYYYY, e.g., 20232024).
 * @param seasons List of seasons.
 *
 * @returns {Promise<{seasonStartDate: string, seasonEndDate: string}>} A promise containing the season start and end
 * dates as a JSON object.
 */
export async function getSeasonStartAndEndDates(season, seasons) {
    if (season === "20042005") {
        return {
            seasonStartDate: "2004-10-01",
            seasonEndDate: "2005-04-30"
        };
    }
    for (let i = seasons.length - 1; i >= 0; i--) {
        if (seasons[i].id.toString() === season) {
            if (i === seasons.length - 1) {
                return await getLatestSeasonStartAndEndDates();
            }
            return {
                seasonStartDate: seasons[i].standingsStart,
                seasonEndDate: seasons[i].standingsEnd
            };
        }
    }
    return {
        seasonStartDate: "",
        seasonEndDate: ""
    };
}

/**
 * Returns the start and end dates for the season following the given season. The seasons argument should be an array
 * of all NHL seasons, which can be fetched from the NHL API. This is so that the network requests can be made
 * asynchronously outside of this function. If the season cannot be found, then empty date strings will be returned.
 *
 * @param season Season ID with start and end year as one string (YYYYYYYY, e.g., 20232024).
 * @param seasons List of seasons.
 *
 * @returns {Promise<{seasonStartDate: string, seasonEndDate: string}>} A promise containing the season start and end
 * dates as a JSON object.
 */
export async function getNextSeasonStartAndEndDates(season, seasons) {
    if (season === "20032004") {
        return {
            seasonStartDate: "2004-10-01",
            seasonEndDate: "2005-04-30"
        };
    }
    for (let i = seasons.length - 1; i >= 0; i--) {
        if (seasons[i].id.toString() === season) {
            if (i < seasons.length - 1) {
                return {
                    seasonStartDate: seasons[i + 1].standingsStart,
                    seasonEndDate: seasons[i + 1].standingsEnd
                };
            }
            return await getLatestSeasonStartAndEndDates();
        }
    }
    return {
        seasonStartDate: "",
        seasonEndDate: ""
    };
}

/**
 * Returns the latest standings for the current season. The seasons argument should be an array of all NHL
 * seasons, which can be fetched from the NHL API. This is so that the network requests can be made asynchronously
 * outside of this function.
 *
 * @param season Season ID with start and end year as one string (YYYYYYYY, e.g., 20232024).
 * @param seasons List of seasons.
 *
 * @returns {Promise<{data: {}|[], wasCached: boolean, error: Error}>} A promise containing the result.
 */
export async function getLatestStandingsForSeason(season, seasons) {
    async function getLatestStandings(standingsFetchDate) {
        let response = await fetch(`https://api-web.nhle.com/v1/standings/${standingsFetchDate}`);
        if (response.ok) {
            return (await response.json()).standings;
        }
        throw new Error("HTTP error");
    }

    let standingsFetchDate = await getLatestStandingsDateForSeason(season, seasons);
    let cacheKey = `latestStandingsForSeason${season}`;
    return await getFromCache(cacheKey, getLatestStandings(standingsFetchDate));
}

/**
 * Returns the age between the start and end dates as a floating point number. For a person who is 21 and a half
 * years old, this function would return 21.5;
 *
 * @param endDate End date as a Date object.
 * @param startDate Start date as a Date object.
 *
 * @returns {number} Age as a floating point number.
 */
export function getAgeInYearsAsFloat(endDate, startDate) {
    let daysInYear = 365.25;
    let years = new Date(endDate - startDate).getFullYear() - 1970;
    let daysOver = (Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
                   - Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()))
                   / 24 / 60 / 60 / 1000 - years * daysInYear;
    return years + daysOver / daysInYear;
}

/**
 * Filters out players from the statistics array that are missing from the player bios array.
 *
 * @param playerStats Array containing the player statistics
 * @param playerBios Array containing the player bios.
 */
export function filterMissingPlayers(playerStats, playerBios) {
    for (let i = playerStats.length - 1; i >= 0; i--) {
        let playerFound = false;
        for (let j = 0; j < playerBios.length && !playerFound; j++) {
            if (playerStats[i].playerId === playerBios[j].id) {
                playerFound = true;
            }
        }
        if (!playerFound) {
            playerStats.splice(i, 1);
        }
    }
}

/**
 * Transfers player properties from the from-array to the to-array. Also adds team information to the to-array.
 *
 * @param to Array to which the properties are added.
 * @param from Array from which the properties are added.
 * @param team Three-letter team abbreviation.
 * @param seasonDates JSON object containing the season start and end dates.
 * @param nextSeasonDates JSON object containing the next season start and end dates.
 */
export function transferProperties(to, from, team, seasonDates, nextSeasonDates) {
    let today = new Date();
    let seasonStart = new Date(seasonDates.seasonStartDate);
    let seasonEnd = new Date(seasonDates.seasonEndDate);
    let nextSeasonStart = new Date(nextSeasonDates.seasonStartDate);
    let nextSeasonEnd = new Date(nextSeasonDates.seasonEndDate);
    let seasonDeadline = seasonStart === nextSeasonStart && seasonEnd === nextSeasonEnd ? seasonEnd : nextSeasonStart;
    for (const itemTo of to) {
        for (const itemFrom of from) {
            if (itemTo.playerId === itemFrom.id) {
                itemTo.number = itemFrom.sweaterNumber;
                itemTo.shootsCatches = itemFrom.shootsCatches;
                itemTo.birthCountry = itemFrom.birthCountry;
                itemTo.height = itemFrom.heightInCentimeters;
                itemTo.weight = itemFrom.weightInKilograms;
                itemTo.birthDate = itemFrom.birthDate;
                if (seasonStart > today || seasonStart < today && today < seasonDeadline) {
                    itemTo.ageAtSeasonStart = getAgeInYearsAsFloat(today, new Date(itemFrom.birthDate));
                } else {
                    itemTo.ageAtSeasonStart = getAgeInYearsAsFloat(seasonStart, new Date(itemFrom.birthDate));
                }
                itemTo.age = getAgeInYearsAsFloat(today, new Date(itemFrom.birthDate));
                itemTo.team = team;
            }
        }
    }
}

/**
 * Returns the start and end dates for the latest season.
 *
 * @returns {Promise<{seasonStartDate: string, seasonEndDate: string}>}
 *
 * @throws Error HTTP error if fetching the data fails.
 */
async function getLatestSeasonStartAndEndDates() {
    let response = await fetch("https://api-web.nhle.com/v1/schedule/now");
    if (response.ok) {
        let schedule = await response.json();
        return {
            seasonStartDate: schedule.regularSeasonStartDate,
            seasonEndDate: schedule.regularSeasonEndDate
        };
    }
    throw new Error("HTTP error");
}

/**
 * Returns the latest standings date for the given season. The seasons argument should be an array of all NHL
 * seasons, which can be fetched from the NHL API. This is so that the network requests can be made asynchronously
 * outside of this function.
 *
 * @param season Season ID with start and end year as one string (YYYYYYYY, e.g., 20232024).
 * @param seasons List of seasons.
 *
 * @returns {Promise<string>} A promise containing the latest standings date.
 */
async function getLatestStandingsDateForSeason(season, seasons) {
    let seasonDates = await getSeasonStartAndEndDates(season, seasons);
    let standingsFetchDate = seasonDates.seasonEndDate;
    let today = new Date();
    if (new Date(standingsFetchDate) > today) {
        let seasonStartDate = seasonDates.seasonStartDate;
        if (new Date(seasonStartDate) > today) {
            standingsFetchDate = seasonStartDate;
        } else {
            let year = today.getFullYear();
            let month = (today.getMonth() + 1).toString().padStart(2, "0");
            let day = today.getDate().toString().padStart(2, "0");
            standingsFetchDate = `${year}-${month}-${day}`;
        }
    }
    return standingsFetchDate;
}
