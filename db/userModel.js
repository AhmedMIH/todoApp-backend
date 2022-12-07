const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    require: [true, "please provide an Email"],
    unique: [true, "Email Exist"],
  },
  password: {
    type: String,
    require: [true, "Please provide a password!"],
    unique: [false],
  },
});

module.exports = mongoose.model.Users || mongoose.model("users", UserSchema);
