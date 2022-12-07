var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
require("dotenv").config();
var app = express();
const uri = process.env.MONGO_URI;
app.use(express.json({ extended: false }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
const userRouter = require('./routes/UserRoute');
const taskRouter = require('./routes/TaskRoute');
const projectRouter = require('./routes/ProjectRoute')
const PORT = process.env.PORT || 3000;
const mongoose = require("mongoose");
const cors = require('cors');


app.use(function (request, response, next) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(cors({
  origin: '*'
}));

app.use('/v1/users', userRouter);
app.use("/v1/tasks", taskRouter)
app.use("/v1/projects", projectRouter)

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() =>{
     console.log("MongoDb Connected")
    })
  .catch((err) => console.log(err.message));

try {
  app.listen(PORT, () => console.log(`Server Running At ${PORT}`));
} catch (error) {
  console.log(error)
} 
