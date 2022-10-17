require('dotenv').config()
const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const FileStore = require('session-file-store')(session)
const passport = require('passport')
const uuid = require('uuid').v4
const bodyParser = require('body-parser')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')

const User = require('./models/user.model')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.static(path.join(__dirname, 'build')))

const fileStore = new FileStore()
/*

console.log('fileStore: ',fileStore)
FileStore {
  _events: [Object: null prototype] {},
  _eventsCount: 0,
  _maxListeners: undefined,
  options: {
    path: 'sessions',
    ttl: 3600,
    retries: 5,
    factor: 1,
    minTimeout: 50,
    maxTimeout: 100,
    reapInterval: 3600,
    reapMaxConcurrent: 10,
    reapAsync: false,
    reapSyncFallback: false,
    logFn: [Function: log],
    encoding: 'utf8',
    encoder: [Function: stringify],
    decoder: [Function: parse],
    encryptEncoding: 'hex',
    fileExtension: '.json',
    crypto: { algorithm: 'aes-256-gcm', hashing: 'sha512', use_scrypt: true },
    keyFunction: [Function: keyFunction],
    filePattern: /\.json$/,
    reapIntervalObject: Timeout {
      _idleTimeout: 3600000,
      _idlePrev: [TimersList],
      _idleNext: [TimersList],
      _idleStart: 770,
      _onTimeout: [Function (anonymous)],
      _timerArgs: undefined,
      _repeat: 3600000,
      _idlePrev: [TimersList],
      _idleNext: [TimersList],
      _idleStart: 770,
      _onTimeout: [Function (anonymous)],
      _timerArgs: undefined,
      _repeat: 3600000,
      _destroyed: false,
      [Symbol(refed)]: false,
      [Symbol(kHasPrimitive)]: false,
      [Symbol(asyncId)]: 8,
      [Symbol(triggerId)]: 1
    }
  },
  [Symbol(kCapture)]: false
}
 */
app.use(
  session({
    genid: (req) => {
      return uuid()
    },
    store: fileStore,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 12 * 60 * 60 * 1000,
    },
  })
)

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Database connection Success.')
  })
  .catch((err) => {
    console.error('Mongo Connection Error', err)
  })

const findUser = async (email) => {
  const user = await User.findOne({ email })
  return user
}

passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      const user = await findUser(email)

      if (!user) {
        console.log('passport !user error')
        return done(null, false, {
          message: 'There was a problem. -passport-',
        })
      }
      if (!bcrypt.compareSync(password, user.password)) {
        console.log('passport password mismatch')
        return done(null, false, { message: 'Invalid credentials. -passport-' })
      }
      console.log('passport success')
      return done(null, user)
    }
  )
)

passport.serializeUser((user, done) => {
  console.log('passport.serialize', user)
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
   console.log('passport.deserialize', id)
  const user = await User.findById(id)
  return done(null, user)
})

app.use(passport.initialize())
app.use(passport.session())

const router = require('./routes/router')
app.use('/api', router)

app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

const nodemailer = require('nodemailer')

console.log('process.env', process.env.NODE_ENV)

const PORT = process.env.PORT || 8080

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`)
})
