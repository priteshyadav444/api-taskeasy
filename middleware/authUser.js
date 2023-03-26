const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

// this middle ware check user and token
function authUser(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ msg: "AUTH_DENAID" });
  try {
    //verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;

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
    res.status(400).json({ msg: "INVALID_TOKEN" });
  }
}

module.exports = authUser;
