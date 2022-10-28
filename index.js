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
const helmet = require('helmet')

const User = require('./models/user.model')

const app = express()

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'img-src': [
          "'self'",
          'data:',
          'https://uilogos.co/img/logomark/nira.png',
        ],
      },
    },
  })
)

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.static(path.join(__dirname, 'build')))

const fileStore = new FileStore()

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
  // console.log('passport.serialize', user)
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  // console.log('passport.deserialize', id)
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
