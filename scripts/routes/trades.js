export async function getTrades(pageOffset) {
    let response = await fetch(`https://www.sportsnet.ca/wp-json/sportsnet/v1/trade-tracker?offset=${pageOffset}`);
    if (response.ok) {
        return await response.json();
    }
    throw new Error("HTTP error");
}
