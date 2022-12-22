import {readFile} from 'fs/promises'
import { geocodeAddress, relationPP } from "./util.mjs";

export const handler = async (event) => {
  try {
    // Get the ward info
    const wards = JSON.parse(
      await readFile(new URL("./data/wardPolys.json", import.meta.url))
    );

    if (!event || !event.body) {
      throw new Error("Need parameters in body")
    }

    // Convert address to lowercase
    let body = JSON.parse(event.body)
    if (!body.address) {
      throw new Error("Need address parameter")
    }
    let address = body.address.toLowerCase();

    var newAddress = address;
    // If address already has cleveland, then don't do anything
    if (address.toLowerCase().includes("cleveland")) {
      newAddress = address;
    } else {
      //adds Cleveland for more specific location determination if the user does not enter
      newAddress = address + ", Cleveland OH";
    }

    const geocodeResponse = await geocodeAddress(newAddress);

    let lambdaData = {};

    if (geocodeResponse && geocodeResponse.address) {
      const geocodeAddress = geocodeResponse.address;

      let matchingWards = wards.map((element) => {

        var wardCheck = relationPP(
          { lat: geocodeResponse.lat, lng: geocodeResponse.lng },
          element.points
        );

        if (wardCheck > 0) {
          return {
            name: element.name,
            wardNumber: element.ward,
            person: element.person,
          };
        }
      });

      // Filter matchingWards
      matchingWards = matchingWards.filter((ward) => ward != null);

      lambdaData = {
        success: true,
        givenAddress: newAddress,
        geocodedData: geocodeResponse,
        matchingWards: matchingWards,
      };
    } else {
      // No address was geocoded
      lambdaData = {
        success: false,
        givenAddress: newAddress,
      };
    }
    const response = {
      statusCode: 200,
      body: JSON.stringify(lambdaData),
    };
    return response;
  } catch (e) {
    const response = {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: e.toString(),
      }),
    };
    return response;
  }
};
