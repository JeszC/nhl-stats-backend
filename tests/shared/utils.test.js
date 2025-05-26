import {addCountryFlag} from "../../scripts/shared/utils.js";

describe("addCountryFlag", () => {
    describe("given a person with a country abbreviation attribute", () => {
        it("should add the country flag attribute", () => {
            const person1 = {nationality: "FIN"};
            const person2 = {country: "CAN"};
            addCountryFlag(person1, "nationality");
            addCountryFlag(person2, "country");
            expect(person1.countryFlag).not.toBe("");
            expect(person2.countryFlag).not.toBe("");
        });
    });
    describe("given a person not with a country abbreviation attribute", () => {
        it("should add an empty string", () => {
            const person1 = {nationality: "FIN"};
            const person2 = {country: "CAN"};
            const person3 = {};
            addCountryFlag(person1, "country");
            addCountryFlag(person2, "nationality");
            addCountryFlag(person3, null);
            addCountryFlag(person3, undefined);
            addCountryFlag(person3, person1);
            addCountryFlag(person3, []);
            expect(person1.countryFlag).toBe("");
            expect(person2.countryFlag).toBe("");
            expect(person3.countryFlag).toBe("");
        });
    });
});
