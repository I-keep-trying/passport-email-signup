require('dotenv').config()
const nodemailer = require('nodemailer')
const register = require('../email_templates/register_user.js')
const forgot = require('../email_templates/forgot_password.js')
const login = require('../email_templates/login_success.js')

const emailVerify = async (params) => {
  const { name, email, url, url2, event, data } = params
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.GMAIL,
        pass: process.env.GMAIL_APP_PW,
      },
      tls: {
        ciphers: 'SSLv3',
      },
    })

    const html = (name, url) => {
      if (event === 'register') {
        return register(name, url)
      } else if (event === 'forgot') {
        return forgot(name, url, url2)
      } else if (event === 'login') {
        return login(name, email, url, data)
      }
    }

    const subject = () => {
      if (event === 'register') {
        return 'Activate your account'
      } else if (event === 'forgot') {
        return 'Password Reset Request'
      } else if (event === 'login') {
        return `Successful login for ${name} with ${email}`
      }
    }

    const options = {
      from: 'ANDREA <drecrego@gmail.com>',
      to: email,
      subject: subject(),
      text: subject(),
      html: html(name, url),
    }

    const sent = await transporter.sendMail(options)
    return sent
  } catch (error) {
    console.error('sendEmail function error: ', error)
    return {
      error: true,
      message: 'Cannot send email',
    }
  }
}

module.exports = { emailVerify }
