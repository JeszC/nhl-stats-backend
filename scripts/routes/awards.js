import {getResponseData} from "../shared/utils.js";

export async function getTrophies() {
    let response = await fetch("https://records.nhl.com/site/api/trophy");
    return await getResponseData(response, "data");
}

export async function getTrophyWinners(trophyCategoryID, trophyID) {
    let response = await fetch(
        `https://records.nhl.com/site/api/award-details?cayenneExp=trophyCategoryId=${trophyCategoryID}
        %20and%20status=%22WINNER%22%20and%20trophyId=${trophyID}`);
    return await getResponseData(response, "data");
}
