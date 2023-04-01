import { transformAddress, checkWardPolygon } from "./index.mjs";

describe("transformAddress()", () => {
  const testAddress = "555 Nowhere Lane";
  it("adds cleveland ohio to end of address", () => {
    expect(transformAddress(testAddress)).toEqual(
      testAddress + ", Cleveland OH"
    );
  });
  it("does not add cleveland if it's already in the addres", () => {
    const betterAddress = testAddress + ", cleveland OH";
    expect(transformAddress(betterAddress)).toEqual(betterAddress);
  });
});

describe("checkWardPolygon", () => {
  it("returns the correct ward", async () => {
    const coordinates = { lat: 41.507109125633455, lng: -81.68840664154499 };
    const expectedWard = {
      name: "Ward 3",
      person: "Kerry McCormack",
      wardNumber: 3,
    };
    expect(await checkWardPolygon(coordinates)).toEqual([expectedWard]);
  });
  it("returns no ward if incorrect coordinate", async () => {
    const coordinates = { lat: 0, lng: 0 };
    expect(await checkWardPolygon(coordinates)).toEqual([]);
  });
});
