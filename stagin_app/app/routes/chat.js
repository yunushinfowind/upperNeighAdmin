
module.exports = app => {
  const chat = require("../controllers/chat.js");
  const validationMiddleware = require('../middleware/validation-middleware');
  var router = require("express").Router();
 
  router.post("/create-room" , validationMiddleware.createRoom,chat.createRoom);
  router.post("/send-message", validationMiddleware.sendMessage,chat.sendMessage);
  router.get("/delete-message",chat.deleteMessage);
  router.get("/delete-chat",chat.deleteChat);
  router.get("/read-message",chat.readMessage);
  router.get("/user-message",validationMiddleware.userMessage,chat.userMessage);
  router.get("/connected-user-list",validationMiddleware.userIdValidation,chat.connectedUserList);
  router.get("/user-list", validationMiddleware.userIdValidation,chat.userList);
  router.get("/all-user-list", validationMiddleware.userIdValidation,chat.allUserList);
  router.get("/room-array", validationMiddleware.userIdValidation,chat.myRoomId);
  router.get("/my-rooms",validationMiddleware.userIdValidation, chat.myRooms);
  router.get("/user-detail", chat.userDetail);
  router.post("/join-group", validationMiddleware.joinGroup,chat.joinGroup);
  router.post("/remove-from-group", chat.removeFromGroup);
  router.get("/group-users", chat.groupUsers);
  
  app.use('/api/chat', router);
};
