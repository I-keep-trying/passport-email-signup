require('dotenv').config()
const nodemailer = require('nodemailer')
const emailBody = require('./email-body')
const emailRe = require('./re-register-existing')

async function sendEmail(name, email, url, event) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    auth: {
      user: process.env.GMAIL,
      pass: process.env.GMAIL_APP_PW,
    },
  })

  const html = event === 're-register' ? emailBody : emailRe

  const mailOptions = {
    to: email,
    subject: 'Activate your account',
    text: `Click here to activate: ${url}`,
    html: html(name, email, url),
  }

  try {
    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('nodemailer error: ', error)
      } else {
        console.log('Email sent: ', info.response)
      }
    })
  } catch (error) {
    console.error('sendEmail function error: ', error)
    return {
      error: true,
      message: 'Cannot send email',
    }
  }
}

module.exports = { sendEmail }
