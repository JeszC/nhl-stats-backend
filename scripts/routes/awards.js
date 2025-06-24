import {getResponseData} from "../shared/utils.js";

export async function getTrophies() {
    let response = await fetch("https://records.nhl.com/site/api/trophy");
    return await getResponseData(response, "data");
}

export async function getTrophyWinners(trophyCategoryID, trophyID) {
    let response = await fetch(`https://records.nhl.com/site/api/award-details
    ?cayenneExp=trophyCategoryId=${trophyCategoryID}%20and%20trophyId=${trophyID}
    &include=player.firstName&include=player.lastName&include=player.position&include=team.fullName
    &include=team.placeName&include=team.commonName&include=team.triCode&include=team.logos`);
    return await getResponseData(response, "data");
}
