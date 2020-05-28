const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')


/* Role meanings:
* 5: owner
* 4: co-owner
* 3: chef
* 2: waiter
* 1: customer
*/

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: Number,
    required: true
  }
})

schema.plugin(uniqueValidator)


module.exports = mongoose.model('User', schema)