const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true,
  },
  diet: {
    type: Array,
  },
  ingredients: {
    type: Array,
  },
  ratings: {
    type: Array,
  }
})

schema.plugin(uniqueValidator)

module.exports = mongoose.model('Food', schema)