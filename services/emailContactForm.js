require('dotenv').config()
const nodemailer = require('nodemailer')
const register = require('../email_templates/register_user.js')
const forgot = require('../email_templates/forgot_password.js')
const login = require('../email_templates/login_success')

const emailContact = async (params) => {
  const { name, email, message } = params
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
    const msgWithEmail = `Message from: ${email} \n ${message}`
    /* 
   Apparently, when using gmail as a transporter service,
   the 'from' option will always contain the email of the authorized 
   nodemailer client, i.e., process.env.GMAIL in this case. 

   You can actually eliminate the 'from' option altogether; mailer still works and
   uses the transporter.auth.user value as the 'from' email address that the user will see.

   Also, you can customize the name displayed in the 'from' option, you must include a valid <email>,
   in tags, even though anything you put between tags will be ignored.
   */
    const options = {
      from: 'Website Contact Form 👥<d@g.com>', // When user gets email, the 'from' display name is 'Website Contact Form', and the email is my actual gmail from transporter.auth.user.
      to: 'drecrego@gmail.com',
      subject: 'New Message From Website',
      text: msgWithEmail,
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

module.exports = { emailContact }
