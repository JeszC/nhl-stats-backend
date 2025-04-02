/**
 * Returns the draft results for the given season.
 *
 * @param season Season ID with start and end year as one string (YYYYYYYY, e.g., 20232024).
 *
 * @returns {Promise<[]>} A promise containing the draft results in an array.
 *
 * @throws Error HTTP error if fetching the data fails.
 */
export async function getDraftResults(season) {
    let response = await fetch(`https://records.nhl.com/site/api/draft?cayenneExp=draftYear=${season.slice(4)}`);
    if (response.ok) {
        return (await response.json()).data;
    }
    throw new Error("HTTP error");
}
