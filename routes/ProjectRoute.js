// v1/project
// Create Project
// Public
router.post("/project", authUser, (req, res) => {
    console.log("v1/users/project METHOD : POST");
    const _id = ObjectId();
    const userid = req.user;
    var { project_title,project_deadline } = req.body;
    console.log(project_title);
    console.log(userid)
    if(project_title==null || project_title ==""){
      return res.status(400).json({ msg: "PROJECT_TITLE_REQUIRED" });
    }
    else{
      const newproject = { project_title , _id , project_deadline, "total_tasks":0, "total_completed_tasks":0 };
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
  
  
  // v1/project
  // Fetch All Project
  // Private 
  router.get("/project", authUser, (req, res) => {
    console.log("v1/users/ METHOD : Project");
    const userid = req.user;
    const projectid = "634c77fe9b0bdb5860e4e801";
  
    User.findOne(
      { _id: userid },
      function (err, result) {
        if (err) {
          res.status(400).json({ msg: "SOMETHING_WENT_WRONG" });
        }
  
        if (result) {
          const projectList = result.projects;
          return res.status(200).json([...projectList]);
        }
      }
    );
  });
  
  
  
  module.exports = router;
  