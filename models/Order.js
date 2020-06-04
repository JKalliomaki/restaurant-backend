const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  waiter: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tableNr: {
    type: Number,
    required: true,
  },
  items: [
    {
      type: String
    }
  ]
})


module.exports = mongoose.model('Order', schema)