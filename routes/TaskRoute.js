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
  const projectid = req.params.id;

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

  User.updateOne(
    { _id: userid, "projects._id": projectid },
    {
      $push: {
        "projects.$.tasks": newTask,
      },
      $inc: {
        "projects.$.total_tasks": 1,
      },
    }
  )
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
router.get("/:id", authUser, (req, res) => {
  console.log("v1/tasks/ METHOD : GET");
  const userid = req.user;
  const projectid = req.params.id;
  console.log(projectid);
  User.findOne(
    { _id: userid, "projects._id": projectid },
    { "projects.$": 1 },
    function (err, result) {
      if (err) {
        res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
      }

      if (result) {
        const taskList = result.projects[0].tasks;
        return res.status(200).json([...taskList]);
      }
    }
  );
});

// v1/tasks
// Get ALl  Task
// Auth Required

// router.get("/:id", (req, res) => {
//   console.log("v1/tasks/" + req.params.id + " METHOD : GET");
//   const userid = "625bcdfc932003d586fcac8f";
//   const taskid = req.params.id;

//   User.findOne({ _id: userid }, function (err, result) {
//     if (err) {
//       res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
//     }

//     if (result) {
//       const task = result.tasks.find((rs) => {
//         if (rs._id.toString() == taskid.toString()) {
//           return rs;
//         }
//       });

//       if (task) {
//         return res.status(200).json({ task });
//       } else {
//         return res.status(200).json({ msg: "TASK_NOT_FOUND" });
//       }
//     }
//   });
// });

// v1/tasks/
// Get ALl  Task
// Auth Required Update

router.put("/update/:pid", authUser, function (req, res) {
  console.log("v1/tasks/ METHOD : UPDATE");
  const userid = req.user;
  const data = req.body;
  const projectid = req.params.pid;

  console.log(data._id);
  User.updateOne(
    {
      _id: userid,
    },
    {
      $set: {
        "projects.$[pid].tasks.$[tid]": data,
      },
    },
    {
      multi: false,
      upsert: false,
      arrayFilters: [
        {
          "pid._id": {
            $eq: projectid,
          },
        },
        {
          "tid._id": {
            $eq: data._id,
          },
        },
      ],
    },
    function (err, result) {
      console.log(err);
      if (err) {
        res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
      }

      if (result) {
        return res.status(200).json({ msg: "SUCESS" });
      }
    }
  );
});

// v1/tasks
// Get ALl  Task
// Auth Required

router.delete("/:pid/:id", authUser, (req, res) => {
  console.log("v1/tasks/" + req.params.id + " METHOD : DELETE");
  const userid = req.user;
  const taskid = req.params.id;
  const projectid = req.params.pid;

  User.updateOne(
    { _id: userid, "projects._id": projectid },
    {
      $pull: { "projects.0.tasks": { _id: taskid } },
    },
    function (err, result) {
      console.log(err);
      if (err) {
        res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
      } else {
        return res
          .status(200)
          .json({ msg: "TASK_DELETED_SUCCESS", data: result });
      }
    }
  );
});
module.exports = router;
