# Ward Location Calculator

## About the project

Ward Location Calculator is a service made for calculating a ward given an address in Cleveland, Ohio.

This is made to be used in AWS via a lambda function call from an API endpoint.

## How it works

* Gets the **tract number** and the **geocode lat/long address** from Census data if available.
* Gets the **geocode lat/long address** from [Geocordio.io](https://www.geocod.io/) if the address is unable to be found in the census data
* Automatically appends "Cleveland, OH" in the address if the state or city is not given for ease of data entry.
* Reads from a data json file of polygonal bounds of wards and then determines if the lat/long is within bounds.

## Built With

Javascript