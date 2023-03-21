var express = require("express");
const User = require("../models/User");
var router = express.Router();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
var requestIp = require("request-ip");
const authUser = require("../middleware/authUser");
const { ObjectId } = require("mongodb");


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
router.post("/", authUser, (req, res) => {
  console.log("v1/project METHOD : POST");
  const _id = ObjectId();
  const userid = req.user;
  var { project_title, project_deadline, theme_colour } = req.body;
  
  if (project_title == null || project_title == "") {
    return res.status(400).json({ msg: "PROJECT_TITLE_REQUIRED" });
  } else {
    const newproject = {
      project_title,
      _id,
      project_deadline,
      theme_colour,
      total_tasks: 0,
      total_completed_tasks: 0,
    };
    User.updateOne({ _id: userid }, { $push: { projects: newproject } })
      .then((result) => {
        res.status(200).json(newproject);
      })
      .catch((err) => {
        console.log(err);
        return res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
      });
  }
});

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
  if((project_deadline == null || project_deadline == "") || (theme_colour == null || theme_colour == "")){
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
        const project = user.projects.find((p) => p._id.toString() === projectId);
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
      console.log(result);
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
