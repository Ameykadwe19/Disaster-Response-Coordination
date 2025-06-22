const express = require('express');
const router = express.Router();

const mockAuth = require('../middleware/mockAuth'); 

const {
  getAllDisasters,
  createDisaster,
  updateDisaster,
  deleteDisaster,
  getDisasterCoordinates
} = require('../controllers/disasterController');

const { getSocialMediaReports } = require('../controllers/socialController');
const { geocodeFromDescription } = require('../controllers/geocodeController'); 
const { getNearbyResources } = require('../controllers/resourceController');
const { verifyImage } = require('../controllers/verifyController');
const { getOfficialUpdates } = require('../controllers/updatesController');


// Routes
router.get('/', getAllDisasters);              
router.post('/', mockAuth, createDisaster);      
router.put('/:id', mockAuth, updateDisaster);   
router.delete('/:id', mockAuth, deleteDisaster);
router.get('/:id/coordinates', getDisasterCoordinates);   

router.post('/geocode', geocodeFromDescription);
router.post('/clear-cache', async (req, res) => {
  const CacheManager = require('../utils/cache');
  await CacheManager.clearImageCache();
  res.json({ message: 'Image verification cache cleared successfully' });
});
router.get('/:id/social-media', getSocialMediaReports);
router.get('/:id/resources', getNearbyResources);
router.post('/:id/verify-image', mockAuth, verifyImage);
router.get('/:id/official-updates', getOfficialUpdates);


module.exports = router;
