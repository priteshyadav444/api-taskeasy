var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
require("dotenv").config();
var app = express();
const uri = process.env.MONGO_URI;
const userRouter = require("./routes/UserRoute");
const taskRouter = require("./routes/TaskRoute");
const projectRouter = require("./routes/ProjectRoute");
const PORT = process.env.PORT || 3000;
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
process.env.TZ = "UTC";

// configuring request limit is 25mb
app.use(bodyParser.json({ limit: "25mb" }));
app.use(bodyParser.urlencoded({ limit: "25mb", extended: true }));
app.use(express.json({ extended: false }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(function (request, response, next) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const corsOptions = {
  origin: [
    "https://taskeasy.in",
    "https://taskeasy.co.in",
    "http://localhost:4200",
  ],
};

app.use(cors(corsOptions));

app.use("/v1/users", userRouter);
app.use("/v1/tasks", taskRouter);
app.use("/v1/projects", projectRouter);

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDb Connected");
  })
  .catch((err) => console.log(err.message));

try {
  console.log(new Date().toString());
  app.listen(PORT, () => console.log(`Server Running At ${PORT}`));
} catch (error) {
  console.log(error);
}
