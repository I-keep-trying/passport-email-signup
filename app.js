require('dotenv').config()
const express = require('express')
const nodemailer = require('nodemailer')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')

//const path = require('path') // pretty sure I don't need this

const emailRoute = require('./routes/users.routes')
require('./config/passport')(passport)

const app = express()

//Express session
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
  })
)

//passport middleware
app.use(passport.initialize())
app.use(passport.session())

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
app.use(bodyParser.json()) // not sure I need this
//const cookieParser = require('cookie-parser')
//app.use(cookieParser()) // not needed with passport

app.use('/', emailRoute)

app.get('/', (req, res) => {
  res.send('welcome to express app')
})

/* app.get('/email', (req, res) => {
  try {
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log('nodemailer error: ', error)
      } else {
        console.log('Email sent: ' + info.response)
      }
    })
  } catch (err) {
    console.log('express error: ', err)
  }
}) */
const PORT = process.env.PORT || 8080
app.listen(PORT, (err) => {
  if (err) throw err
  console.log(`Listening on port ${PORT}`)
})
