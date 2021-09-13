const db = require("../models");
//console.log('db',db)
const Sequelize = require('sequelize');
const config = require("../config/config.js");
const Userchallenge = db.user_chalenges;
//console.log('user',Userchallenge);
const User= db.user;
var logger = require('@setreflex/logger').logger();
const request = require('request');
var https = require('follow-redirects').https;
var qs = require('querystring');
const axios = require('axios');
var fs = require('fs');
const path = require('path');
const { get } = require("request");
const user = require("../routes/user");
const Op = db.Sequelize.Op;


exports.uploadUserVideo = async (req, res) => {
    try {
         var videos = [];
         var uploadedVideos = req.files;
         var thumbs = [];
            if (uploadedVideos == null) {
                console.log(uploadedVideos);
            }

        videos = ((uploadedVideos != 'null') && !Array.isArray(uploadedVideos['videos'])) ? [uploadedVideos['videos']] : uploadedVideos['videos'];
        var length = videos.length;
        // var length = videos.length;
        //console.log("lenght",length)
        for (let i = 0; i < length; i++) {
             var video_thumb = '';
             let dir = 'uploads/users/thumbs';
             //let str = 'abc5defkfghd1ijk323lmnod65fpqr6dst67uvw56dskf84xyz';
             let str = parseInt(Math.random());
             var NewName = str + i;
             var fileExt = videos[i].mimetype.split('/').pop();
             var thumbfileName = NewName + '.' + fileExt;
             const path = dir + '/' + thumbfileName
            
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            videos[i].mv(path, (error) => {
                if (error) {
                     res.end(JSON.stringify({ status: 'error', message: error }))
                 }
             })
            let token = await User.getToken(req);
            
            let loginId = await getLoginUserId(token);
               let  data = {
                    user_id : loginId,
                    thumb : thumbfileName,
                    vedio_name : thumbfileName
                   }
                   console.log('model', Userchallenge)
                 console.log('data',data)
                 await  Userchallenge.create(data)
               }
                res.send({ success: true, message: "", data: [] });
            }
        catch(err){
            if(err) return res.status(400).send(err);
        }
}

let getLoginUserId = async (token) => {
	let userObj = await User.findOne({ where: { login_token: token } });
	if (userObj) {
		return userObj.id;
	}
}


exports.challengesList = async(req,res) => {
    let token = await User.getToken(req);
    let loginId = await getLoginUserId(token);
    let limit =  parseInt(req.query.limit);
    let offset = parseInt(0+(req.query.page - 1) * limit);
   var list = await Userchallenge.findAndCountAll({
       where: {user_id:loginId},
   
      limit: limit,
     offset: offset
   }
   )
 
  
   res.json(list);
}


exports.detailVedio = async(res,req) =>{
    let details = await Userchallenge.find({
        where:
      {  [Op.and]: 
           [{user_id:loginId},
            {id:req.query.id}] }
    })
}

