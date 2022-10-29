require('dotenv').config()
const { v4: uuid } = require('uuid')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const Joi = require('joi')
const nodemailer = require('nodemailer')
const axios = require('axios')

const { emailVerify } = require('../services/email')
const { emailContact } = require('../services/emailContactForm')
const User = require('../models/user.model')
const { generateJwt } = require('../services/generateJwt')
const register = require('../email_templates/register_user.js')
const forgot = require('../email_templates/forgot_password.js')

const userSchema = Joi.object().keys({
  name: Joi.string().max(64),
  email: Joi.string().email({ minDomainSegments: 2 }).max(64),
  password: Joi.string().required().min(8).max(64),
  event: Joi.string(),
  userData: Joi.object().keys({
    city: Joi.string().max(64),
    state: Joi.string().max(64),
    country: Joi.string().max(64),
    IP: Joi.string().max(64),
    os: Joi.string().max(64),
    browser: Joi.string().max(64),
    ua: Joi.string().max(256),
  }),
})

const messageSchema = Joi.object().keys({
  name: Joi.string().max(64),
  email: Joi.string().email({ minDomainSegments: 2 }).max(64),
  message: Joi.string().max(5000),
})

const env = process.env.NODE_ENV === 'production' ? 'production' : 'development'

const authSession = async (req, res) => {
  try {
    const id = req.session.user
    console.log('session user id: ', id)
    const user = await User.findOne({
      userId: id,
    })
    console.log('user found by id: ', user)
  } catch (err) {
    console.log('authSession error: ', err)
  }
}

const getDeviceData = () => {
  const req = axios.get(
    `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.REACT_APP_GEO}`
  )
  return req.then((res) => res.data)
}

exports.GetSignup = (req, res) => {
  res.send(`You got the signup page!`)
}

exports.GetLogin = async (req, res) => {
  res.send(`You got the login page!`)
}

exports.GetForgot = async (req, res) => {
  res.send(`You got the reset password page!`)
}

exports.Signup = async (req, res) => {
  try {
    const result = userSchema.validate(req.body)

    if (result.error) {
      console.log('Signup Joi error: ', result.error.message)
      return res.json({
        error: true,
        status: 400,
        message: result.error.message,
      })
    }

    const { name, email, password, event } = req.body

    const user = await User.findOne({
      email: email,
    })

    const hash = await User.hashPassword(password)
    const id = uuid()

    const newUser =
      !user &&
      (await new User({ name, email, password: hash, userId: id }).save())

    // If user exists, it seems safe to assume unaware of such.
    // Just update password, deactivate, send verification email,
    // and reactivate, as if user is new.
    // Why not. It's better than how most such situations are
    // usually handled. E.g., "You fucked up! Now you can never register."

    user &&
      (await User.updateOne(
        { email: email },
        {
          name: name,
          active: false,
          password: hash,
        }
      ))

    const updatedUser = await User.findOne({
      email: email,
    })

    const newOrUpdatedUser = newUser ? newUser : updatedUser

    const newUserId = newOrUpdatedUser.userId

    const code = await jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 20, //expires in 20 minutes
        userId: newUserId,
      },
      process.env.SECRET
    )

    // const activationUrl = `http://localhost:8080/api/activation/${event}/${code}`
    const activationUrl =
      env === 'production'
        ? `https://passport-email-signup-production.up.railway.app/api/activation/${event}/${code}`
        : `http://localhost:8080/api/activation/${event}/${code}`

    await emailVerify({
      name: newOrUpdatedUser.name,
      email: newOrUpdatedUser.email,
      url: activationUrl,
      url2: 'otherUrl',
      event,
      data: null,
    })

    return res
      .status(200)
      .json({ message: 'Successfully registered. Now go check your email.' })
  } catch (err) {
    console.log('Other error from signup: ', err)
    return res.status(500).json({
      error: true,
      message: 'Cannot Register User',
    })
  }
}

exports.Thanks = async (req, res) => {
  return res.json({ message: 'Thank you for activating your account.' })
}

exports.Activation = async (req, res) => {
  // activation link works without any session cookies - tested with postman
  try {
    const token = req.params.code

    const result = jwt.verify(
      token,
      process.env.SECRET,
      function (err, decoded) {
        if (err) {
          console.log('jwt.verify error: ', err)
          return { error: err }
        } else {
          return decoded
        }
      }
    )

    if (!token || !result) {
      return res.json({
        error: true,
        status: 400,
        message: 'Please make a valid request',
      })
    }

    if (result.error?.expiredAt) {
      const data = jwt.decode(token) // if token has expired, the 'verify' option only returns error details. Needs 'decode' to get user info.
      // User.deleteUser(data.userId) // not 100% sure about this. What if user accidentally clicks an old link.
      return res.status(400).json({
        message:
          'Sorry, this activation link has expired. Please register again. https://passport-email-signup-production.up.railway.app/login',
      })
    }

    const user = await User.findOne({
      userId: result.userId,
    })

    if (!user) {
      return res.status(400).json({
        error: true,
        message: 'Invalid details',
      })
    }

    user.active = true
    await user.save()
    res.redirect(
      'https://passport-email-signup-production.up.railway.app/login'
    )
    return res
      .status(200)
      .json({ message: 'Successfully activated, you may now log in.' })
  } catch (error) {
    console.error('activation-error', error)
    return res.json({
      error: true,
      message: 'Cannot Activate User',
    })
  }
}

exports.Login = async (req, res) => {
  try {
    const body = await userSchema.validate(req.body)

    if (body.error) {
      return res.status(400).json({
        error: true,
        status: 400,
        message: body.error.details[0].message,
      })
    }
    const { email, password, userData } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: 'Cannot authorize user.',
      })
    }

    const user = await User.findOne({ email: email })

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'Account not found',
      })
    }

    if (!user.active) {
      return res.status(400).json({
        error: true,
        message: 'You must verify your email to activate your account',
      })
    }

    const isValid = await User.comparePasswords(password, user.password)

    if (!isValid) {
      return res.status(400).json({
        error: true,
        message: 'Invalid credentials',
      })
    }

    req.session.user = user.userId

    const { error, token } = await generateJwt(user.email, user.userId)

    if (error) {
      return res.status(500).json({
        error: true,
        message: "Couldn't create access token. Please try again later",
      })
    }
    //Success
    await emailVerify({
      name: user.name,
      email,
      url: 'https://passport-email-signup-production.up.railway.app/forgot',
      url2: 'otherUrl',
      event: 'login',
      data: userData,
    })

    return res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'development',
      })
      .send({
        success: true,
        message: 'User logged in successfully',
        role: user.role,
        id: user.userId,
        name: user.name,
        email: user.email,
      })
  } catch (error) {
    console.error('Login error', error)
    return res.status(500).json({
      error: true,
      message: "Couldn't login. Please try again later.",
    })
  }
}

exports.Logout = (req, res, next) => {
  req.session.destroy()
  // next, delete both cookies
  res
    .cookie('connect.sid', '', { expires: new Date(1) })
    .cookie('access_token', '', { expires: new Date(1) })
    .json('You are logged out')
}

exports.ForgotPw = async (req, res) => {
  // Forgot !== Reset
  // Forgot pw requires user verification by email.
  // Reset requires matching old/current password, so no email verification is needed.
  try {
    const hash = await User.hashPassword(req.body.password)
    const user = await User.findOne({ email: req.body.email })
    user.password = hash
    user.active = false
    user.save()

    const userId = user.userId
    const code = await jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 20, //expires in 20 minutes
        userId: userId,
      },
      process.env.SECRET
    )

    const env =
      process.env.NODE_ENV === 'production' ? 'production' : 'development'

    const activationUrl =
      env === 'production'
        ? `https://passport-email-signup-production.up.railway.app/api/activation/${req.body.event}/${code}`
        : `http://localhost:8080/api/activation/${req.body.event}/${code}`

    const resetUrl =
      env === 'production'
        ? `https://passport-email-signup-production.up.railway.app/forgot`
        : `http://localhost:8080/forgot`

    const sendMail = await emailVerify({
      name: user.name,
      email: user.email,
      url: activationUrl,
      url2: resetUrl,
      event: 'forgot',
      data: null,
    })

    return res.send({
      success: true,
      message: 'Password updated, please check your email to verify.',
    })
  } catch (err) {
    console.log('ForgotPw error: ', err)
    return res.status(500).json({
      error: true,
      message: "Couldn't update record. Please try again later.",
    })
  }
}

exports.ResetPw = async (req, res) => {
  // Forgot !== Reset
  // Forgot pw requires user verification by email.
  // Reset requires matching old/current password, so no email verification is needed.
  try {
    const body = await req.body
    console.log('resetpw req', req.body)
    const oldPassword = req.body.oldPassword
    const password = req.body.password
    const email = req.body.email

    const user = await User.findOne({ email: email })

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'Account not found',
      })
    }

    if (!user.active) {
      return res.status(400).json({
        error: true,
        message: 'You must verify your email to activate your account',
      })
    }

    const isValid = await User.comparePasswords(oldPassword, user.password)

    if (!isValid) {
      return res.status(400).json({
        error: true,
        message: 'Invalid credentials',
      })
    }

    const hash = await User.hashPassword(password)

    user.password = hash
    user.save()

    return res.send({
      success: true,
      message:
        'Password update successful. You may log in with your new password.',
    })
  } catch (err) {
    console.log('ResetPw error: ', err)
    return res.status(500).json({
      error: true,
      message: "Couldn't update record. Please try again later.",
    })
  }
}

exports.Edit = async (req, res) => {
  const editUserSchema = Joi.object().keys({
    name: Joi.string().max(64),
    email: Joi.string().email({ minDomainSegments: 2 }).max(64),
  })
  try {
    const body = await editUserSchema.validate(req.body)
    if (body.error) {
      console.log('body.error', body.error)
      return res.status(400).json({
        error: true,
        status: 400,
        message: body.error.details[0].message,
      })
    }

    const user = await User.findOne({ email: req.body.email })

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'Account not found',
      })
    }

    if (!user.active) {
      return res.status(400).json({
        error: true,
        message: 'You must verify your email to activate your account',
      })
    }

    user.name = req.body.name
    user.save()
    return res.status(200).json({
      success: true,
      message: 'Successfully updated your user record.',
    })
  } catch (err) {
    console.log('Edit error: ', err)
  }
}

exports.Router = async (req, res) => {
  const data = await getDeviceData()
  return res.json(data)
}

exports.Contact = async (req, res) => {
  try {
    const result = userSchema.validate(req.body)
    if (result.error) {
      console.log('Contact form, Joi error: ', result.error.message)
      return res.json({
        error: true,
        status: 400,
        message: result.error.message,
      })
    }

    await emailContact({
      name: result.name,
      email: result.email,
      message: result.msg,
    })
  } catch (err) {
    console.log('Contact error: ', err)
    return res.status(500).json({ error: err })
  }
}
