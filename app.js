require('dotenv').config()
const express = require('express')
const cors = require('cors')
const nodemailer = require('nodemailer')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const helmet = require('helmet')
const { v4: uuid } = require('uuid')

const userModel = require('./models/user.model')
const authRoutes = require('./routes/router')

require('./config/passport')(passport)

const app = express()
app.use(cors())

const maxAge = 2 * 60 * 60
//Express session
app.use(
  session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: maxAge },
  })
)

// Security headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      'script-src': ["'self'", 'cdn.jsdelivr.net'],
      'img-src': ["'self'", 'uilogos.co'],
      'style-src': ["'self'", 'cdn.jsdelivr.net'],
    },
  })
)

/* 
TODO: finish nonce
https://github.com/marcomontalbano/test-nonce/blob/master/server.js
*/
app.use((req, res, next) => {
  res.locals.nonce = uuid()
  next()
})

//passport middleware
app.use(passport.initialize())
app.use(passport.session())

passport.use(userModel.createStrategy())
passport.serializeUser(userModel.serializeUser())
passport.deserializeUser(userModel.deserializeUser())

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

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json()) // not sure I need this

app.use('/api', authRoutes)

app.get('/api', (req, res) => {
  res.send('welcome to express app')
})

const PORT = process.env.PORT || 8080
app.listen(PORT, (err) => {
  if (err) throw err
  console.log(`Listening on port ${PORT}`)
})
