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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food'
    }
  ]
})


module.exports = mongoose.model('Order', schema)