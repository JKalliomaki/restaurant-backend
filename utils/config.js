require('dotenv').config()

let PORT = process.env.PORT
let MONGODB_URI = process.env.MONGODB_URI

const JWT_SECRET = process.env.JWT_SECRET

module.exports = {
    MONGODB_URI,
    PORT,
    JWT_SECRET
}