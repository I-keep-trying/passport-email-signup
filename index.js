require('dotenv').config()
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

const router = require('./routes/router')


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
          message: 'There was a problem.',
        })
      }
      if (!bcrypt.compareSync(password, user.password)) {
        console.log('passport password mismatch')
        return done(null, false, { message: 'Invalid credentials.' })
      }
      return done(null, user)
    }
  )
)

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id)
  return done(null, user)
})

const app = express()

app.use(express.static('build'))

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(
  session({
    genid: (req) => {
      return uuid()
    },
    store: new FileStore(),
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge:  12 * 60 * 60 * 1000 
    }
  })
)

app.use(passport.initialize())
app.use(passport.session())

app.use('/api', router)

const nodemailer = require('nodemailer')

const PORT = process.env.PORT || 8080

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`)
})
