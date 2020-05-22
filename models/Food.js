const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
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


module.exports = mongoose.model('Food', schema)