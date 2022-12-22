import {readFile} from 'fs/promises'
import { geocodeAddress, queryCensusGeocodeAddress, relationPP } from "./util.mjs";

export const handler = async (event) => {

  const transformAddress = (address) => {
    let newAddress;
    // If address already has cleveland, then don't do anything
    if (address.toLowerCase().includes("cleveland")) {
      newAddress = address;
    } else {
      //adds Cleveland for more specific location determination if the user does not enter
      newAddress = address + ", Cleveland OH";
    }
    return newAddress;
  }

  const checkWardPolygon = async (coordinate) => {
    // Get the ward info
    const wards = JSON.parse(
      await readFile(new URL("./data/wardPolys.json", import.meta.url))
    );

    let matchingWards = wards.map((element) => {

      var wardCheck = relationPP(
        { lat: coordinate.lat, lng: coordinate.lng },
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
    return matchingWards;
  }


  try {
    console.log(event);

    if (!event || !event.body) {
      throw new Error("Need parameters in body")
    }

    // Convert address to lowercase
    let body = JSON.parse(event.body)
    if (!body.address) {
      throw new Error("Need address parameter")
    }
    let address = body.address.toLowerCase();

    // Transform the address by appending city and state if we have to
    var newAddress = transformAddress(address);

    // First let's query the census for the address
    // We can get the coordinate 
    const censusQueryResponse = await queryCensusGeocodeAddress(newAddress);
    console.log("CENSUS:", censusQueryResponse);

    let lambdaData = {
      givenAddress: newAddress,
    };

    if (censusQueryResponse && censusQueryResponse.matchedAddress && censusQueryResponse.censusTractNumber) {
      let matchingWards = await checkWardPolygon({
        lat: censusQueryResponse.lat, lng: censusQueryResponse.lng
      });
      lambdaData = {
        ...lambdaData,
        success: true,
        censusTractNumber: censusQueryResponse.censusTractNumber,
        geocodedData: {
          address: censusQueryResponse.matchedAddress,
          lat: censusQueryResponse.lat,
          lng: censusQueryResponse.lng,
          accuracy: 1,
          accuracy_type: "Census",
          source: "Census",
        },
        matchingWards: matchingWards,
      };

    } else {
      const geocodeResponse = await geocodeAddress(newAddress);

      if (geocodeResponse && geocodeResponse.address) {
  
        let matchingWards = await checkWardPolygon(geocodeResponse);
        
        lambdaData = {
          ...lambdaData,
          success: true,
          geocodedData: geocodeResponse,
          censusTractNumber: null,
          matchingWards: matchingWards,
        };
      } else {
        // No address was geocoded
        lambdaData = {
          ...lambdaData,
          success: false,
        };
      }

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
