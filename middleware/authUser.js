const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");
const { getErrorPayload } = require("../shared/PayloadFormat");

// user and token
function authUser(req, res, next) {
  try {
    const token = req.header("x-auth-token");
    if (!token) {
      return res
        .status(401)
        .json(getErrorPayload("AUTH_DENAID", "Authentication Failed. Token Required", 401));
    }
    console.log("inside");
    //verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    // User.findOne({ _id: req.user }).then((member) => {
    //   if (!member) {
    //     return res.status(404).json(getErrorPayload("USER_NOT_EXISTS", 404));
    //   }
    // });
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res
        .status(400)
        .json(
          getErrorPayload("TOKEN_EXPIRED", "Your Session Expired", 400, error)
        );
    } else {
      return res
        .status(400)
        .json(
          getErrorPayload(
            "INVALID_TOKEN",
            "Invalid Token Please Login Again",
            400,
            error
          )
        );
    }
  }
}

module.exports = authUser;
