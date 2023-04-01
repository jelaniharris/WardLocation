# Ward Locator

![GitSize][gitsize-shield]
![Build][build-shield]
![License][license-shield]

## About the project

Ward Locator is a service made for calculating a ward number given an address in Cleveland, Ohio.

This is made to be used in AWS via a lambda function call from an API endpoint.

## How it works

* Gets the **tract number** and the **geocode lat/long address** from Census data if available.
* Gets the **geocode lat/long address** from [Geocordio.io](https://www.geocod.io/) if the address is unable to be found in the census data
* Automatically appends "Cleveland, OH" in the address if the state or city is not given for ease of data entry.
* Reads from a data json file of polygonal bounds of wards and then determines if the point is within bounds. (The point is the lat/long determined by the above steps)

## Getting Started

### Env File
Copy .env.example to .env and 
generate a Geocordio.io key and place it in ```GEOCODIO_API_KEY```. Configure your serverless function to have ```GEOCODIO_API_KEY``` as a environment variable as well.

Setup the ```AWS_ACCESS_KEY_ID```, ```AWS_SECRET_ACCESS_KEY```, ```AWS_REGION``` in GitHub Actions Secrets

### Install Node Modules
``` npm install ```

### Run test script
You can use this script to test the output of addresses
``` node ./test_local.mjs ```
Example Preview:
```json
{
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: '{"givenAddress":"1300 lakeside avenue east, Cleveland OH","success":true,"censusTractNumber":"1078.02","geocodedData":{"address":"1300 LAKESIDE AVE E, CLEVELAND, OH, 44114","lat":41.507109125633455,"lng":-81.68840664154499,"accuracy":1,"accuracy_type":"Census","source":"Census"},"matchingWards":[{"name":"Ward 3","wardNumber":3,"person":"Kerry McCormack"}]}'
}
```

## License
Distributed under the MIT License. See `LICENSE.txt` for more information.

## TODO / Roadmap

- [ ] Add testing for util
- [ ] Add testing for main function
- [ ] Add Terraform as a form of IaC deployment

## Contact
[![LinkedIn][linkedin-shield]][linkedin-url]


[gitsize-shield]: https://img.shields.io/github/languages/code-size/jelaniharris/WardLocation
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/jelaniharris
[build-shield]: https://img.shields.io/github/actions/workflow/status/jelaniharris/WardLocation/main.yml?branch=main
[license-shield]: https://img.shields.io/github/license/jelaniharris/WardLocation