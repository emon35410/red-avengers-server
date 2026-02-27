const express = require('express');
const router = express.Router();
const { saveUser, getAllUsers } = require('../controllers/userController');

router.post('/', saveUser);
router.get('/', getAllUsers);

module.exports = router;