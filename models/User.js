const mongoose = require('mongoose')

/* Role meanings:
* 5: owner
* 4: co-owner
* 3: chef
* 2: waiter
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

module.exports = mongoose.model('User', schema)