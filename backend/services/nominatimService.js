const axios = require('axios');

const geocodeLocation = async (locationName) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Disaster-Response-App'
      }
    });

    if (response.data.length === 0) {
      throw new Error('Location not found');
    }

    const { lat, lon } = response.data[0];
    return {
      lat: parseFloat(lat),
      lng: parseFloat(lon)
    };
  } catch (err) {
    console.error('OpenStreetMap geocoding error:', err.message);
    return null;
  }
};

module.exports = { geocodeLocation };
