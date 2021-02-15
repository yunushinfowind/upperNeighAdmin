
module.exports = app => {
    const user = require("../controllers/User.js");
    const validationMiddleware = require('../middleware/validation-middleware');
    const checkSatatus = require('../middleware/check-account-status');
    var router = require("express").Router();
    router.get("/blog-list" , checkSatatus.checkAccountStatus , user.blogList);
    router.get("/user-detail" , checkSatatus.checkAccountStatus ,user.userDetail);
    router.get("/my-routine-list" , checkSatatus.checkAccountStatus ,user.savedRoutineList);
    router.get("/my-saved-video-list" , checkSatatus.checkAccountStatus ,user.savedVideoList);
    router.get("/teacher-list" , checkSatatus.checkAccountStatus ,user.teacherList);
    router.get("/admin-teacher-list" , user.adminTeacherList);
    router.get("/feed-list" , checkSatatus.checkAccountStatus ,user.feedList);
    router.get("/routine-video-list" , checkSatatus.checkAccountStatus , user.routineVideoList);
    router.get("/admin-routine-video-list" , user.adminRoutineVideoList);
    router.get("/teacher-detail" , checkSatatus.checkAccountStatus ,user.teacherDetail);
    router.post("/save-unsave-routine" , checkSatatus.checkAccountStatus , user.saveUnsaveRoutine);
    router.post("/save-unsave-video" , checkSatatus.checkAccountStatus , user.saveUnsaveVideo);
    router.get("/user-play-list" , checkSatatus.checkAccountStatus , user.getUserPlayList);
    router.get("/blog/:blog_id" ,checkSatatus.checkAccountStatus , user.blogDetail);
    router.get("/get-hashtag" , user.Hashtag);
    router.post("/get-hashtag-details"  , user.getHashtagDetails);
    router.get("/remove-article" , checkSatatus.checkAccountStatus , user.removeArticle);
    
    app.use('/api/user', router);
  };
  