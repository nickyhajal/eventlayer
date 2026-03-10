interface NominatimAddress {
  city?: string
  country?: string
  country_code?: string
  county?: string
  hamlet?: string
  house_number?: string
  municipality?: string
  path?: string
  pedestrian?: string
  postcode?: string
  region?: string
  road?: string
  state?: string
  state_district?: string
  town?: string
  village?: string
}

interface NominatimResult {
  address?: NominatimAddress
  lat?: string
  lon?: string
}

function cleanGeocodeField(value: unknown) {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  if (!normalized) return undefined
  if (normalized.toLowerCase() === 'null' || normalized.toLowerCase() === 'undefined') {
    return undefined
  }
  return normalized
}

export const getGeoCodedAddress = async (address: string) => {
  const query = address.trim()
  if (!query) {
    return {}
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?addressdetails=1&q=${encodeURIComponent(query)}&format=jsonv2&limit=1`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; EventLayer/1.0)',
        },
      },
    )
    if (!response.ok) {
      return {}
    }

    const addr = (await response.json()) as NominatimResult[]
    if (!Array.isArray(addr) || !addr.length) {
      return {}
    }

    const a = addr[0]
    if (!a) {
      return {}
    }

    const details = a.address ?? {}
    const street = cleanGeocodeField(
      [details.house_number, details.road, details.pedestrian, details.path]
        .filter(Boolean)
        .join(' '),
    )
    const city = cleanGeocodeField(
      details.city ??
        details.town ??
        details.village ??
        details.hamlet ??
        details.municipality ??
        details.county,
    )

    return {
      lat: cleanGeocodeField(a.lat),
      lon: cleanGeocodeField(a.lon),
      street,
      postalCode: cleanGeocodeField(details.postcode),
      city,
      country: cleanGeocodeField(details.country_code ?? details.country),
      region: cleanGeocodeField(details.state ?? details.region ?? details.state_district),
    }
  } catch (error) {
    console.error('Geocoding failed', { address: query, error })
    return {}
  }
}
