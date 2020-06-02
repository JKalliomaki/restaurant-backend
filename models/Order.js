const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  orderer: {
    type: String,
    required: true
  },
  phoneNr: {
    type: String,
    required: true
  },
  items: [
    {
      type: String
    }
  ]
})


module.exports = mongoose.model('Order', schema)