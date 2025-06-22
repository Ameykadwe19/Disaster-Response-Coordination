const express = require('express');
const { getNearbyResources, getDisastersInArea, getSpatialRefSys } = require('../controllers/spatialController');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/nearby', rateLimiter, getNearbyResources);
router.post('/area', rateLimiter, getDisastersInArea);
router.get('/srs/:srid', getSpatialRefSys);
router.get('/srs', getSpatialRefSys);

module.exports = router;