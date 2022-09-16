const express = require('express')
const router = express.Router()
const AuthController = require('../controllers/user.controller')
const passportStrategy = require('../config/passport')

router.post('/test', AuthController.Test)
router.post('/signup', AuthController.Signup)
router.get('/thankyou', AuthController.Thanks)
router.get('/activation/:code', AuthController.Activation)
router.get('/login', AuthController.Login)
router.post('/login', AuthController.Login)
router.get('/email', (req, res) => {
  res.send('Email page')
})

module.exports = router
