import {getResponseData} from "../shared/utils.js";

const baseURL = "https://records.nhl.com/site/api/award-details?cayenneExp=";
const playerFields = "&include=player.firstName&include=player.lastName&include=player.position";
const teamFields = "&include=team.placeName&include=team.commonName&include=team.triCode&include=team.logos";

export async function getTrophies() {
    let response = await fetch("https://records.nhl.com/site/api/trophy");
    return await getResponseData(response, "data");
}

export async function getTrophyWinners(trophyCategoryID, trophyID) {
    let url = `${baseURL}trophyCategoryId=${trophyCategoryID} and trophyId=${trophyID}${playerFields}${teamFields}`;
    let response = await fetch(url);
    return await getResponseData(response, "data");
}
