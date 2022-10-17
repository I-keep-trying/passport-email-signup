const express = require('express')
const router = express.Router()
const passport = require('passport')
const AuthController = require('../controllers/user.controller')
const sanitize = require('../middleware/cleanbody')

const passportAuth = () => {
  return passport.authenticate('local')
}

router.get('/', AuthController.Router)
router.get('/signup', AuthController.GetSignup)
router.post('/signup', sanitize, AuthController.Signup)
router.get('/activation/:event/:code', AuthController.Activation)
router.get('/thankyou', AuthController.Thanks)
router.post('/login', passportAuth(), sanitize, AuthController.Login)
router.post('/login', sanitize, AuthController.Login)
router.get('/logout', AuthController.Logout)
router.get('/forgot', AuthController.ForgotPw)
router.post('/forgot', sanitize, AuthController.ForgotPw)
router.post('/reset', sanitize, AuthController.ResetPw)
router.post('/edit', sanitize, AuthController.Edit)

module.exports = router
