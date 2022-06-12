const jwt = require("jsonwebtoken");
require("dotenv").config();

function authUser(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ msg: "AUTH_DENAID" });
  try {
    //verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ msg: "INVALID_TOKEN" });
  }
}

module.exports = authUser;