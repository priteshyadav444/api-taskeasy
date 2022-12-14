var express = require("express");
const User = require("../models/User");
var router = express.Router();
require("dotenv").config();
const { ObjectId } = require("bson");
const authUser = require("../middleware/authUser");

// v1/tasks
// Create Task
// Auth Required
router.post("/:id", authUser, function (req, res) {
  console.log("v1/tasks/ METHOD : POST");
  const _id = ObjectId();
  var {
    pid,
    title,
    description,
    category,
    badge,
    scheduled_date,
    completed,
    subtasklist,
  } = req.body;
  const userid = req.user;
  const projectid = req.params.id;

  if (scheduled_date == null || scheduled_date == "") {
    scheduled_type = "unscheduled_task";
  } else {
    scheduled_type = "scheduled_task";
  }

  // if(new Date(scheduled_date) < new Date()){
  //   return res.status(400).json({ msg: "DATE_INVALID" });
  // }

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
    badge,
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
// Get All  Task
// Auth Required
router.get("/:id", authUser, (req, res) => {
  console.log("v1/tasks/ METHOD : GET");
  const userid = req.user;
  const projectid = req.params.id;
  User.findOne(
    { _id: userid, "projects._id": projectid },
    { "projects.$": 1 },
    function (err, result) {
      if (err) {
        res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
      }

      if (result) {
        const taskList = result.projects[0].tasks;
        taskList.sort(function (a, b) {
          var c = new Date(a.updatedAt);
          var d = new Date(b.updatedAt);
          return d - c;
        });
        return res.status(200).json([...taskList]);
      }
    }
  );
});

// v1/tasks/
// Get All  Task
// Auth Required Update

router.put("/update/:pid", authUser, function (req, res) {
  console.log("v1/tasks/ METHOD : UPDATE");
  const userid = req.user;
  var data = { ...req.body, updatedAt: new Date() };
  var isTaskCompleted = 0;

  if (data.task_status == "active" && data.startedAt == null) {
    data = { ...req.body, startedAt: new Date() };
  }

  if (data.task_status == "done") {
    isTaskCompleted = 1;

    if (data.startedAt == null) {
      data = { ...data, startedAt: new Date() };
    }
    data = { ...data, completedAt: new Date() };
  }

  const projectid = req.params.pid;
  User.updateOne(
    {
      _id: userid,
    },
    {
      $set: {
        "projects.$[pid].tasks.$[tid]": data,
      },
      $inc: {
        "projects.$[pid].total_completed_tasks": isTaskCompleted,
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
        return res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
      }

      if (result) {
        return res.status(200).json({ msg: "SUCESS" });
      }
    }
  );
});

// v1/tasks
// Get All  Task
// Auth Required

router.delete("/:pid/:id", authUser, (req, res) => {
  console.log("v1/tasks/" + req.params.id + " METHOD : DELETE");
  const userid = req.user;
  const taskid = req.params.id;
  const projectid = req.params.pid;

  User.updateOne(
    { _id: userid, "projects._id": projectid },
    {
      $inc: {
        "projects.$.total_tasks": -1,
      },
      $pull: { "projects.$.tasks": { _id: taskid } },
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

// v1/tasks/calander/all
//calender by all project
// Auth Required
router.get("/calender/all/", authUser, (req, res) => {
  console.log("v1/tasks/calender METHOD : All tasks");
  const userid = req.user;
  const pid = req.params.pid;
  User.findOne({ _id: userid }, function (err, result) {
    if (err) {
      res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
    }
    var arr1 = [];
    if (result) {
      for (let key in result.projects) {
        let project = result.projects[key];
        const theme_colour = project.theme_colour;
        project.tasks = project.tasks.filter(data => data.task_status!='done')
        project.tasks = project.tasks.map((data) => {
          return { ...data, theme_colour };
        });
        console.log(theme_colour);
        Array.prototype.push.apply(arr1, project.tasks);
      }
      return res.status(200).json(arr1);
    }
  });
});

// v1/tasks/calander/:id
//calender by project id
// Auth Required
router.get("/calender/:pid/", authUser, (req, res) => {
  console.log("v1/tasks/calender METHOD : tasks By Id");
  const userid = req.user;
  const pid = req.params.pid;
  User.findOne(
    { _id: userid, "projects._id": pid },
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
