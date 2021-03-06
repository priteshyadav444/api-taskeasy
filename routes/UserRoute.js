var express = require("express");
const User = require("../models/User");
var router = express.Router();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
var requestIp = require("request-ip");
const authUser = require("../middleware/authUser");

// v1/users/signup
// Create Account
// Public
router.post("/signup", function (req, res) {
  const { firstname, lastname, password, email } = req.body;
  console.log("v1/users/signup METHOD : POST");
  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ msg: "ALL_FIELD_REQUIRED" });
  }
  User.findOne({ email })
    .then((user) => {
      if (user) {
        return res.status(400).json({ msg: "USER_EXISTS" });
      } else {
        const newmember = new User({
          firstname,
          lastname,
          email,
          password,
        });

        //create salt & Hash
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newmember.password, salt, (err, hash) => {
            if (err) throw err;
            newmember.password = hash;

            newmember
              .save()
              .then((member) => {
                jwt.sign(
                  { _id: member._id },
                  process.env.SECRET_KEY,
                  { expiresIn: 1455555 },
                  (err, authToken) => {
                    if (err) throw err;
                    res.status(200).json({
                      authToken,
                      user: {
                        _id: member._id,
                        firstname: member.firstname,
                        lastname: member.lastname,
                        email: member.email,
                      },
                    });
                  }
                );
              })
              .catch((err) => {
                console.log(err);
                return res.status(400).json({ msg: "SIGNUP_FAILED" });
              });
          });
        });
      }
    })
    .catch((err) => {
      console.log(err);
      if (err) return res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
    });
});

// v1/users/signin
// Login Account
// Public
router.post("/signin", (req, res) => {
  var clientIp = requestIp.getClientIp(req);
  console.log("v1/users/signin METHOD : POST  " + clientIp);

  const { email, password } = req.body;

  console.log(clientIp);
  if (!email || !password) {
    return res.status(400).json({ msg: "ALL_FIELD_REQUIRED" });
  }

  User.findOne({ email })
    .then((member) => {
      if (!member) return res.status(400).json({ msg: "USER_NOT_EXISTS" });

      bcrypt.compare(password, member.password).then((isMatch) => {
        if (!isMatch) return res.status(400).json({ msg: "WRONG_PASSWORD" });

        jwt.sign(
          { _id: member._id },
          process.env.SECRET_KEY,
          { expiresIn: 1100011 },
          (err, authToken) => {
            if (err) throw err;
            res.json({
              authToken,
              user: {
                _id: member._id,
                firstname: member.firstname,
                lastname: member.lastname,
                email: member.email,
              },
            });
          }
        );
      });
    })
    .catch((err) => {
      return res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
    });
});

// v1/users/load
// Load Users
// Public
router.get("/load", authUser, (req, res) => {
  var clientIp = requestIp.getClientIp(req);
  console.log("v1/users/load METHOD : GET  " + clientIp);

  User.findOne({ _id: req.user._id })
  .then((member) => {
   
    jwt.sign(
        { _id: member._id },
        process.env.SECRET_KEY,
        { expiresIn: 1100011 },
        (err, authToken) => {
          if (err) throw err;
          res.json({
            authToken,
            user: {
              _id: member._id,
              firstname: member.firstname,
              lastname: member.lastname,
              email: member.email,
            },
          });
        }
      );
  })
  .catch((err) => {
    return res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
  });
});

module.exports = router;
