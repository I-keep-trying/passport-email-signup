const LocalStrategy = require('passport-local').Strategy
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

//load user model
const User = require('../models/user.model')

module.exports = function (passport) {
  //console.log('passport function')
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, 
    (email, password, done) => {
     // console.log('email',email)
      User.findOne({ email: email })
        .then((user) => {
          if (!user) {
            return done(null, false, {
              message: 'That email is not registered',
            })
          }
          bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err
            if (isMatch) {
              return done(null, user)
            } else {
              return done(null, false, { message: 'Incorrect Password' })
            }
          })
        })
        .catch((err) => console.log('LocalStrategy error: ', err))
    })
  )
  passport.serializeUser((user, done) => {
    console.log('passport.serializeUser', user)
    done(null, user.id)
  })
  passport.deserializeUser((id, done) => {
    User.findById(id, function (err, user) {
      done(err, user)
    })
  })
}
