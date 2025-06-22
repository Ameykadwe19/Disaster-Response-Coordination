const { verifyImageWithGemini } = require('../services/geminiService');
const CacheManager = require('../utils/cache');
const Logger = require('../utils/logger');

// Helper function to add friendly AI girl style message
function aiGirlResponse(isDisaster) {
  if (isDisaster) {
    return `Hey! I see this image shows a real disaster situation. Please stay safe and alert! 🌧️🔥🌊`;
  } else {
    return `Hmm, I don't think this image shows a disaster. Looks like everything is okay here. Take care! 😊`;
  }
}

// POST /disasters/:id/verify-image
const verifyImage = async (req, res) => {
  const { id } = req.params;
  const { base64Image } = req.body;

  if (!base64Image) {
    return res.status(400).json({ error: 'base64Image is required' });
  }

  try {
    // No caching - always get fresh verification results
    const result = await verifyImageWithGemini(base64Image);

    if (result.error) {
      Logger.warn('Image verification client error', { error: result.error, disaster_id: id });
      return res.status(400).json({ error: result.error });
    }

    // Add AI girl friendly message
    const friendlyMessage = aiGirlResponse(result.isDisaster);

    Logger.info('Image verification completed', {
      disaster_id: id,
      is_disaster: result.isDisaster,
      cached: false,
      fresh_verification: true
    });

    return res.status(200).json({
      verification: result.result,
      isDisaster: result.isDisaster,
      friendlyMessage
    });
  } catch (err) {
    Logger.error('Image verification controller error', {
      error: err.message,
      disaster_id: id
    });
    return res.status(500).json({ error: 'Internal server error during image verification' });
  }
};

module.exports = { verifyImage };
