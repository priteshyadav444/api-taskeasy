var express = require("express");
const User = require("../models/User");
var router = express.Router();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
var requestIp = require("request-ip");
const authUser = require("../middleware/authUser");
const { ObjectId } = require("mongodb");
// const { body, validationResult } = require("express-validator");
const moment = require("moment");

// v1/projects (get)
// Fetch All Project
// Private

router.get("/", authUser, (req, res) => {
  console.log("v1/projects/ METHOD : (GET)");
  const userid = req.user;

  User.findOne({ _id: userid }, function (err, result) {
    if (err) {
      res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
    }

    if (result) {
      const projectList = result.projects;
      return res.status(200).json([...projectList]);
    }
  });
});

// v1/projects (POST)
// Create Project
// PRIVATE
const { body, validationResult } = require("express-validator");

router.post(
  "/",
  authUser,
  [
    body("project_title")
      .customSanitizer((value) => value.trim())
      .isLength({ max: 50 })
      .withMessage("PROJECT_TITLE_TOO_LONG")
      .bail()
      .notEmpty()
      .withMessage("PROJECT_TITLE_REQUIRED")
      .bail(),
    body("project_start")
      .if(body("project_start").notEmpty())
      .custom((value, { req }) => {
        const deadline = moment(value, moment.ISO_8601, true); // parse deadline using ISO 8601 format
        if (!deadline.isValid()) {
          throw new Error("INVALID_DATE_FORMAT");
        }
        return true;
      }),
    body("project_deadline")
      .notEmpty()
      .withMessage("PROJECT_DEADLINE_REQUIRED")
      .bail()
      .custom((value, { req }) => {
        const deadline = moment(value, moment.ISO_8601, true); // parse deadline using ISO 8601 format
        if (!deadline.isValid()) {
          throw new Error("INVALID_DATE_FORMAT");
        }

        const deadlineWithoutOffset = moment.utc(
          deadline.format("YYYY-MM-DDTHH:mm:ss.SSS")
        ); // remove timezone offset
        const start = moment(req.body.project_start);

        if (deadlineWithoutOffset.isBefore(start)) {
          throw new Error("DEADLINE_MUST_BE_GREATER_THAN_START_DATE");
        }

        return true;
      }),
    body("theme_colour")
      .if(body("project_start").notEmpty())
      .optional({ nullable: true })
      .isHexColor()
      .withMessage("INVALID_THEME_COLOUR"),
  ],
  (req, res) => {
    console.log("v1/project METHOD : POST");
    const userid = req.user;
    var { project_title, project_deadline, theme_colour, project_start } =
      req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (project_start == null || project_start == "") {
      project_start = new moment().utc();
    }

    // dates configuration
    project_deadline = moment(project_deadline);
    project_deadline.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

    createdAt = moment.utc();
    updatedAt = moment.utc();

    // paylaod
    const _id = ObjectId();
    const newproject = {
      _id,
      project_title,
      theme_colour,
      total_tasks: 0,
      total_completed_tasks: 0,
      project_deadline,
      project_start,
    };
    User.updateOne(
      { _id: userid },
      { $push: { projects: { ...newproject, createdAt, updatedAt } } }
    )
      .then((result) => {
        res.status(200).json(newproject);
      })
      .catch((err) => {
        console.log(err);
        return res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
      });
  }
);

// v1/projects/123h132g12 (id)
// Update Project
// Private

router.put("/:projectId", authUser, (req, res) => {
  console.log("v1/project METHOD : PUT");
  const userid = req.user;
  const projectId = req.params.projectId;
  var { project_title, project_deadline, theme_colour } = req.body;

  if (!projectId) {
    return res.status(404).json({ msg: "PROJECT_NOT_FOUND" });
  }
  if (
    project_deadline == null ||
    project_deadline == "" ||
    theme_colour == null ||
    theme_colour == ""
  ) {
    return res.status(400).json({ msg: "ALL_FIELD_REQUIRED" });
  }
  if (project_title == null || project_title == "") {
    return res.status(400).json({ msg: "PROJECT_TITLE_REQUIRED" });
  } else {
    User.findOneAndUpdate(
      { _id: userid, "projects._id": projectId },
      {
        $set: {
          "projects.$.project_title": project_title,
          "projects.$.project_deadline": project_deadline,
          "projects.$.theme_colour": theme_colour,
        },
      },
      { new: true }
    )
      .then((user) => {
        const project = user.projects.find(
          (p) => p._id.toString() === projectId
        );
        if (!project) {
          return res.status(404).json({ msg: "PROJECT_NOT_FOUND" });
        }
        res.status(200).json(project);
      })
      .catch((err) => {
        return res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
      });
  }
});

// v1/projects/123h132g12 (id)
// Delete Project
// Private
router.delete("/:pid", authUser, (req, res) => {
  console.log("v1/project/:id METHOD : DELETE");
  const projetid = req.params.pid;
  if (!projetid) {
    return res.status(404).json({ msg: "PROJECT_NOT_FOUND" });
  }
  const userid = req.user;
  User.updateOne(
    { _id: userid },
    {
      $pull: { projects: { _id: projetid } },
    },
    function (err, result) {
      if (err) {
        return res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
      } else {
        return res
          .status(200)
          .json({ status: 200, msg: "PROJECT_DELETED_SUCCESSFULLY" });
      }
    }
  );
});

module.exports = router;
