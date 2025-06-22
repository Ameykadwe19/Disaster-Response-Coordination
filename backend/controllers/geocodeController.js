const { extractLocation } = require('../services/geminiService');
const { geocodeLocation } = require('../services/nominatimService');
const CacheManager = require('../utils/cache');
const Logger = require('../utils/logger');

// Extract location from text using Gemini API and geocode it
const geocodeFromDescription = async (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  try {
    // Check if description already processed and cached
    const cacheKey = `geocode_desc_${Buffer.from(description).toString('base64').slice(0, 50)}`;
    let result = await CacheManager.get(cacheKey);

    if (!result) {
      const locationName = await extractLocation(description);
      if (!locationName) {
        Logger.warn('Failed to extract location from description', { description: description.substring(0, 100) });
        return res.status(500).json({ error: 'Failed to extract location from description' });
      }

      const coords = await geocodeLocation(locationName);
      if (!coords) {
        Logger.warn('Failed to geocode extracted location', { location_name: locationName });
        return res.status(500).json({ error: 'Failed to geocode the extracted location' });
      }

      result = {
        location_name: locationName,
        lat: coords.lat,
        lng: coords.lng
      };

      // Cache for 24 hours
      await CacheManager.set(cacheKey, result, 24);
    }

    Logger.info('Location extracted and geocoded successfully', {
      extracted_location: result.location_name,
      coordinates: { lat: result.lat, lng: result.lng },
      cached: !!await CacheManager.get(cacheKey)
    });

    res.status(200).json(result);
  } catch (error) {
    Logger.error('Geocoding from description failed', {
      error: error.message,
      description: description.substring(0, 100)
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { geocodeFromDescription };
