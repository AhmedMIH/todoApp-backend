const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const User = require("./db/userModel");
const todoModel = require("./db/todoModel");
const dbConnect = require("./db/dbConnect");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// body parser configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (request, response, next) => {
  response.json({ message: "Hey! This is your server response!" });
  next();
});

dbConnect();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

app.post("/register", (request, response) => {
  bcrypt
    .hash(request.body.password, 10)
    .then((hashedPassword) => {
      const user = new User({
        name: request.body.name,
        email: request.body.email,
        password: hashedPassword,
      });
      user
        .save()
        .then(() => {
          const token = jwt.sign(
            {
              userId: user._id,
              userEmail: user.email,
            },
            "RANDOM-TOKEN"
          );
          response.status(200).send({
            message: "register Successful",
            name: user.name,
            email: user.email,
            token,
          });
        })
        // catch error if the new user wasn't added successfully to the database
        .catch((error) => {
          response.status(500).send({
            message: "Error creating user",
            error,
          });
        });
    })
    .catch((e) => {
      response.status(500).send({
        message: "Password was not hashed successfully",
        e,
      });
    });
});

app.post("/login", (request, response) => {
  User.findOne({ email: request.body.email })
    .then((user) => {
      bcrypt
        .compare(request.body.password, user.password)
        .then((passwordCheck) => {
          if (!passwordCheck) {
            return response.status(400).send({
              message: "Passwords does not match",
              error,
            });
          }
          const token = jwt.sign(
            {
              userId: user._id,
              userEmail: user.email,
            },
            "RANDOM-TOKEN"
          );
          response.status(200).send({
            message: "Login Successful",
            email: user.email,
            name: user.name,
            token,
          });
        })
        .catch((error) => {
          response.status(400).send({
            message: "Passwords does not match",
            error,
          });
        });
    })
    .catch((e) => {
      response.status(404).send({
        message: "Email not found",
        e,
      });
    });
});

app.put("/chanePassword", async (request, response) => {
  const token = request.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "RANDOM-TOKEN");
  const user = await decoded;

  User.findOne({ _id: user.userId })
    .then((newUser) => {
      bcrypt
        .compare(request.body.oldPassword, newUser.password)
        .then((passwordCheck) => {
          if (!passwordCheck) {
            return response.status(400).send({
              message: "old password is wrong",
              error,
            });
          }
          bcrypt.hash(request.body.newPassword, 10).then((hashedPassword) => {
            const updatedUser = User.findByIdAndUpdate(
              { _id: newUser._id },
              {
                name: newUser.name,
                email: newUser.email,
                password: hashedPassword,
              }
            ).then((res)=>{
              console.log('res',res)
            })
          });

          response.status(200).send({
            message: "chnage password Successful",
          });
        })
        .catch((error) => {
          response.status(401).send({
            message: "old password is wrong",
            error,
          });
        });
    })
    .catch((e) => {
      response.status(404).send({
        message: "Email not found",
        e,
      });
    });
});

app.get("/todos", async (request, response, next) => {
  try {
    const token = request.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "RANDOM-TOKEN");
    const user = await decoded;
    await todoModel.find({ userId: user.userId }).then((todos)=>{

      return response.status(200).send({
        todos: todos,
      });
    })
  } catch (error) {
    return response.status(401).send(error);
  }
});

app.post("/add", (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "RANDOM-TOKEN");
  const id = decoded.userId;
  const { todo } = req.body;
  const newTodo = new todoModel({
    todoName: todo.name,
    todoDes: todo.description,
    todoDate: todo.date,
    state: todo.state,
    userId: id,
  });

  if (todo == "") {
    res.status(401).send({message:"please enter todo info"});
  } else {
    newTodo
      .save()
      .then((result) => {
        res.status(201).send({
          message: "todo Created Successfully",
        });
      })
      // catch error if the new user wasn't added successfully to the database
      .catch((error) => {
        res.status(500).send({
          message: "Error creating todo",
          error,
        });
      });
  }
});

app.put("/edit", async (req, res) => {
  const {
    query: { id },
    body,
  } = req;
  const { todo } = body;
 
  const updatedTodo = await todoModel
    .findByIdAndUpdate(
      { _id: id },
      {
        todoName: todo.name,
        todoDes: todo.description,
        todoDate: todo.date,
        state: todo.state,
      }
    )
    .then((result) => {
      res.status(201).send({
        message: "todo update Successfully",
        result,
      });
    })
    // catch error if the new user wasn't added successfully to the database
    .catch((error) => {
      res.status(500).send({
        message: "Error updateing todo",
        error,
      });
    });
});

app.delete("/delete", async (req, res) => {
  const {
    query: { id },
  } = req;
  const deletedTodo = await todoModel
    .findByIdAndRemove({ _id: id })
    .then((result) => {
      res.status(201).send({
        message: "todo delete Successfully",
      });
    })
    // catch error if the new user wasn't added successfully to the database
    .catch((error) => {
      res.status(500).send({
        message: "Error delete todo",
        error,
      });
    });
});

module.exports = app;
