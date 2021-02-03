
module.exports = app => {
    const user = require("../controllers/User.js");
    const validationMiddleware = require('../middleware/validation-middleware');
    var router = require("express").Router();
    router.get("/blog-list" , user.blogList);
    router.get("/user-detail" , user.userDetail);
    router.get("/my-routine-list" , user.savedRoutineList);
    router.get("/my-saved-video-list" , user.savedVideoList);
    router.get("/teacher-list" , user.teacherList);
    router.get("/admin-teacher-list" , user.adminTeacherList);
    router.get("/feed-list" , user.feedList);
    router.get("/routine-video-list" , user.routineVideoList);
    router.get("/admin-routine-video-list" , user.adminRoutineVideoList);
    router.get("/teacher-detail" , user.teacherDetail);
    router.post("/save-unsave-routine" , user.saveUnsaveRoutine);
    router.post("/save-unsave-video" , user.saveUnsaveVideo);
    router.get("/user-play-list" , user.getUserPlayList);
    router.get("/blog/:blog_id" , user.blogDetail);
    router.get("/get-hashtag" , user.Hashtag);
    router.post("/get-hashtag-details" , user.getHashtagDetails);
    
    app.use('/api/user', router);
  };
  