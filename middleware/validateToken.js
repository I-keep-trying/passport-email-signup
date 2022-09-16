require('dotenv').config()
const jwt = require('jsonwebtoken')
const User = require('../src/users/user.model')

async function validateToken(req, res, next) {
  console.log('validateToken.js')

  const authorizationHeader = req.headers.authorization
const authCookies = req.cookies.signup_token
  console.log('req.headers',req.headers)
  console.log('req.cookies',req.cookies.signup_token.token)
  let result

  if (!authorizationHeader)
    return res.status(401).json({
      error: true,
      message: 'Access token is missing',
    })
  const token = req.headers.authorization.split(' ')[1] // Bearer <token>
  const options = {
    expiresIn: '1h',
  }

  try {
    let user = await User.findOne({
      accessToken: token,
    })
    if (!user) {
      result = {
        error: true,
        message: `Authorization error from validateToken.js`,
      }
      return res.status(403).json(result)
    }
    result = jwt.verify(token, process.env.JWT_SECRET, options)
    if (!user.userId === result.id) {
      result = {
        error: true,
        message: `Invalid token`,
      }
      return res.status(401).json(result)
    }

    result['referralCode'] = user.referralCode

    req.decoded = result // append the result in the "decoded" field of req

    next()
  } catch (err) {
    console.error(err)
    if (err.name === 'TokenExpiredError') {
      result = {
        error: true,
        message: `TokenExpired`,
      }
    } else {
      result = {
        error: true,
        message: `Authentication error`,
      }
    }
    
    return res.status(403).json(result)
  }
}

module.exports = { validateToken }
