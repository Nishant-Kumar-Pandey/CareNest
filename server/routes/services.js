const express = require('express');
const router = express.Router();
const { getServices, getService } = require('../controllers/serviceController');

router.get('/', getServices);
router.get('/:slug', getService);

module.exports = router;
