// routes/reportRoutes.js
const express = require('express');
const router = express.Router();

const { createReport, getReportsByDisaster } = require('../controllers/reportController');

// POST /api/reports
router.post('/', createReport);

// GET /api/reports/:disasterId
router.get('/:disasterId', getReportsByDisaster);

module.exports = router;
