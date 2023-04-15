var express = require("express");
const User = require("../models/User");
var router = express.Router();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
var requestIp = require("request-ip");
const authUser = require("../middleware/authUser");
const { ObjectId } = require("mongodb");
const { body, validationResult, sanitizeBody } = require("express-validator");
const {
  getErrorPayload,
  getSuccessPayload,
} = require("../shared/PayloadFormat");

// v1/users/signup
// Create Account
// Public
router.post(
  "/signup",
  body("firstname")
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("First name must be between 1 and 30 characters")
    .bail(),
  body("lastname")
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("Last name must be between 1 and 30 characters")
    .bail(),
  body("password")
    .isLength({ min: 8, max: 40 })
    .withMessage("Password must be between 8 and 40 characters")
    .bail()
    .matches(
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+}{"':;?/>.<,])(?!.*\s).*$/
    )
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    )
    .bail(),
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .bail()
    .customSanitizer((value) => value.toLowerCase())
    .isLength({ max: 100 })
    .withMessage("Email Address is Too Long")
    .bail(),
  function (req, res) {
    const { firstname, lastname, password, email } = req.body;
    console.log("v1/users/signup METHOD : POST");

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // senitization of input
    sanitizeBody("firstname").escape();
    sanitizeBody("lastname").escape();
    sanitizeBody("password").escape();
    sanitizeBody("email").normalizeEmail();

    User.findOne({ email })
      .then((user) => {
        if (user) {
          return res
            .status(409)
            .json(
              getErrorPayload(
                "EMAIL_ALREADY_REGISTERED",
                "User Already Exist",
                409
              )
            );
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
              const expiresTimeInSeceond = 172800;
              newmember
                .save()
                .then((member) => {
                  jwt.sign(
                    { _id: member._id },
                    process.env.SECRET_KEY,
                    { expiresIn: expiresTimeInSeceond },
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
                  return res
                    .status(400)
                    .json(getErrorPayload("SIGNUP_FAILED", 400));
                });
            });
          });
        }
      })
      .catch((err) => {
        if (err)
          res.status(400).json(getErrorPayload("Something went Wrong", 400));
      });
  }
);

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
      return res.status(400).json(getErrorPayload("SOMETHING_WENT_WRONG", 400));
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
      return res.status(400).json(getErrorPayload("SOMETHING_WENT_WRONG", 400));
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
      .withMessage("Enter Valid Email Address")
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
          return res
            .status(404)
            .json(getErrorPayload("USER_NOT_FOUND", 404, error));
        } else {
          // If Email Passed for Update. than checking Is Already Exist In A System
          if (email && email !== user.email) {
            User.findOne({ email }).then((existingUser) => {
              if (existingUser) {
                return res
                  .status(400)
                  .json(getErrorPayload("EMAIL_ALREADY_REGISTERED", 400));
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
              return res
                .status(400)
                .json(getErrorPayload("PROFILE_UPDATE_FAILED", 400, err));
            });
        }
      })
      .catch((err) => {
        return res
          .status(400)
          .json(getErrorPayload("SOMETHING_WENT_WRONG", 400, err));
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
    return res
      .status(400)
      .json(getErrorPayload("OLD_AND_NEW_PASSWORD_REQUIRED", 400));
  }

  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        return res.status(404).json(getErrorPayload("USER_NOT_FOUND", 404));
      }

      bcrypt.compare(old_password, user.password, (err, isMatch) => {
        if (err) throw err;

        if (!isMatch) {
          return res
            .status(401)
            .json(getErrorPayload("INVALID_OLD_PASSWORD", 401));
        }

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(new_password, salt, (err, hash) => {
            if (err) throw err;
            user.password = hash;

            user
              .save()
              .then(() => {
                return res
                  .status(401)
                  .json(getSuccessPayload("PASSWORD_UPDATED", 200));
              })
              .catch((err) => {
                return res
                  .status(400)
                  .json(getErrorPayload("PASSWORD_UPDATE_FAILED", 400, err));
              });
          });
        });
      });
    })
    .catch((err) => {
      if (err)
        return res
          .status(400)
          .json(getErrorPayload("SOMETHING_WENT_WRONG", 400, err));
    });
});

module.exports = router;
