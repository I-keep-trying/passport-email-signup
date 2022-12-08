const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const passportLocalMongoose = require('passport-local-mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema(
  {
    userId: { type: String, unique: true, required: true },
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: 'user' },
    active: { type: Boolean, default: false },
    avatar: String
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  }
)

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' })

const User = mongoose.model('user', userSchema)
module.exports = User

module.exports.hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(password, salt)
  } catch (error) {
    throw new Error('Hashing failed', error)
  }
}

module.exports.comparePasswords = async (inputPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(inputPassword, hashedPassword)
  } catch (error) {
    throw new Error('Comparison failed', error)
  }
}

module.exports.deleteUser = async (userId) => {
  try {
    await User.deleteOne({ userId: userId })
  } catch (error) {
    throw new Error('Delete failed', error)
  }
}
