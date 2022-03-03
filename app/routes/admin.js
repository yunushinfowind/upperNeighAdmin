
module.exports = app => {
  const admin = require("../controllers/Admin.js");
  const validationMiddleware = require('../middleware/validation-middleware');
  var router = require("express").Router();
  router.post("/change-password",  admin.changePassword);
  router.post("/update-status",  admin.updateStatus);
  router.post("/forgot-password",  admin.forgotPassword);
  router.get("/blog-list" , admin.blogList);
  router.get("/common-list" , admin.commonList);
  router.post("/update-order-list" , admin.updateOfList);
  
  router.post("/add-blog", admin.addBlog);
  router.post("/edit-blog", admin.editBlog);
  router.get("/blog/:id", admin.blogDetail);
  router.delete("/delete-blog/:id", admin.blogDelete);
  router.get("/routine-list", admin.routineList);
  router.get("/artist-list", admin.artistList);
  router.get("/user-list", admin.userList);
  router.post("/add-routine", admin.addRoutine);
  router.post("/edit-routine", admin.editRoutine);
  router.get("/routine/:id", admin.routineDetail);
  router.delete("/delete-routine/:id", admin.routineDelete);
  /*artist routing*/
  router.post("/add-teacher", admin.addTeacher);
  router.delete("/delete-teacher/:id", admin.teacherDelete);
  router.get("/teacher/:id", admin.teacherInfo);
  router.post("/edit-teacher", admin.editTeacher);
  /*routine video routing*/
  router.post("/add-routine-video", admin.addRoutineVideo);
  router.post("/edit-routine-video" , admin.editRoutineVideo);
  router.get("/routine-video/:id" , admin.routineVideoDetail);
  router.delete("/delete-routine-video/:id" , admin.routineVideoDelete);

   /*series video routing*/
   router.get("/series-list", admin.seriesList);
   router.post("/add-series", admin.addSeries);
   router.post("/edit-series", admin.editSeries);
   router.get("/series/:id", admin.seriesDetail);
   router.delete("/delete-series/:id", admin.seriesDelete);

  router.post("/add-series-video", admin.addSeriesVideo);
  router.post("/edit-series-video" , admin.editSeriesVideo);
  router.get("/series-video/:id" , admin.seriesVideoDetail);
  router.delete("/delete-series-video/:id" , admin.seriesVideoDelete);

  /*artist video routing*/
  router.post("/add-artist-video", admin.addArtistVideo);
  router.get("/artist-video-list", admin.artistVideoList);
  router.post("/edit-artist-video" , admin.editArtistVideo);
  router.get("/artist-video/:id" , admin.artistVideoDetail);
  router.delete("/delete-artist-video/:id" , admin.videoArtistDelete);
  router.post("/create-artist-video-slice-recording", admin.createArtistVideoSliceRecordong);
  router.post("/create-artist-video-notation", admin.addArtistVideoSliceNotation);
  
   /*artist video routing*/
  router.delete("/delete-slice-folder/:folder_id", admin.deleteSliceFolder);
  router.delete("/delete-slice/:slug", admin.deleteSlice);
  router.get("/get-slice-notation/:slug", admin.getSliceNotation);
  router.post("/create-slice-recording", admin.createVideoSliceRecordong);
  router.post("/create-notation", admin.addSliceNotation);

  router.get("/get-settings" , admin.getSettings);
  router.get("/dashboard-count" , admin.dashboardCount);
  router.post("/update-settings", admin.updateSettings);
  router.get("/get-emojis" , admin.getEmojis);
  router.post("/update-admin-profile" , admin.updateAdminProfile);
  router.post("/check-admin-password" , admin.checkAdminCurrentPass);

  
  // hashtag route
  router.post("/add-hashtag", admin.addHashtag);
  router.post("/edit-hashtag", admin.updateHashtag);
  router.get("/hashtag/:id", admin.hashtagDetail);
  router.delete("/delete-hashtag/:id", admin.hashtagDelete);
  router.get("/hashtag-list", admin.hashtagList);


  
   //series
   router.post("/add-series", admin.addSeries);

   //quiz 
   router.post("/addquiz", admin.addQuiz);
   router.get("/quizlist", admin.quizList);

  app.use('/api/admin', router);
};
