require('dotenv').config()
const nodemailer = require('nodemailer')
const register = require('../email_templates/register_user.js')
const forgot = require('../email_templates/forgot_password.js')
const login = require('../email_templates/login_success')

const emailVerify = async (params) => {
  const { name, email, data } = params
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

    const options = {
      from: `<${email}>`,
      to: 'drecrego@gmail.com',
      subject: 'New Message From Website',
      text: data,
    //  html: html(name, url),
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
