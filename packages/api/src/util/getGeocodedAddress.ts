import NodeGeocoder from 'node-geocoder'

const options = {
	provider: 'openstreetmap',
}

const geocoder = NodeGeocoder(options)
export const getGeoCodedAddress = async (address: string) => {
	const addr = await geocoder.geocode(address)
	const a = addr[0]
	return {
		lat: a.latitude,
		lon: a.longitude,
		street: `${a.streetNumber} ${a.streetName}`,
		postalCode: a.zipcode,
		city: a.city,
		country: a.countryCode,
		region: a.state,
	}
}
