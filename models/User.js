const moongoose = require("mongoose");
const Schema = moongoose.Schema;

const UserScheme = new Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    imgurl: { type: String, default: null },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    register_date: { type: Date, default: Date.now() },
    projects: [
      {
        project_title: { type: String, required: true },
        project_deadline: { type: Date, default: null },
        total_tasks: { type: Number, default: 0 },
        total_completed_tasks: { type: Number, default: 0 },
        tasks: [
          {
            title: { type: String, required: true },
            completed: { type: Boolean, default: false },
            description: { type: String, default: null },
            task_status: { type: String, required: true, default: "pending" },
            category: { type: String, default: "None" },
            badge: { type: String, default: "low" },
            scheduled_type: {
              type: String,
              required: true,
              default: "unscheduled_task",
            },
            scheduled_date: { type: Date, default: Date.now() },
            subtasklist: [
              {
                stitle: { type: String, required: true },
                checked: { type: Boolean, default: false },
              },
            ],
            createdAt: { type: Date, default: Date.now() },
            updatedAt: { type: Date, default: Date.now() },
          },
        ],
        createdAt: { type: Date, default: Date.now() },
        updatedAt: { type: Date, default: Date.now() },
      },
    ],

    tasks: [
      {
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
        description: { type: String, default: null },
        task_status: { type: String, required: true, default: "pending" },
        category: { type: String, default: "None" },
        badge: { type: String, default: "low" },
        scheduled_type: {
          type: String,
          required: true,
          default: "unscheduled_task",
        },
        scheduled_date: { type: Date, default: null },
        subtasklist: [
          {
            stitle: { type: String, required: true },
            checked: { type: Boolean, default: false },
          },
        ],
        createdAt: { type: Date, default: Date.now() },
        updatedAt: { type: Date, default: Date.now() },
      },
    ],
    completed_task: [
      {
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
        description: { type: String, default: null },
        task_status: { type: String, required: true, default: "pending" },
        category: { type: String, default: "None" },
        badge: { type: String, default: "low" },
        scheduled_type: {
          type: String,
          required: true,
          default: "unscheduled_task",
        },
      },
    ],
    starred: { type: Boolean, default: false },
    repeat: {
      status: { type: Boolean, default: false },
      type: { type: String, default: null },
      date: { type: Date, default: Date.now() },
    },
  },
  {
    timestamps: true,
  }
);

const User = moongoose.model("User", UserScheme);
module.exports = User;
