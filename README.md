
# API Taskeasy

All the API with on success Response Format and  Error Message.

1)Create Task
https://api-taskeasy.herokuapp.com/v1/users/tasks/ (Post)

Errors:

    TITLE_REQUIRED


2)Get Task Array
https://api-taskeasy.herokuapp.com/v1/users/tasks/ (GET)

Errors:
SOMETHING_WENT_WRONG

Success:

    [
    {
    "title": "Pritesh Yadav",
    "completed": false,
    "desciption": null,
    "task_status": "pending",
    "category": "",
    "badge": "low",
    "scheduled_type": "unscheduled_task",
    "scheduled_date": null,
    "subtasklist": [
    {
    "stitle": "Firsyt",
    "checked": false,
    "_id": "625bce1b516c54fd44de97aa"
    },
    {
    "stitle": "Firsyt12",
    "checked": false,
    "_id": "625bce1b516c54fd44de97ab"
    }
    ],
    "createdAt": "2022-04-17T08:21:41.847Z",
    "updatedAt": "2022-04-17T08:21:41.847Z",
    "_id": "625bce1b516c54fd44de97a9"
    },
    {
    "title": "Pritesh Yadav",
    "completed": false,
    "desciption": null,
    "task_status": "pending",
    "category": "",
    "badge": "low",
    "scheduled_type": "unscheduled_task",
    "scheduled_date": null,
    "subtasklist": [
    {
    "stitle": "Firsyt",
    "checked": false,
    "_id": "625bd354dbc75cc85240a289"
    },
    ],
    "createdAt": "2022-04-17T08:22:31.030Z",
    "updatedAt": "2022-04-17T08:22:31.030Z",
    "_id": "625bd354dbc75cc85240a288"
    },
    ]



3)Get Task Details By Id
https://api-taskeasy.herokuapp.com/v1/users/tasks/625bcdfc932003d586fcac8f (GET)

Error:

    SOMETHING_WENT_WRONG
    TASK_NOT_FOUND

Success:

    {
    "task": {
    "description": null,
    "title": "Pritesh Yadav",
    "completed": false,
    "desciption": null,
    "task_status": "pending",
    "category": "",
    "badge": "low",
    "scheduled_type": "unscheduled_task",
    "scheduled_date": null,
    "subtasklist": [
    {
    "stitle": "Firsyt",
    "checked": false,
    "_id": "625bce1b516c54fd44de97aa"
    },
    {
    "stitle": "Firsyt12",
    "checked": false,
    "_id": "625bce1b516c54fd44de97ab"
    }
    ],
    "createdAt": "2022-04-17T08:21:41.847Z",
    "updatedAt": "2022-04-17T08:21:41.847Z",
    "_id": "625bce1b516c54fd44de97a9"
    }
    }



4)Get Completed Task Details By Id
https://api-taskeasy.herokuapp.com/v1/users/load <GET>


Error:

    AUTH_DENAID
    INVALID_TOKEN

Success:

    "authToken":
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MjU5ZjAwMWY5M2FjMTgwYzkyZGIyMGQiLCJpYXQiOjE2NTAwNjEzMTQsImV4c
    CI6MTY1MTUxNjg2OX0.RvtHajnG4qT8g7D_szLF9o3Df9SdmBUIrOF9dKz6ijY",
    "user": {
    "_id": "6259f001f93ac180c92db20d",
    "firstname": "Pritesh",
    "lastname": "Yadav",
    "email": "yadav3@mail.com"
    }
    }



5)Create User Account
https://api-taskeasy.herokuapp.com/v1/users/signup <POST>

Error :

    ALL_FIELD_REQUIRED
    USER_EXISTS
    SOMETHING_WENT_WRONG
    SIGNUP_FAILED

Success:

    "authToken":
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MjU5ZjAwMWY5M2FjMTgwYzkyZGIyMGQiLCJpYXQiOjE2NTAwNjEzMTQsImV4c
    CI6MTY1MTUxNjg2OX0.RvtHajnG4qT8g7D_szLF9o3Df9SdmBUIrOF9dKz6ijY",
    "user": {
    "_id": "6259f001f93ac180c92db20d",
    "firstname": "Pritesh",
    "lastname": "Yadav",
    "email": "yadav3@mail.com"
    }
    }



6)Login Users
https://api-taskeasy.herokuapp.com/v1/users/signin <POST>

errors:

    ALL_FIELD_REQUIRED
    USER_NOT_EXISTS
    WRONG_PASSWORD
    SOMETHING_WENT_WRONG

Success:

    {
    "authToken":
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MjViM2E4MzExZjVkMjc5M2ZmNDZhMmEiLCJpYXQiOjE2NTAxNDY2MzMsImV4c
    CI6MTY1MTI0NjY0NH0.aUsjtJZ_VeQM-WeyjBQ4zy1rSiT7c7nMF2QXIIdAVKM",
    "user": {
    "_id": "625b3a8311f5d2793ff46a2a",
    "firstname": "Pritesh",
    "lastname": "Yadav",
    "email": "yadav2@mail.com"
    }
    }
