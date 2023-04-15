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

// v1/tasks
// Create Task
// Auth Required
router.post(
  "/:id",
  authUser,
  [
    body("title")
      .notEmpty()
      .withMessage("TITLE_REQUIRED")
      .bail()
      .customSanitizer((value) => value.trim())
      .isLength({ max: 50 })
      .withMessage("TASK_TITLE_TOO_LONG")
      .bail()
      .notEmpty()
      .withMessage("TITLE_REQUIRED")
      .bail(),
    body("createdAt")
      .if(body("createdAt").notEmpty())
      .custom((value, { req }) => {
        const startedAtDate = moment(value, moment.ISO_8601, true); // parse deadline using ISO 8601 format
        if (!startedAtDate.isValid()) {
          throw new Error("INVALID_DATE_FORMAT");
        }
        return true;
      }),
    body("scheduled_date")
      .if(body("scheduled_date").notEmpty())
      .custom((value, { req }) => {
        const deadline = moment(value, moment.ISO_8601, true); // parse deadline using ISO 8601 format
        if (!deadline.isValid()) {
          throw new Error("INVALID_DATE_FORMAT");
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
          throw new Error("DEADLINE_MUST_BE_GREATER_THAN_START_DATE");
        }

        return true;
      }),
    body("theme_colour")
      .if(body("theme_colour").notEmpty())
      .optional({ nullable: true })
      .isHexColor()
      .withMessage("INVALID_THEME_COLOUR"),
    body("badge")
      .if(body("badge").notEmpty())
      .optional({ nullable: true })
      .isIn(["low", "medium", "high", "none"])
      .withMessage("INVALID_BADGE_VALUE"),
    body("subtasklist")
      .optional({ nullable: true })
      .custom(isSubtaskArray)
      .withMessage("INVALID_SUBTASK_LIST"),
    body("description").optional(),
  ],
  function (req, res) {
    console.log("v1/tasks/ METHOD : POST");
    const _id = ObjectId().toHexString();
    var {
      title,
      description,
      badge,
      scheduled_date,
      completed,
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
      completed,
      subtasklist,
      badge,
      task_status,
      theme_colour,
      updatedAt,
      createdAt,
      _id,
    };
    console.log(newTask)
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
          .json(getErrorPayload("SOMETHING_WENT_WRONG", 400, err));
      });
  }
);

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
          .json(getErrorPayload("SOMETHING_WENT_WRONG", 400, err));
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

// v1/tasks/
// Update Task
// Auth Required Update
router.put(
  "/update/:pid",
  authUser,
  [
    body("title")
      .notEmpty()
      .withMessage("TITLE_REQUIRED")
      .bail()
      .customSanitizer((value) => value.trim())
      .isLength({ max: 50 })
      .withMessage("TASK_TITLE_TOO_LONG")
      .bail()
      .notEmpty()
      .withMessage("TITLE_REQUIRED")
      .bail(),
    body("createdAt")
      .if(body("createdAt").notEmpty())
      .custom((value, { req }) => {
        const startedAtDate = moment(value, moment.ISO_8601, true); // parse deadline using ISO 8601 format
        if (!startedAtDate.isValid()) {
          throw new Error("INVALID_DATE_FORMAT");
        }
        return true;
      }),
    body("scheduled_date")
      .if(body("scheduled_date").notEmpty())
      .custom((value, { req }) => {
        const deadline = moment(value, moment.ISO_8601, true); // parse deadline using ISO 8601 format

        if (!deadline.isValid()) {
          throw new Error("INVALID_DATE_FORMAT");
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
          throw new Error("DEADLINE_MUST_BE_GREATER_THAN_START_DATE");
        }

        return true;
      }),
    body("theme_colour")
      .if(body("theme_colour").notEmpty())
      .optional({ nullable: true })
      .isHexColor()
      .withMessage("INVALID_THEME_COLOUR"),
    body("badge")
      .if(body("badge").notEmpty())
      .optional({ nullable: true })
      .isIn(["low", "medium", "high", "none"])
      .withMessage("INVALID_BADGE_VALUE"),
    body("subtasklist")
      .optional({ nullable: true })
      .custom(isSubtaskArray)
      .withMessage("INVALID_SUBTASK_LIST"),
    body("description").optional(),
  ],
  function (req, res) {
    console.log("v1/tasks/ METHOD : UPDATE");
    const userid = req.user;
    const updatedAt = moment.utc();

    var updatedTask = { ...req.body, updatedAt };

    if (updatedTask.task_status == "active" && updatedTask.startedAt == null) {
      updatedTask = { ...req.body, startedAt: new Date() };
    }

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
            .json(getErrorPayload("SOMETHING_WENT_WRONG", 400, err));

        if (result) {
          return res
            .status(200)
            .json(getSuccessPayload("TASK_DELETED_SUCCESS", 200, updatedTask));
        }
      }
    );
  }
);

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
          .json(getErrorPayload("SOMETHING_WENT_WRONG", 400, err));
      }
      if (!user) {
        return res
          .status(404)
          .json(getErrorPayload("DATA_NOT_FOUND", 404, err));
      }

      // Find the task to be deleted within the project
      const project = user.projects.find((project) => project._id == projectid);
      const task = project.tasks.find((task) => task._id == taskid);

      if (!task) {
        return res
          .status(404)
          .json(getErrorPayload("TASK_NOT_FOUND", 404, err));
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
                .json(getErrorPayload("SOMETHING_WENT_WRONG", 400, err));
            } else {
              return res
                .status(200)
                .json(
                  getSuccessPayload("TASK_DELETED_SUCCESS", 200, {
                    _id: taskid,
                  })
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
      const error = {
        errors: [
          {
            msg: "SOMETHING_WENT_WRONG",
            errorDetails: err,
          },
        ],
      };
      return res.status(400).json(error);
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
        const error = {
          errors: [
            {
              msg: "SOMETHING_WENT_WRONG",
              errorDetails: err,
            },
          ],
        };
        return res.status(400).json(error);
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
