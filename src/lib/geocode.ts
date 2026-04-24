interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  city: string;
  region: string;
}

export async function geocodeAddress(
  address: string,
  city: string,
  cap: string,
  province: string = ''
): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;

  if (!apiKey) {
    console.warn('GOOGLE_GEOCODING_API_KEY not configured');
    return null;
  }

  // Build address with province if provided for more accurate results
  const provincePart = province ? `, ${province}` : '';
  const fullAddress = `${address}, ${cap} ${city}${provincePart}, Italy`;
  const encodedAddress = encodeURIComponent(fullAddress);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&region=it`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results?.[0]) {
      console.error('Geocoding failed:', data.status);
      return null;
    }

    const result = data.results[0];
    const location = result.geometry.location;

    // Extract city and region from address_components
    let cityName = city;
    let regionName = '';

    for (const component of result.address_components) {
      if (component.types.includes('locality')) {
        cityName = component.long_name;
      }
      if (component.types.includes('administrative_area_level_2')) {
        regionName = component.long_name;
      }
    }

    return {
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: result.formatted_address,
      city: cityName,
      region: regionName,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
