const mongoose = require("mongoose");

const todoSchame = new mongoose.Schema({
  todoName: {
    type: String,
    required: true,
  },
  todoDes: {
    type: String,
    required: true,
  },
  todoDate: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  userId:{
    type: String,
    required: true,
  }
});

module.exports= mongoose.model.Todos || mongoose.model("todos", todoSchame);
