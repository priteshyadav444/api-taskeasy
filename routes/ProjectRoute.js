var express = require("express");
const User = require("../models/User");
var router = express.Router();
require("dotenv").config();
const authUser = require("../middleware/authUser");
const { ObjectId } = require("mongodb");
const { body, param, validationResult } = require("express-validator");
const moment = require("moment");
const {
  getErrorPayload,
  getSuccessPayload,
} = require("../shared/PayloadFormat");

// v1/projects (get)
// Fetch All Project
// Private
router.get("/", authUser, (req, res) => {
  console.log("v1/projects/ METHOD : (GET)");
  const userid = req.user;

  User.findOne({ _id: userid }, function (error, result) {
    if (error) {
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
    }

    if (result) {
      const projectList = result.projects;
      return res.status(200).json([...projectList]);
    }
  });
});

const projectTitleValidation = [
  body("project_title")
    .notEmpty()
    .withMessage("Project titlt required")
    .bail()
    .customSanitizer((value) => value.trim())
    .isLength({ max: 50 })
    .withMessage("Project title is too long max 50 charecter allowed")
    .bail(),
];

const projectStartValidation = [
  body("project_start")
    .if(body("project_start").notEmpty())
    .custom((value, { req }) => {
      const deadline = moment(value, moment.ISO_8601, true); // parse deadline using ISO 8601 format
      if (!deadline.isValid()) {
        throw new Error("INVALID_DATE_FORMAT");
      }
      return true;
    }),
];

const projectDeadlineValidation = [
  body("project_deadline")
    .notEmpty()
    .withMessage("Project deadline date required")
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
        throw new Error("Deadline must be greater than start date");
      }

      return true;
    }),
];

const themeColourValidation = [
  body("theme_colour")
    .if(body("theme_colour").notEmpty())
    .optional({ nullable: true })
    .isHexColor()
    .withMessage("Invalid theme code"),
];

const projectCreateValidation = [
  ...projectTitleValidation,
  ...projectStartValidation,
  ...projectDeadlineValidation,
  ...themeColourValidation,
];
// v1/projects (POST)
// Create Project
// PRIVATE
router.post("/", authUser, projectCreateValidation, (req, res) => {
  console.log("v1/project METHOD : POST");
  const userid = req.user;

  var { project_title, project_deadline, theme_colour, project_start } =
    req.body;

  // returning error
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // if project_start is not pass than setting current time
  if (project_start == null || project_start == "") {
    project_start = new moment().utc();
  }

  // setting project_deadline is moment
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
    .catch((error) => {
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

// function check is project exist or not
const validateProjectExistence = (req, res, next) => {
  const userId = req.user;
  const projectId = req.params.projectId;

  User.findOne(
    {
      _id: userId,
      "projects._id": projectId,
    },
    (err, result) => {
      if (!result) {
        return res
          .status(404)
          .json(
            getErrorPayload("PROJECT_NOT_FOUND", "Project is not found", 404)
          );
      }
      next();
    }
  );
};

// Check is project is Valid or not
const validateProjectId = param("projectId")
  .isMongoId()
  .withMessage("Invalid project id")
  .bail();

// v1/projects/123h132g12 (id)
// Update Project
// Private
router.put(
  "/:projectId",
  authUser,
  validateProjectId,
  validateProjectExistence,
  projectCreateValidation,
  (req, res) => {
    console.log("v1/project METHOD : PUT");
    const userid = req.user;
    const projectId = req.params.projectId;
    var { project_title, project_deadline, theme_colour } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updatedAt = moment.utc();
    User.findOneAndUpdate(
      { _id: userid, "projects._id": projectId },
      {
        $set: {
          "projects.$.project_title": project_title,
          "projects.$.project_deadline": project_deadline,
          "projects.$.theme_colour": theme_colour,
          "projects.$.updatedAt": updatedAt,
        },
      },
      { new: true }
    )
      .then((user) => {
        const project = user.projects.find(
          (p) => p._id.toString() === projectId
        );
        if (!project) {
          return res
            .status(404)
            .json(
              getErrorPayload("PROJECT_NOT_FOUND", "Project is not found", 404)
            );
        }
        return res.status(200).json(project);
      })
      .catch((error) => {
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
  }
);

// v1/projects/123h132g12 (id)
// Delete Project
// Private
router.delete("/:projectId", authUser, validateProjectId, async (req, res) => {
  console.log("v1/project/:id METHOD : DELETE");
  const projectId = req.params.projectId;
  const userId = req.user;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(userId);
    const project = user.projects.id(projectId);

    if (!project) {
      return res
        .status(404)
        .json(getErrorPayload("PROJECT_NOT_FOUND", "Project not found", 404));
    }

    project.deletedAt = moment.utc();
    project.remove();

    user.deleted_projects.push(project);
    await user.save();

    return res
      .status(200)
      .json(
        getSuccessPayload(
          "PROJECT_DELETED",
          "Project deleted successfully",
          200
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        getErrorPayload(
          "SERVER_ERROR",
          "Something went wrong on the server. Please try again later. while deleting the project",
          500,
          error
        )
      );
  }
});

module.exports = router;
