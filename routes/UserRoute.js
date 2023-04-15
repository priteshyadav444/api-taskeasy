var express = require("express");
const User = require("../models/User");
var router = express.Router();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
var requestIp = require("request-ip");
const authUser = require("../middleware/authUser");
const { ObjectId } = require("mongodb");
const {
  body,
  validationResult,
  sanitizeBody,
  check,
} = require("express-validator");
const {
  getErrorPayload,
  getSuccessPayload,
} = require("../shared/PayloadFormat");

const firstnameValidation = [
  body("firstname")
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("First name must be between 1 and 30 characters")
    .bail(),
];

// Validation for last name
const lastnameValidation = [
  body("lastname")
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("Last name must be between 1 and 30 characters")
    .bail(),
];

// Validation for password
const passwordValidation = [
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
];

// Validation for email
const emailValidation = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .bail()
    .customSanitizer((value) => value.toLowerCase())
    .isLength({ max: 100 })
    .withMessage("Email Address is Too Long")
    .bail(),
];

// Combine all validations
const signupValidation = [
  ...firstnameValidation,
  ...lastnameValidation,
  ...passwordValidation,
  ...emailValidation,
];

// v1/users/signup
// Create Account
// Public
router.post("/signup", signupValidation, function (req, res) {
  const { firstname, lastname, password, email } = req.body;
  console.log("v1/users/signup METHOD : POST");

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // senitization of input
  check("firstname").escape();
  check("lastname").escape();
  check("password").escape();
  check("email").normalizeEmail();

  // checking is already exists
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
            // 2 days expiry time
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
                  .json(
                    getErrorPayload(
                      "SIGNUP_FAILED",
                      "Signup Failed Please Try Again",
                      400,
                      err
                    )
                  );
              });
          });
        });
      }
    })
    .catch((err) => {
      if (err)
        return res
          .status(400)
          .json(getErrorPayload("SERVER_ERROR", "Something Went Wrong", 400));
    });
});

const signinValidation = [
  ...emailValidation,
  check("password")
    .exists()
    .withMessage("Password is required")
    .trim()
    .isLength({ min: 1, max: 40 })
    .withMessage("Enter Valid Password"),
];
// v1/users/signin
// Login Account
// Public
router.post("/signin", signinValidation, async (req, res) => {
  var clientIp = requestIp.getClientIp(req);
  console.log("v1/users/signin METHOD : POST  " + clientIp);

  const { email, password } = req.body;
  // senitization of input
  check("email").normalizeEmail();
  check("password").escape();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json(
          getErrorPayload(
            "INVALID_CREDENTIALS",
            "Email ID Is Not Registered",
            401
          )
        );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json(
          getErrorPayload("INVALID_CREDENTIALS", "Password Is Incorrect", 401)
        );
    }

    const authToken = jwt.sign({ _id: user._id }, process.env.SECRET_KEY, {
      expiresIn: 1100011,
    });

    res.json({
      authToken,
      user: {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
      },
    });
  } catch (error) {
    return res
      .status(400)
      .json(getErrorPayload("SERVER_ERROR", "Something Went Wrong", 400));
  }
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

const updateProfileValidation = [
  ...firstnameValidation,
  ...lastnameValidation,
  ...emailValidation,
];

// v1/users/updateProfile
// Update User Profile
// Private
router.put(
  "/updateProfile",
  authUser,
  updateProfileValidation,
  async function (req, res) {
    const { firstname, lastname, imgurl, email, country, phone_no } = req.body;
    console.log("v1/users/updateProfile METHOD : PUT");
    // return errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Sanitize input fields
    check("firstname").escape();
    check("lastname").escape();
    check("country").escape();
    check("phone_no").escape();
    check("email").normalizeEmail();

    try {
      // Check if user exists
      const user = await User.findById(req.user._id);
      if (!user) {
        return res
          .status(404)
          .json(getErrorPayload("USER_NOT_FOUND", "User Not Exists", 404));
      }

      // If email is passed for update, check if it already exists in the system
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res
            .status(409)
            .json(
              getErrorPayload(
                "EMAIL_ALREADY_REGISTERED",
                "Email is already registered",
                409
              )
            );
        }
        user.email = email;
      }

      // Update other fields if they are passed in the request body
      if (firstname) {
        user.firstname = firstname;
      }
      if (lastname) {
        user.lastname = lastname;
      }
      if (imgurl) {
        user.imgurl = imgurl;
      }
      if (country) {
        user.country = country;
      }
      if (phone_no) {
        user.phone_no = phone_no;
      }

      // Save updated user
      const updatedUser = await user.save();

      // Return updated user details
      res.status(200).json({
        user: {
          _id: updatedUser._id,
          firstname: updatedUser.firstname,
          lastname: updatedUser.lastname,
          imgurl: updatedUser.imgurl,
          email: updatedUser.email,
          country: updatedUser.country,
          phone_no: updatedUser.phone_no,
        },
      });
    } catch (error) {
      // Handle errors
      return res
        .status(400)
        .json(
          getErrorPayload("SERVER_ERROR", "Something Went Wrong", 400, error)
        );
    }
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
