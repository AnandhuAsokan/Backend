const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const userSchema = new mongoose.Schema({
  user_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
  },
  orders: [{
    product_id: { type: mongoose.Schema.Types.ObjectId },
    date : {type: Date,
      default: Date.now
    }
  }],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
