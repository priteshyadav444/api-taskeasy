const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");
const { getErrorPayload } = require("../shared/PayloadFormat");

// user and token
function authUser(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json(getErrorPayload("AUTH_DENAID", 401));
  try {
    //verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    User.findOne({ _id: req.user }).then((member) => {
      if (!member) {
        return res.status(404).json(getErrorPayload("USER_NOT_EXISTS", 404));
      }
    });
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return res.status(400).json(getErrorPayload("TOKEN_EXPIRED", 400));
    } else {
      return res.status(400).json(getErrorPayload("INVALID_TOKEN", 400, error));
    }
  }
}

module.exports = authUser;
