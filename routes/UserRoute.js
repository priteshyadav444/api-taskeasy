var express = require("express");
const User = require("../models/User");
var router = express.Router();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
var requestIp = require("request-ip");
const authUser = require("../middleware/authUser");
const { ObjectId } = require("mongodb");
const { body, validationResult } = require("express-validator");

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

  if (!email || !password) {
    return res.status(400).json({ msg: "ALL_FIELD_REQUIRED" });
  }

  User.findOne({ email })
    .then((member) => {
      if (!member) return res.status(400).json({ msg: "USER_NOT_EXISTS" });
      console.log(email);
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

// v1/users/updateProfile
// Update User Profile
// Private
router.put(
  "/updateProfile",
  authUser,
  [
    body("email")
      .if(body("email").notEmpty())
      .isEmail()
      .withMessage("INVALID_EMAIL")
      .bail()
      .customSanitizer((value) => value.trim())
      .isLength({ max: 100 })
      .withMessage("EMAIL_TOO_LONG")
      .bail(),
  ],
  function (req, res) {
    const { firstname, lastname, imgurl, email } = req.body;
    console.log("v1/users/updateProfile METHOD : PUT");

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    User.findById(req.user._id)
      .then((user) => {
        // If user not Found
        if (!user) {
          const error = {
            errors: [
              {
                msg: "USER_NOT_FOUND",
                errorDetails: err,
              },
            ],
          };
          return res.status(400).json(error);
        } else {
          // If Email Passed for Update. than checking Is Already Exist In A System
          if (email && email !== user.email) {
            User.findOne({ email }).then((existingUser) => {
              if (existingUser) {
                const error = {
                  errors: [
                    {
                      msg: "EMAIL_ALREADY_REGISTERED",
                      errorDetails: err,
                    },
                  ],
                };
                return res.status(400).json(error);
              } else {
                user.email = email;
              }
            });
          }
          if (firstname) {
            user.firstname = firstname;
          }

          if (lastname) {
            user.lastname = lastname;
          }

          if (imgurl) {
            user.imgurl = imgurl;
          }

          user
            .save()
            .then((updatedUser) => {
              res.status(200).json({
                user: {
                  _id: updatedUser._id,
                  firstname: updatedUser.firstname,
                  lastname: updatedUser.lastname,
                  imgurl: updatedUser.imgurl,
                  email: updatedUser.email,
                },
              });
            })
            .catch((err) => {
              const error = {
                errors: [
                  {
                    msg: "PROFILE_UPDATE_FAILED",
                    errorDetails: err,
                  },
                ],
              };
              return res.status(400).json(error);
            });
        }
      })
      .catch((err) => {
        const error = {
          errors: [
            {
              msg: "SOMETHING_WENT_WRONG",
              errorDetails: err,
            },
          ],
        };
        return res.status(400).json(error);
      });
  }
);

// v1/users/passwordUpdate
// Update User Profile
// Private
router.put("/updatePassword", authUser, function (req, res) {
  const { old_password, new_password } = req.body;
  console.log("v1/users/updatePassword METHOD : POST");

  if (!old_password || !new_password) {
    return res.status(400).json({ msg: "OLD_AND_NEW_PASSWORD_REQUIRED" });
  }

  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        return res.status(400).json({ msg: "USER_NOT_FOUND" });
      }

      bcrypt.compare(old_password, user.password, (err, isMatch) => {
        if (err) throw err;

        if (!isMatch) {
          return res.status(400).json({ msg: "INVALID_OLD_PASSWORD" });
        }

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(new_password, salt, (err, hash) => {
            if (err) throw err;
            user.password = hash;

            user
              .save()
              .then(() => {
                res.status(200).json({ msg: "PASSWORD_UPDATED" });
              })
              .catch((err) => {
                console.log(err);
                return res.status(400).json({ msg: "PASSWORD_UPDATE_FAILED" });
              });
          });
        });
      });
    })
    .catch((err) => {
      console.log(err);
      if (err) return res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
    });
});

module.exports = router;
