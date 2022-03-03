
module.exports = app => {
    const user = require("../controllers/User.js");
    const userChallenges = require('../controllers/userChallenges.js');
    const validationMiddleware = require('../middleware/validation-middleware');
    const checkSatatus = require('../middleware/check-account-status');
    const challengesvalidation = require('../middleware/challenges-validation-check');
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
    router.post("/update-playlist-icon" , checkSatatus.checkAccountStatus , user.updatePlayListIcon);
    router.get("/user-play-list" , checkSatatus.checkAccountStatus , user.getUserPlayList);
    router.get("/blog/:blog_id" ,checkSatatus.checkAccountStatus , user.blogDetail);
    router.get("/get-hashtag" , user.Hashtag);
    router.post("/get-hashtag-details"  , user.getHashtagDetails);
    router.get("/remove-article" , checkSatatus.checkAccountStatus , user.removeArticle);

    //USER CHALLENGES
    router.post("/userchallenge", challengesvalidation.video ,userChallenges.uploadUserVideo);
    router.get("/challenge-list",userChallenges.challengesList);
    router.get('/challenge-video-details',userChallenges.detailVideo);
    // like comment share
    router.post('/challenge-video-likes', challengesvalidation.like , userChallenges.likeVideo);
    // router.post('/challenge-video-comment',challengesvalidation.comment,userChallenges.commentVideo);
    router.post('/challenges-comment',challengesvalidation.comment,userChallenges.challengesComment);
    
    // router.get('/challenge-video-comment-list', userChallenges.commentVideolist);
    router.get('/challenges-comment-list', userChallenges.videoCommentList);
    router.get('/comment-of-comment', userChallenges.commentOfComment);
    

    // router.get('/challenge-video-comment-details',userChallenges.commentDetails);
    router.post('/challenge-video-share',challengesvalidation.like, userChallenges.shareVideo);
    router.post('/challenge-comment-like',challengesvalidation.reply , userChallenges.commentLike);
    // router.post('/challenge-comment-on-comment',challengesvalidation.commentoncomment, userChallenges.commentOnComment);

    //Practice
    router.post('/add-practice',userChallenges.addPractice);
    router.get('/practice-list',userChallenges.practiceList);
    router.get('/practice-details',userChallenges.practiceDetails);
    router.post('/practice-like',userChallenges.practiceLike);
    router.post('/practice-comment',userChallenges.practiceComment);
    router.get('/practice-comment-list', userChallenges.practiceCommentList);
    router.post('/practice-share',userChallenges.practiceShare);
    router.post('/practice-comment-like',userChallenges.practicecommentLike);
    router.post('/practice-comment-on-comment',userChallenges.practicecommentOnComment);
    router.get('/practice-stats',userChallenges.practiceStats);
    
   //Quiz
   router.get('/quiz', userChallenges.quizList);

    
    app.use('/api/user', router);
  };
  