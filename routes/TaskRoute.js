var express = require("express");
const User = require("../models/User");
var router = express.Router();
require("dotenv").config();
const { ObjectId } = require("bson");
const authUser = require("../middleware/authUser");
const { body, validationResult } = require("express-validator");
const moment = require("moment");
const {
  getErrorPayload,
  getSuccessPayload,
} = require("../shared/PayloadFormat");

const isSubtaskArray = (value) => {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every((subtask) => {
    return (
      typeof subtask === "object" &&
      subtask !== null &&
      typeof subtask.stitle === "string" &&
      typeof subtask.checked === "boolean"
    );
  });
};

const taskTitleValidation = [
  body("title")
    .notEmpty()
    .withMessage("Task Title Required")
    .bail()
    .customSanitizer((value) => value.trim())
    .isLength({ max: 50 })
    .withMessage("Task Title is too long max.50 allowed")
    .bail(),
];

const taskCreatedAtDateValidation = [
  body("createdAt")
    .if(body("createdAt").notEmpty())
    .custom((value, { req }) => {
      const startedAtDate = moment(value, moment.ISO_8601, true); // parse deadline using ISO 8601 format
      if (!startedAtDate.isValid()) {
        throw new Error("Invalid date format");
      }
      return true;
    }),
];

const taskScheduledDateValidation = [
  body("scheduled_date")
    .if(body("scheduled_date").notEmpty())
    .custom((value, { req }) => {
      const deadline = moment(value, moment.ISO_8601, true); // parse deadline using ISO 8601 format
      if (!deadline.isValid()) {
        throw new Error("invalid date format");
      }

      const deadlineWithoutOffset = moment.utc(
        deadline.format("YYYY-MM-DDTHH:mm:ss.SSS")
      ); // remove timezone offset
      if (
        req.body.createdAt == undefined ||
        req.body.createdAt == null ||
        req.body.createdAt == ""
      ) {
        req.body.createdAt = moment.utc();
      }

      let start = moment.utc(req.body.createdAt);

      if (deadlineWithoutOffset.isBefore(start)) {
        throw new Error("End Date must be greater than start date");
      }

      return true;
    }),
];

const taskThemeColourCodeValidation = [
  body("theme_colour")
    .if(body("theme_colour").notEmpty())
    .optional({ nullable: true })
    .isHexColor()
    .withMessage("Invalid theme colour"),
];

const taskBadgeColourValidation = [
  body("badge")
    .if(body("badge").notEmpty())
    .optional({ nullable: true })
    .isIn(["low", "medium", "high", "none"])
    .withMessage("Invalid badge value"),
];

const taskSubTaskListValidation = [
  body("subtasklist")
    .optional({ nullable: true })
    .custom(isSubtaskArray)
    .withMessage("Invalid Task Value"),
];

const taskDescriptionValidation = [body("description").optional()];

const createTaskValidation = [
  ...taskTitleValidation,
  ...taskCreatedAtDateValidation,
  ...taskScheduledDateValidation,
  ...taskThemeColourCodeValidation,
  ...taskBadgeColourValidation,
  ...taskSubTaskListValidation,
  ...taskDescriptionValidation,
];

// v1/tasks
// Create Task
// Auth Required
router.post("/:id", authUser, createTaskValidation, function (req, res) {
  console.log("v1/tasks/ METHOD : POST");
  const _id = ObjectId().toHexString();
  var {
    title,
    description,
    badge,
    scheduled_date,
    subtasklist,
    theme_colour,
    task_status,
    createdAt,
  } = req.body;

  const userid = req.user;
  const projectid = req.params.id;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // if createdAt (Task Start Date) is defined than set current date
  if (createdAt == undefined || createdAt == null || createdAt == "") {
    createdAt = moment.utc();
  }

  const updatedAt = moment.utc();

  let newTask = {
    title,
    description,
    scheduled_date,
    subtasklist,
    badge,
    task_status,
    theme_colour,
    updatedAt,
    createdAt,
    _id,
  };

  User.findOneAndUpdate(
    { _id: userid, "projects._id": projectid },
    {
      $push: {
        "projects.$.tasks": newTask,
      },
    },
    { new: true }
  )
    .then((result) => {
      return res.status(200).json(newTask);
    })
    .catch((err) => {
      return res
        .status(400)
        .json(
          getErrorPayload(
            "SERVER_ERROR",
            "Something went wrong on the server. Please try again later.",
            400,
            error
          )
        );
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
        return res
          .status(400)
          .json(
            getErrorPayload(
              "SERVER_ERROR",
              "Something went wrong on the server. Please try again later.",
              400,
              err
            )
          );
      }

      if (result) {
        const tasks = result.projects[0].tasks;
        result.projects[0].tasks = [];
        const projectDetails = result.projects[0];
        tasks.sort(function (a, b) {
          var c = new Date(a.updatedAt);
          var d = new Date(b.updatedAt);
          return d - c;
        });
        return res.status(200).json({ tasks, projectDetails });
      }
    }
  );
});

const taskUpdateValidation = [
  ...taskTitleValidation,
  ...taskCreatedAtDateValidation,
  ...taskScheduledDateValidation,
  ...taskThemeColourCodeValidation,
  ...taskBadgeColourValidation,
  ...taskSubTaskListValidation,
  ...taskDescriptionValidation,
];

// v1/tasks/
// Update Task
// Auth Required Update
router.put("/update/:pid", authUser, taskUpdateValidation, function (req, res) {
  console.log("v1/tasks/ METHOD : UPDATE");
  const userid = req.user;
  const updatedAt = moment.utc();

  var updatedTask = { ...req.body, updatedAt };

  // setting started at time details
  if (updatedTask.task_status == "active" && updatedTask.startedAt == null) {
    updatedTask = { ...req.body, startedAt: new Date() };
  }

  // if task is direclty moved to done than also setting started at
  if (updatedTask.task_status == "done") {
    if (updatedTask.startedAt == null) {
      updatedTask = { ...updatedTask, startedAt: new Date() };
    }
    updatedTask = { ...updatedTask, completedAt: new Date() };
  }

  const projectid = req.params.pid;
  User.updateOne(
    {
      _id: userid,
    },
    {
      $set: {
        "projects.$[pid].tasks.$[tid]": updatedTask,
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
            $eq: updatedTask._id,
          },
        },
      ],
    },
    function (err, result) {
      if (err)
        return res
          .status(400)
          .json(
            getErrorPayload(
              "SERVER_ERROR",
              "Something went wrong on the server. Please try again later.",
              400,
              err
            )
          );

      if (result) {
        return res
          .status(200)
          .json(
            getSuccessPayload(
              "TASK_DELETED_SUCCESS",
              "Task Deleted Successfully",
              200,
              updatedTask
            )
          );
      }
    }
  );
});

// v1/tasks
// Delete Tasks
// Auth Required
router.delete("/:pid/:id", authUser, (req, res) => {
  console.log("v1/tasks/" + req.params.id + " METHOD : DELETE");
  const userid = req.user;
  const taskid = req.params.id;
  const projectid = req.params.pid;
  // Finding the project containing the task to be deleted
  User.findOne(
    { _id: userid, "projects._id": projectid },
    function (err, user) {
      if (err) {
        return res
          .status(400)
          .json(
            getErrorPayload(
              "SERVER_ERROR",
              "Something went wrong on the server. Please try again later.",
              400,
              err
            )
          );
      }
      if (!user) {
        return res
          .status(404)
          .json(getErrorPayload("DATA_NOT_FOUND", "Project not found", 404));
      }

      // Find the task to be deleted within the project
      const project = user.projects.find((project) => project._id == projectid);
      const task = project.tasks.find((task) => task._id == taskid);

      if (!task) {
        return res
          .status(404)
          .json(
            getErrorPayload("TASK_NOT_FOUND", "Requested task not found", 404)
          );
      }
      // Remove the task from the project's task list
      else {
        User.updateOne(
          { _id: userid, "projects._id": projectid },
          {
            $pull: { "projects.$.tasks": { _id: taskid } },
            $push: { "projects.$.deleted_tasks": task },
          },
          function (err, result) {
            if (err) {
              return res
                .status(400)
                .json(
                  getErrorPayload(
                    "SERVER_ERROR",
                    "Something went wrong on the server. Please try again later.",
                    400,
                    err
                  )
                );
            } else {
              return res.status(200).json(
                getSuccessPayload(
                  "TASK_DELETED_SUCCESS",
                  "Task deleted successfully",
                  200,
                  {
                    _id: taskid,
                  }
                )
              );
            }
          }
        );
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
      return res
        .status(400)
        .json(
          getErrorPayload(
            "SERVER_ERROR",
            "Something went wrong on the server. Please try again later.",
            400,
            err
          )
        );
    }
    var arr1 = [];
    if (result) {
      for (let key in result.projects) {
        let project = result.projects[key];
        const theme_colour = project.theme_colour;
        project.tasks = project.tasks.filter(
          (data) =>
            data.task_status == "unscheduled" || data.task_status == "pending"
        );
        project.tasks = project.tasks.map((data) => {
          return { ...data, theme_colour };
        });
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
        return res
          .status(400)
          .json(
            getErrorPayload(
              "SERVER_ERROR",
              "Something went wrong on the server. Please try again later.",
              400,
              err
            )
          );
      }

      if (result) {
        let taskList = result.projects[0].tasks;
        const theme_colour = result.projects[0].theme_colour;
        taskList = taskList.filter(
          (data) =>
            data.task_status == "unscheduled" || data.task_status == "pending"
        );
        taskList = taskList.map((data) => {
          data.theme_colour = theme_colour;
          return data;
        });
        return res.status(200).json(taskList);
      }
    }
  );
});
