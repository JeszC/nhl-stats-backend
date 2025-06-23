export async function getTrophies() {
    let response = await fetch("https://records.nhl.com/site/api/trophy");
    if (response.ok) {
        return (await response.json()).data;
    }
    throw new Error("HTTP error");
}

export async function getTrophyWinners(trophyCategoryID, trophyID) {
    let response = await fetch(`https://records.nhl.com/site/api/award-details?cayenneExp=trophyCategoryId=${trophyCategoryID}%20and%20status=%22WINNER%22%20and%20trophyId=${trophyID}`);
    if (response.ok) {
        return (await response.json()).data;
    }
    throw new Error("HTTP error");
}
