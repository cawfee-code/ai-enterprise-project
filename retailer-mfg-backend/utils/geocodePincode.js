/**
 * Converts a simple pin/postal code into [latitude, longitude] using
 * OpenStreetMap's free Nominatim geocoding service. No API key or signup
 * required (unlike the earlier EasyPost attempt) — just a courtesy
 * User-Agent header per their usage policy.
 */
async function geocodePincode(pincode) {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(pincode)}&format=json&limit=1`;

    let response;
    try {
        response = await fetch(url, {
            headers: { 'User-Agent': 'ai-enterprise-capstone-app' }
        });
    } catch (err) {
        throw new Error('Could not reach the geocoding service. Check your connection and try again.');
    }

    if (!response.ok) {
        throw new Error('Could not reach the geocoding service. Please try again.');
    }

    const results = await response.json();
    if (!results.length) {
        throw new Error('Could not find that pin code. Please check it and try again.');
    }

    return {
        latitude: parseFloat(results[0].lat),
        longitude: parseFloat(results[0].lon)
    };
}

module.exports = geocodePincode;