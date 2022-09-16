require('dotenv').config()
const { v4: uuid } = require('uuid')
const jwt = require('jsonwebtoken')
const { sendEmail } = require('../services/mailer')
const User = require('../models/user.model')
const passport = require('passport')
const Joi = require('joi')

const userSchema = Joi.object().keys({
  name: Joi.string().max(64),
  email: Joi.string().email({ minDomainSegments: 2 }).max(64),
  password: Joi.string().required().min(8).max(64),
})

exports.Test = async (req, res) => {
  console.log('req.body.email: ', req.body)
}

exports.Thanks = async (req, res) => {
  return res.json({ message: 'Thank you for activating your account.' })
}

exports.Signup = async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
    })
    console.log('Signup user: ', user)

    if (user) {
      // to do: send email to (existing) user to acknowledge/verify intent to sign up
      // if user is active, send pw update form
      const code = await jwt.sign(
        {
          exp: Math.floor(Date.now() / 1000) + 60 * 5, //expires in 5 minutes
          userId: user.userId,
        },
        process.env.JWT_SECRET
      )

      const activationUrl = `http://localhost:8080/activation/${code}`

      const sendCode = await sendEmail(
        user.name,
        user.email,
        activationUrl,
        're-register'
      )

      return res.json({
        error: true,
        message: 'Sorry, no can do.', // intentionally vague for security reasons
      })
    }

    const hash = await User.hashPassword(req.body.password)
    const id = uuid()
    const newUser = new User({
      userId: id,
      name: req.body.name,
      email: req.body.email,
      password: hash,
    })

    newUser.save()

    const code = await jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 5, //expires in 5 minutes
        userId: newUser.userId,
      },
      process.env.JWT_SECRET
    )
    // Opinion: I don't think it matters, put the jwt in the url or headers (??) url is easier
    const activationUrl = `http://localhost:8080/activation/${code}`

    const sendCode = await sendEmail(
      newUser.name,
      newUser.email,
      activationUrl,
      'initial-register'
    )

    return res.status(200).json({
      success: true,
      message: 'Account created. Go check your email to complete registration.',
    })
  } catch (error) {
    console.error('signup-error', error)
    return res.status(500).json({
      error: true,
      message: 'Cannot Register User',
    })
  }
}

exports.Activation = async (req, res) => {
  try {
    const token = req.params.code
    const result = jwt.verify(
      token,
      process.env.JWT_SECRET,
      function (err, decoded) {
        if (err) {
          console.log('jwt.verify error: ', err)
          return { error: err }
        } else {
          //   console.log('jwt.verify decoded: ', decoded)
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
      User.deleteUser(data.userId) // not 100% sure about this. What if user accidentally clicks an old link.
      return res.status(400).json({
        message:
          'Sorry, this activation link has expired. Please register again. http://localhost:8080/signup',
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

    if (user.active)
      // TODO: need to make pw reset option & send regardless if user active or not
      return res.send({
        error: true,
        message: 'Account already activated',
        status: 400,
      })

    user.active = true
    await user.save()
    return res
      .status(200)
      .json({ message: 'Successfully activated, you may now log in.' }) //.redirect('http://localhost:3000/login')
  } catch (error) {
    console.error('activation-error', error)
    return res.status(500).json({
      error: true,
      message: 'Cannot Activate User',
    })
  }
}

exports.Login = (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/thankyou',
    failureRedirect: '/login',
    failureFlash: true,
  })(req, res, next)
}

exports.Logout = () => {
  // passport adds the 'req.logout' function
  req.logout(function (err) {
    if (err) {
      return next(err)
    }
    res.json('You are logged out').redirect('/users/login')
  })
}


