const express = require('express')
const router = express.Router()
const AuthController = require('../controllers/user.controller')
const sanitize = require('../middleware/cleanbody')

router.get('/', AuthController.Router)
router.get('/signup', AuthController.GetSignup)
router.post('/signup', sanitize, AuthController.Signup)
router.get('/activation/:event/:code', AuthController.Activation)
router.get('/thankyou', AuthController.Thanks)
router.get('/login', AuthController.GetLogin)
router.post('/login', sanitize, AuthController.Login)
router.get('/logout', AuthController.Logout)
router.get('/forgot', AuthController.ForgotPw)
router.post('/forgot', sanitize, AuthController.ForgotPw)
router.post('/reset', sanitize, AuthController.ResetPw)
router.post('/edit', sanitize, AuthController.Edit)

module.exports = router
