const passport = require('passport')

module.exports = (req, res, next) => {
  console.log('passport_auth middleware')
  try {
    passport.authenticate('local', {
      failureRedirect: '/login',
      successRedirect: '/',
    })
    next()
    /*     (err, req, res, next) => {
        console.log('passport_auth req.body: ', req.body)
        if (err) {
          console.log('passport_auth error: ', err)
          return next(err)
        }
      } */
  } catch (err) {
    console.log('passport_auth catch (err)', err)
    next(err)
  }
}
