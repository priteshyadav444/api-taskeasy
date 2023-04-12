const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

// user and token
function authUser(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ msg: "AUTH_DENAID" });
  try {
    //verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    console.log(req.user);
    User.findOne({ _id: req.user }).then((member) => {
      if (!member) {
        const error = {
          errors: [
            {
              msg: "USER_NOT_EXISTS",
              param: "_id",
            },
          ],
        };
        return res.status(404).json(error);
      }
    });
    next();
  } catch (error) {
    console.log(error);
    let errorCode = "";

    if (err instanceof TokenExpiredError) {
      const errorPayload = {
        errors: [
          {
            msg: "TOKEN_EXPIRED",
            errorDetails: err,
          },
        ],
      };
      res.status(400).json(errorPayload);
    } else {
      const errorPayload = {
        errors: [
          {
            msg: "INVALID_TOKEN",
            errorDetails: err,
          },
        ],
      };
      res.status(400).json(errorPayload);
    }
  }
}

module.exports = authUser;
