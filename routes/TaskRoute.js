var express = require("express");
const User = require("../models/User");
var router = express.Router();
require("dotenv").config();

const { ObjectId } = require("bson");
const authUser = require("../middleware/authUser");

// v1/tasks
// Create Task
// Auth Required
router.post("/", authUser, function (req, res) {
  console.log("v1/tasks/ METHOD : POST");
  const _id = ObjectId();
  var { title, description, category, scheduled_date, completed, subtasklist } =
    req.body;
  const userid = req.user;

  if (scheduled_date == null || scheduled_date == "") {
    scheduled_type = "unscheduled_task";
  } else {
    scheduled_type = "scheduled_task";
  }

  if (!title) {
    return res.status(400).json({ msg: "TITLE_REQUIRED" });
  }
  const newTask = {
    title,
    description,
    category,
    scheduled_type,
    scheduled_date,
    completed,
    subtasklist,
    _id,
  };

  User.updateOne({ _id: userid }, { $push: { tasks: newTask } })
    .then((result) => {
      res.status(200).json(newTask);
    })
    .catch((err) => {
      console.log(err);
      return res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
    });
});

// v1/tasks
// Get ALl  Task
// Auth Required
router.get("/", authUser, (req, res) => {
  console.log("v1/tasks/ METHOD : GET");
  const userid = req.user;

  User.findOne({ _id: userid }, function (err, result) {
    if (err) {
      res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
    }

    if (result) {
      const taskList = result.tasks;
      return res.status(200).json([...taskList]);
    }
  });
});

// v1/tasks
// Get ALl  Task
// Auth Required

router.get("/:id", (req, res) => {
  console.log("v1/tasks/" + req.params.id + " METHOD : GET");
  const userid = "625bcdfc932003d586fcac8f";

  const taskid = req.params.id;

  User.findOne({ _id: userid }, function (err, result) {
    if (err) {
      res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
    }

    if (result) {
      const task = result.tasks.find((rs) => {
        if (rs._id.toString() == taskid.toString()) {
          return rs;
        }
      });

      if (task) {
        return res.status(200).json({ task });
      } else {
        return res.status(200).json({ msg: "TASK_NOT_FOUND" });
      }
    }
  });
});

// v1/tasks/
// Get ALl  Task
// Auth Required Update

router.put("/update", authUser, function (req, res) {
  console.log("v1/tasks/ METHOD : put");
  const userid = req.user;
  const data = req.body;

  User.updateOne(
    { _id: userid, "tasks._id": data },
    {
      $set: {
        "tasks.$.task_status": data.task_status,
      },
    },
    function (err, result) {
      if (err) {
        res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
      }

      if (result) {
        return res.status(200).json({ msg: "SUCESS" });
      }
    }
  );
});
module.exports = router;
