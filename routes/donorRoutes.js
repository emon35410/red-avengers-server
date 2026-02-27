const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Donor routes are working');
});

module.exports = router;