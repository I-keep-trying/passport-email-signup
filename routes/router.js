const express = require('express')
const router = express.Router()
const passport = require('passport')
const AuthController = require('../controllers/user.controller')
const sanitize = require('../middleware/cleanbody')

router.get('/', AuthController.Router)
router.get('/signup', AuthController.GetSignup)
router.post('/signup', sanitize, AuthController.Signup)
router.get('/activation/:event/:code', AuthController.Activation)
router.get('/thankyou', AuthController.Thanks)
router.post(
  '/login',
  passport.authenticate('local'),
  sanitize,
  AuthController.Login
)
router.get('/logout', AuthController.Logout)
router.get('/forgot', AuthController.ForgotPw)
router.post('/forgot', sanitize, AuthController.ForgotPw)
router.post('/reset', sanitize, AuthController.ResetPw)
router.post('/edit', sanitize, AuthController.Edit)
router.post('/contact', sanitize, AuthController.Contact)
router.get('/validate/:email', AuthController.EmailValidator)

module.exports = router
