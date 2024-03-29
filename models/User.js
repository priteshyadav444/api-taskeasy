const moongoose = require("mongoose");
const Schema = moongoose.Schema;

const UserScheme = new Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    imgurl: { type: String, default: null },
    country: { type: String, default: null },
    phone_no: { type: String, default: null },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    register_date: { type: Date, default: Date.now() },
    projects: [
      {
        project_title: { type: String, required: true },
        theme_colour: { type: String, default: "#D2DAFF" },
        project_start: { type: Date, default: Date.now() },
        project_deadline: { type: Date, default: null },
        startedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        createdAt: { type: Date, default: Date.now() },
        updatedAt: { type: Date, default: Date.now() },

        tasks: [
          {
            title: { type: String, required: true },
            description: { type: String, default: null },
            task_status: { type: String, required: true, default: "pending" },
            badge: { type: String, default: "low" },
            theme_colour: { type: String, default: "#D2DAFF" },
            scheduled_date: { type: Date, default: null },
            createdAt: { type: Date, default: Date.now() },
            subtasklist: [
              {
                stitle: { type: String, required: true },
                checked: { type: Boolean, default: false },
              },
            ],
          },
        ],
        deleted_tasks: [
          {
            title: { type: String, required: true },
            description: { type: String, default: null },
            task_status: { type: String, required: true, default: "pending" },
            badge: { type: String, default: "low" },
            theme_colour: { type: String, default: "#D2DAFF" },
            scheduled_date: { type: Date, default: null },
            createdAt: { type: Date, default: Date.now() },
            subtasklist: [
              {
                stitle: { type: String, required: true },
                checked: { type: Boolean, default: false },
              },
            ],
            deletedAt: { type: Date, default: Date.now() },
          },
        ],
      },
    ],
    deleted_projects: [
      {
        project_title: { type: String, required: true },
        theme_colour: { type: String, default: "#D2DAFF" },
        project_start: { type: Date, default: Date.now() },
        project_deadline: { type: Date, default: null },
        startedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        createdAt: { type: Date, default: Date.now() },
        updatedAt: { type: Date, default: Date.now() },
        deletedAt: { type: Date, default: null },
        tasks: [
          {
            title: { type: String, required: true },
            description: { type: String, default: null },
            task_status: { type: String, required: true, default: "pending" },
            badge: { type: String, default: "low" },
            theme_colour: { type: String, default: "#D2DAFF" },
            scheduled_date: { type: Date, default: null },
            createdAt: { type: Date, default: Date.now() },
            subtasklist: [
              {
                stitle: { type: String, required: true },
                checked: { type: Boolean, default: false },
              },
            ],
          },
        ],
        deleted_tasks: [
          {
            title: { type: String, required: true },
            description: { type: String, default: null },
            task_status: { type: String, required: true, default: "pending" },
            badge: { type: String, default: "low" },
            theme_colour: { type: String, default: "#D2DAFF" },
            scheduled_date: { type: Date, default: null },
            createdAt: { type: Date, default: Date.now() },
            subtasklist: [
              {
                stitle: { type: String, required: true },
                checked: { type: Boolean, default: false },
              },
            ],
            deletedAt: { type: Date, default: Date.now() },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = moongoose.model("User", UserScheme);
module.exports = User;
