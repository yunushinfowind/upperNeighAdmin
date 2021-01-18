var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })
const validationMiddleware = require('../middleware/validation-middleware');

module.exports = app => {
  const auth = require("../controllers/auth.js");

  var router = require("express").Router();
	
  // Create a new Tutorial
  router.post("/register",validationMiddleware.signup,auth.register);
  router.post("/login", validationMiddleware.login,auth.login);
  router.post("/socil-login", validationMiddleware.socialLogin,auth.socialLogin);
  router.post("/update-profile",auth.updateProfile);
  router.post("/logout", validationMiddleware.logout ,auth.logout);
  router.post("/user-logout" ,auth.userLogOut);
  router.post("/reset-password" ,auth.forgotPassword);
  router.post("/check-otp" ,auth.checkOtp);
  router.post("/update-password" ,auth.updatePassword);
  router.post("/check-token" ,auth.checkToken);

  

  app.use('/api/auth', router);
};
