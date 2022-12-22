import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

/**
 * Geocode an address using Geocod.io
 * @param {string} address
 * @returns {address, lat, lng, accuracy, accuracy_type, source}
 */
export const geocodeAddress = async (address) => {
  const response = await axios.get("https://api.geocod.io/v1.7/geocode", {
    params: {
      q: address,
      api_key: process.env.GEOCODIO_API_KEY,
      format: "simple",
    },
  });
  return response.data;
};

export const queryCensusGeocodeAddress = async (address) => {
  const response = await axios.get(
    "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress",
    {
      params: {
        address: address,
        format: "json",
        benchmark: "Public_AR_Current",
        vintage: "Current_Current",
      },
    }
  );

  const data = response.data;
  let lat, lng;
  let censusTractNumber;
  let matchedAddress;

  if (data && data.result) {
    // Get the coordinates too

    if (data.result.addressMatches && data.result.addressMatches.length > 0) {
      // Get the first matching address
      const addressMatch = data.result.addressMatches[0];

      if (addressMatch.coordinates) {
        lat = addressMatch.coordinates.y;
        lng = addressMatch.coordinates.x;
      }

      if (addressMatch.matchedAddress) {
        matchedAddress = addressMatch.matchedAddress;
      }

      // Get the tracts from the geographics
      const tracts = addressMatch.geographies["Census Tracts"];
      if (tracts.length == 0) {
        throw new Error("Census tracts length is zero");
      }
      // Get the tract name
      const tractName = tracts[0]["NAME"];
      if (!tractName) {
        throw new Error("Could not find name in census tract");
      }

      // Parse the census tract number from the name using regex
      // It's crunchy, but it works
      const regexp = /^Census Tract ([\S]+)/g;
      const tractNumber = [...tractName.matchAll(regexp)].map((m) => m[1]);
      console.log(tractNumber);
      if (tractNumber) {
        censusTractNumber = tractNumber[0];
      }
    }
  }

  // No data or no addresses matched
  return {
    censusTractNumber,
    lat,
    lng,
    matchedAddress
  };
};

//Latitude is y and Longitude is x.

/**
 * Check to see if the point is in the bounds of the polygon
 * @param {lat, lng} point
 * @param {[{lat, lng}]} polygon
 * @returns boolean if the point is in the bounds of the polygon
 */
export const pointInBounds = (point, polygon) => {
  let minX = polygon[0].lng;
  let maxX = polygon[0].lng;
  let minY = polygon[0].lat;
  let maxY = polygon[0].lat;

  for (let i = 1; i < polygon.length; i++) {
    let q = polygon[i];
    minX = Math.min(q.lng, minX);
    maxX = Math.max(q.lng, maxX);
    minY = Math.min(q.lat, minY);
    maxY = Math.max(q.lat, maxY);
  }

  if (
    point.lng < minX ||
    point.lng > maxX ||
    point.lat < minY ||
    point.lat > maxY
  ) {
    return false;
  }
  return true;
};

export const relationPP = (P, polygon) => {
  if (pointInBounds(P, polygon) < 0) {
    return false;
  }

  const between = (p, a, b) => (p >= a && p <= b) || (p <= a && p >= b);
  let inside = false;
  for (let i = polygon.length - 1, j = 0; j < polygon.length; i = j, j++) {
    const A = polygon[i];
    const B = polygon[j];
    // corner cases
    if (
      (P.lng == A.lng && P.lat == A.lat) ||
      (P.lng == B.lng && P.lat == B.lat)
    )
      return 0;
    if (A.lat == B.lat && P.lat == A.lat && between(P.lng, A.lng, B.lng))
      return 0;

    if (between(P.lat, A.lat, B.lat)) {
      // if P inside the vertical range
      // filter out "ray pass vertex" problem by treating the line a little lower
      if (
        (P.lat == A.lat && B.lat >= A.lat) ||
        (P.lat == B.lat && A.lat >= B.lat)
      )
        continue;
      // calc cross product `PA X PB`, P lays on left side of AB if c > 0
      const c =
        (A.lng - P.lng) * (B.lat - P.lat) - (B.lng - P.lng) * (A.lat - P.lat);
      if (c == 0) return 0;
      if (A.lat < B.lat == c > 0) inside = !inside;
    }
  }

  return inside ? 1 : -1;
};

// Older point in polygon functions that "worked", but also had really odd edge cases that the one
// that the current one doesn't have

/*
const horizontalRayPolygonContainsPoint = (point, polygon) => {
  var inPoly = false;

  validateBounds(point, polygon);

  for (let i = 0, j = polygon.Length - 1; i < polygon.Length; j = i++) {
    if (
      polygon[i].lat > point.lat != polygon[j].lat > point.lat &&
      point.lng <
        ((polygon[j].lng - polygon[i].lng) * (point.lat - polygon[i].lat)) /
          (polygon[j].lat - polygon[i].lat) +
          polygon[i].lng
    ) {
      inPoly = !inPoly;
    }
  }

  return inPoly;
};

const raycastPolygonContainsPoint = (point, polygon) => {
  var inPoly = false;

  // Check that the point is within the bounds of the polygon

  let numPoints = polygon.length;
  let j = numPoints - 1;

  for (let i = 0; i < numPoints; i++) {
    let vertex1 = polygon[i];
    let vertex2 = polygon[j];

    if (
      (vertex1.lng < point.lng && vertex2.lng >= point.lng) ||
      (vertex2.lng < point.lng && vertex1.lng >= point.lng)
    ) {
      if (
        vertex1.lat +
          ((point.lng - vertex1.lng) / (vertex2.lng - vertex1.lng)) *
            (vertex2.lat - vertex1.lat) <
        point.lat
      ) {
        inPoly = !inPoly;
      }
    }

    j = i;
  }

  return inPoly;
};

const polygonContainsPoint = (point, polygon) => {
  let ax = 0;
  let ay = 0;
  let bx = polygon[polygon.length - 1].lng - point.lng;
  let by = polygon[polygon.length - 1].lat - point.lat;
  let depth = 0;

  for (let i = 0; i < polygon.length; i++) {
    ax = bx;
    ay = by;
    bx = polygon[i].lng - point.lng;
    by = polygon[i].lat - point.lat;

    if (ay < 0 && by < 0) continue; // both "up" or both "down"
    if (ay > 0 && by > 0) continue; // both "up" or both "down"
    if (ax < 0 && bx < 0) continue; // both points on left

    let lx = ax - (ay * (bx - ax)) / (by - ay);

    if (lx == 0) return true; // point on edge
    if (lx > 0) depth++;
  }

  return (depth & 1) == 1;
};*/
