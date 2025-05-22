import {getCountryTwoLetterCode} from "../../scripts/shared/countryCodeConverter.js";

describe("getCountryTwoLetterCode", () => {
    describe("given a three-letter string", () => {
        it("should return a two-letter code for the given three-letter code", () => {
            expect(getCountryTwoLetterCode("FIN")).toBe("FI");
            expect(getCountryTwoLetterCode("SLO")).toBe("SI");
            expect(getCountryTwoLetterCode("SVN")).toBe("SI");
        });
    });
    describe("given a nonmatching string or a string of different length", () => {
        it("should return undefined", () => {
            expect(getCountryTwoLetterCode("AAA")).toBe(undefined);
            expect(getCountryTwoLetterCode("ABCDEF")).toBe(undefined);
            expect(getCountryTwoLetterCode("")).toBe(undefined);
            expect(getCountryTwoLetterCode()).toBe(undefined);
        });
    });
    describe("given an invalid type", () => {
        it("should return undefined", () => {
            expect(getCountryTwoLetterCode(undefined)).toBe(undefined);
        });
    });
});
