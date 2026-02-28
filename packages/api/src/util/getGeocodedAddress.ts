import NodeGeocoder from 'node-geocoder'

const options = {
  provider: 'openstreetmap',
  email: 'nhajal@gmail.com',
}

const geocoder = NodeGeocoder(options)
export const getGeoCodedAddress = async (address: string) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?addressdetails=1&q=${address.replace(' ', '+')}&format=jsonv2`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EventLayer/1.0)',
      },
    },
  )
  console.log(response)
  const addr = await response.json()
  if (addr.length) {
    const a = addr[0]
    return {
      lat: a.lat,
      lon: a.lon,
      street: `${a.address.house_number} ${a.address.road}`,
      postalCode: a.address.postcode,
      city: a.address.city,
      country: a.address.country_code,
      region: a.address.state,
    }
  } else {
    return {}
  }
}
