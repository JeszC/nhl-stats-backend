/**
 * Returns an array of ten latest trades.
 *
 * @param {number} pageOffset An integer representing the 'page' that contains the trades. A bigger number represents
 * earlier trades. The argument should be in multiples of ten, e.g., 0, 10, 20, etc. For example, number 0 would
 * give the ten latest trades and number 10 would give the ten penultimate trades.
 *
 * @returns {Promise<[]>} A promise containing the trades in an array.
 */
export async function getTrades(pageOffset) {
    let response = await fetch(`https://www.sportsnet.ca/wp-json/sportsnet/v1/trade-tracker?offset=${pageOffset}`);
    if (response.ok) {
        return await response.json();
    }
    throw new Error("HTTP error");
}
