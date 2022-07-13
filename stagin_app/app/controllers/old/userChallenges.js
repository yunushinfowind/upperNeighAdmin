const db = require("../models");
const Sequelize = require('sequelize');
const config = require("../config/config.js");
const User = db.user;
const Userchallenge = db.user_challenges;
const Challengelikes = db.challenge_likes;
const Challengeshare = db.challenge_shares;
const Challengecomment = db.challenge_comments;
const Commentlikes = db.comment_like;
//const Commentoncomment = db.comment_on_comment;
const Practice = db.practice;
const Practicelikes = db.practice_likes;
const Practicecomment = db.practice_comments;
const Practiceshare = db.practice_share;
const PracticecommentonComment = db.practice_comment_on_comment;
const PracticelikeonComment = db.practice_comment_like;
const Quiz = db.quiz_questions;
const Quiz_Options = db.quiz_question_options;
console.log(Quiz_Options);
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
const ThumbnailGenerator = require('video-thumbnail-generator').default;
const ffprobe = require('@ffprobe-installer/ffprobe');
var logger = require('@setreflex/logger').logger();

let validateToekn = async (token) => {
    let userObj = await User.findOne({ where: { login_token: token } });
    if (userObj) {
        return true;
    }
    return false;
}

let getLoginUserId = async (token) => {
    let userObj = await User.findOne({ where: { login_token: token } });
    if (userObj) {
        return userObj.id;
    }
}

let getCommentCount = async (challengeId) => {
    return await Challengecomment.count({ where: { challenge_id: challengeId }, parent_id: 0 });
}

let getLikeCount = async (challengeId) => {
    return await Challengelikes.count({ where: { challenge_id: challengeId } });
}
let getIsLikeByUser = async (challengeId, userId) => {
    let count = await Challengelikes.count({ where: { challenge_id: challengeId, user_id: userId } });
    if (count > 0) {
        return true
    } else {
        return false;
    }

}

let getShareCount = async (challengeId) => {
    return await Challengeshare.count({ where: { challenge_id: challengeId } });
}
let getLikeOnCommentCount = async (commentId) => {
  
    return await Commentlikes.count({ where: { comment_id: commentId } });
    }
  

// let getCommentOnCommentCount = async (commentId) => {
//     let count =   await Commentoncomment.count({ where: { comment_id: commentId } });     
//     return count;
    
// }

let commentCount = async (commentId) => {
     return  await Challengecomment.count({ where: { parent_id: commentId } });     
 }
let getPracticeCommentCount = async (practiceId) => {
    return await Practicecomment.count({ where: { practice_id: practiceId, parent_id: 0 } });
}
let getPracticeLikeCount = async (practiceId) => {
    return await Practicelikes.count({ where: { practice_id: practiceId } });

}
let getIsLikeAtPractice = async (practiceId, userId) => {
    let count = await Practicelikes.count({ where: { practice_id: practiceId, user_id: userId } });
    if (count > 0) {
        return true
    } else {
        return false;
    }
}

let getPracticeShareCount = async (practiceId) => {
    return await Practiceshare.count({ where: { practice_id: practiceId } });
}
let getPracticeLikeOnCommentCount = async (practicecommentId) => {
    return await PracticelikeonComment.count({ where: { practice_comment_id: practicecommentId } });
}
let getPracticeCommentOnCommentCount = async (practicecommentId) => {
    return await Practicecomment.count({ where: { parent_id: practicecommentId } });
}



const TODAY_START = new Date().setHours(0, 0, 0, 0);
const NOW = new Date();
var day = NOW.getDay(),
    diff = NOW.getDate() - day + (day == 0 ? -6 : 1);
const MON = new Date(NOW.setDate(diff));
var firstDay = new Date(NOW.getFullYear(), NOW.getMonth(), 1);
var year = new Date(NOW.getFullYear(), 0, 1)


let getTotalPracticeDuration = async (userId, type) => {
    let practices = [];
    if (type == 'today') {
        practices = await Practice.findAll({
            where: {
                [Op.and]:
                    [{ user_id: userId },
                    {
                        created_at: {
                            [Op.gt]: TODAY_START,
                            [Op.lt]: new Date()
                        }
                    }]
            }
        })
    } else if (type == 'week') {
        practices = await Practice.findAll({
            where: {
                [Op.and]:
                    [{ user_id: userId },
                    {
                        created_at: {
                            [Op.gt]: MON,
                            [Op.lt]: new Date()
                        }
                    }]
            }
        })
    } else if (type == 'month') {
        practices = await Practice.findAll({
            where: {
                [Op.and]:
                    [{ user_id: userId },
                    {
                        created_at: {
                            [Op.gt]: firstDay,
                            [Op.lt]: new Date()
                        }
                    }]
            }
        })
    } else {
        practices = await Practice.findAll({
            where: {
                [Op.and]:
                [{ user_id: userId },
                {
                    created_at: {
                        [Op.gt]: year,
                        [Op.lt]: new Date()
                    }
                }]
            }
        })
    }

    if (practices) {
        var times = [0, 0, 0]
        var max = times.length;
        // store time values
        var hoursum = 0;
        var mintsum = 0;
        var secondsum = 0;
        for (var j = 0; j < practices.length; j++) {

            var durationArray = (practices[j].duration || '').split(':');
            hoursum = parseInt(hoursum) + parseInt(durationArray[0])
            mintsum = parseInt(mintsum) + parseInt(durationArray[1])
            secondsum = parseInt(secondsum) + parseInt(durationArray[2])

        }
        console.log(hoursum);
        console.log(mintsum);
        console.log(secondsum);
        var hours = hoursum
        var minutes = mintsum
        var seconds = secondsum

        if (seconds >= 60) {
            var m = (seconds / 60) << 0
            minutes += m
            seconds -= 60 * m
        }

        if (minutes >= 60) {
            var h = (minutes / 60) << 0
            hours += h
            minutes -= 60 * h
        }
        return ('0' + hours).slice(-2) + ' hrs :' + ('0' + minutes).slice(-2) + ' min :' + ('0' + seconds).slice(-2) + ' sec'
    }

}



let getPracticeSessionCount = async (userId, type) => {
    var session = 0;
    if (type == 'today') {
        session = await Practice.count({
            where: {
                [Op.and]:
                    [{ user_id: userId },
                    {
                        created_at: {
                            [Op.gt]: TODAY_START,
                            [Op.lt]: new Date()
                        }
                    }
                    ]
            }
        })

    } else if (type == 'week') {
        session = await Practice.count({
            where: {
                [Op.and]:
                    [{ user_id: userId },
                    {
                        created_at: {
                            [Op.gt]: MON,
                            [Op.lt]: new Date()
                        }
                    }
                    ]
            }
        })
    } else if (type == 'month') {
        session = await Practice.count({
            where: {
                [Op.and]:
                    [{ user_id: userId },
                    {
                        created_at: {
                            [Op.gt]: firstDay,
                            [Op.lt]: new Date()
                        }
                    }
                    ]
            }
        })
    } else {
        session = await Practice.count({
            where: {
                [Op.and]:
                [{ user_id: userId },
                {
                    created_at: {
                        [Op.gt]: year,
                        [Op.lt]: new Date()
                    }
                }
                ]
            }
        })
    }

    return session;
}



let getPracticeFocusAvg = async (userId, type) => {
    var focus = 0;
    if (type == 'today') {
        focus = await Practice.findAll({
            where: {
                [Op.and]:
                    [{ user_id: userId },
                    {
                        created_at: {
                            [Op.gt]: TODAY_START,
                            [Op.lt]: new Date()
                        }
                    }
                    ]
            },
            attributes: [[Sequelize.fn('round', Sequelize.fn('avg', Sequelize.col('focus'))), 'avg_focus']]
        })

    } else if (type == 'week') {
        focus = await Practice.findAll({
            where: {
                [Op.and]:
                    [{ user_id: userId },
                    {
                        created_at: {
                            [Op.gte]: MON,
                            [Op.lte]: new Date()
                        }
                    }
                    ]
            },
            attributes: [[Sequelize.fn('round', Sequelize.fn('avg', Sequelize.col('focus'))), 'avg_focus']]
        })

    } else if (type == 'month') {
        focus = await Practice.findAll({
            where: {
                [Op.and]:
                    [{ user_id: userId },
                    {
                        created_at: {
                            [Op.gte]: firstDay,
                            [Op.lte]: new Date()
                        }
                    }
                    ]
            },
            attributes: [[Sequelize.fn('round', Sequelize.fn('avg', Sequelize.col('focus'))), 'avg_focus']]
        })

    } else {
        focus = await Practice.findAll({
            where: {
                [Op.and]:
                [{ user_id: userId },
                {
                    created_at: {
                        [Op.gt]: year,
                        [Op.lt]: new Date()
                    }
                }
                ]
            },
            attributes: [[Sequelize.fn('round', Sequelize.fn('avg', Sequelize.col('focus'))), 'avg_focus']]
        })
    }
    return focus[0];
}



let getPracticeMoodAvg = async (userId, type) => {
    var mood = 0;
    if (type == 'today') {
        mood = await Practice.findAll({
            where: {
                [Op.and]:
                [{ user_id: userId },
                {
                    created_at: {
                        [Op.gt]: TODAY_START,
                        [Op.lt]: new Date()
                    }
                }
                ]
            },
            attributes: [[Sequelize.fn('round', Sequelize.fn('avg', Sequelize.col('mood'))), 'avg_mood']]
        })
    } else if (type == 'week') {
        focus = await Practice.findAndCountAll({
            where: {
                [Op.and]:
                [{ user_id: userId },
                {
                    created_at: {
                        [Op.gt]: MON,
                        [Op.lt]: new Date()
                    }
                }
                ]
            },
            attributes: [[Sequelize.fn('round', Sequelize.fn('avg', Sequelize.col('mood'))), 'avg_mood']]
        })
    } else if (type == 'month') {
        focus = await Practice.findAndCountAll({
            where: {
                [Op.and]:
                [{ user_id: userId },
                {
                    created_at: {
                        [Op.gt]: firstDay,
                        [Op.lt]: new Date()
                    }
                }
                ]
            },
            attributes: [[Sequelize.fn('round', Sequelize.fn('avg', Sequelize.col('mood'))), 'avg_mood']]
        })
    } else {
        focus = await Practice.findAll({
            where: {
                [Op.and]:
                [{ user_id: userId },
                {
                    created_at: {
                        [Op.gt]: year,
                        [Op.lt]: new Date()
                    }
                }
                ]
            },
            attributes: [[Sequelize.fn('round', Sequelize.fn('avg', Sequelize.col('focus'))), 'avg_mood']]
        })
    }
    return focus[0];

};




let getPracticeProductivityAvg = async (userId, type) => {
    var productivity = 0;
    if (type == 'today') {
        productivity = await Practice.findAll({
            where: {
                [Op.and]:
                [{ user_id: userId },
                {
                    created_at: {
                        [Op.gt]: TODAY_START,
                        [Op.lt]: new Date()
                    }
                }
                ]
            },
            attributes: [[Sequelize.fn('round', Sequelize.fn('avg', Sequelize.col('productivity'))), 'avg_productivity']]
        })

    } else if (type == 'week') {

        productivity = await Practice.findAll({
            where: {
                [Op.and]:
                [{ user_id: userId },
                {
                    created_at: {
                        [Op.gt]: MON,
                        [Op.lt]: new Date()
                    }
                }
                ]
            },
            attributes: [[Sequelize.fn('round', Sequelize.fn('avg', Sequelize.col('productivity'))), 'avg_productivity']]
        })
    } else if (type == 'month') {

        productivity = await Practice.findAll({
            where: {
                [Op.and]:
                [{ user_id: userId },
                {
                    created_at: {
                        [Op.gt]: firstDay,
                        [Op.lt]: new Date()
                    }
                }
                ]
            },
            attributes: [[Sequelize.fn('round', Sequelize.fn('avg', Sequelize.col('productivity'))), 'avg_productivity']]
        })
    } else {
        productivity = await Practice.findAll({
            where: {
                [Op.and]:
                [{ user_id: userId },
                {
                    created_at: {
                        [Op.gt]: year,
                        [Op.lt]: new Date()
                    }
                }]
            },
            attributes: [[Sequelize.fn('round', Sequelize.fn('avg', Sequelize.col('productivity'))), 'avg_productivity']]
        })
    }
    return productivity[0];
}



exports.uploadUserVideo = async (req, res) => {
    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {

            var videos = [];
            var uploadedVideos = req.files;

            var thumbs = [];
            if (uploadedVideos == null) {
                console.log(uploadedVideos);
            }

            videos = ((uploadedVideos != 'null') && !Array.isArray(uploadedVideos['videos'])) ? [uploadedVideos['videos']] : uploadedVideos['videos'];
            var length = videos.length;
            let loginId = await getLoginUserId(token);
            for (let i = 0; i < length; i++) {
                var video_thumb = '';
                let dir = 'uploads/users/videos';
                var NewName = Math.round(new Date() / 1000) + User.generateToken();
                var fileExt = videos[i].mimetype.split('/').pop();
                var fileName = NewName + '.' + fileExt;
                const path = dir + '/' + fileName

                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                videos[i].mv(path, (error) => {
                    if (error) {
                        res.end(JSON.stringify({ status: 'error', message: error }))
                    }
                });
                var video_link = fileName
                var videoPath = 'uploads/users/videos/' + video_link;
                let thumbdir = 'uploads/users/thumbs/';
                const Thumbpath = thumbdir + '/' + fileName
                if (!fs.existsSync(thumbdir)) {
                    fs.mkdirSync(thumbdir, { recursive: true });
                }
                const tg = new ThumbnailGenerator({
                    sourcePath: videoPath,
                    thumbnailPath: 'uploads/users/thumbs',
                    tmpDir: 'uploads/users/videos/thumbs'
                });

                tg.generateOneByPercentCb(50, async (err, result) => {
                    video_thumb = result;
                    let data = {
                        video_link: video_link,
                        user_id: loginId,
                        thumb: result,
                        vedio_name: fileName
                    }
                    await Userchallenge.create(data)

                }

                )
            }
            res.send({ success: true, message: "video uploaded successfully.", data: [] });
        } else {

            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });

        }


    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}




exports.challengesList = async (req, res) => {
    try {
        var All = [];
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {

            let loginId = await getLoginUserId(token);
            let limit = parseInt(req.query.limit);
            let offset = parseInt(0 + (req.query.page - 1) * limit);
            let totatCount = await Userchallenge.count({ where: { user_id: req.query.user_id } });

            var list = await Userchallenge.findAndCountAll({
                where:

                    { user_id: req.query.user_id },


                limit: limit,
                offset: offset,
                include: [
                    {
                        model: db.user
                    }
                ]
            });
            for (const row of list['rows']) {

                var obj = Object.assign({}, row.get());
                obj.is_like = await getIsLikeByUser(obj.id, loginId);
                obj.total_likes = await getLikeCount(obj.id);
                obj.total_comments = await getCommentCount(obj.id);
                obj.total_shares = await getShareCount(obj.id);
                 // obj.total_comment_likes = await getLikeOnCommentCount(obj.id);
                // obj.total_comments_on_comment = await getCommentOnCommentCount(obj.id);
                All.push(obj);
            }
            if (list) {
                list['rows'] = All;
                list['count'] = totatCount;
                list['currentPage'] = req.query.page;
                list['totalPages'] = Math.ceil(list['count'] / limit);
            }


            res.send({ success: true, message: "challenge video list", data: list });
        } else {

            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });

        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}




exports.detailVideo = async (req, res) => {
    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);

        if (isValidToekn) {
            let loginId = await getLoginUserId(token);

            let detail = await Userchallenge.findOne({
                where: {

                    id: req.query.id

                },
                include: [
                    {
                        model: db.user
                    }
                ]

            }
            );

            detail.like_count = await getLikeCount(detail.id);
            detail.is_like = await getIsLikeByUser(detail.id, loginId);
            detail.comment_count = await getCommentCount(detail.id);
            detail.share_video_count = await getShareCount(detail.id);
            // detail.total_comment_likes = await getLikeOnCommentCount(detail.id);
            // detail.total_comments_on_comment  = await getCommentOnCommentCount(detail.id);
            // await Promise.all(detail.challenge_comments.map(async (element) => {
            //     element.comment_like_count = await getLikeOnCommentCount( element.id)
            //     element.comment_on_comment_count = await getCommentOnCommentCount( element.id)

            //   }));
            res.send({ success: true, message: "Data found Successfully..", data: detail });

        } else {

            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });

        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}


exports.likeVideo = async (req, res) => {
    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);

        if (isValidToekn) {
            let loginId = await getLoginUserId(token);
            let data = {
                user_id: loginId,
                challenge_id: req.body.challenge_id
            }
            if (req.body.type == '1') {
                const likes = await Challengelikes.create(data);
                res.send({ success: true, message: "liked a video", data: [] });
            }
            if (req.body.type == '0') {
                const likes = await Challengelikes.destroy({
                    where: {
                        user_id: loginId,
                        challenge_id: req.body.challenge_id
                    }
                });
                res.send({ success: true, message: "Unliked a video", data: [] });
            }

        } else {

            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });

        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }

}


// exports.commentVideo = async (req, res) => {
//     try {

//         let token = await User.getToken(req);
//         let isValidToekn = await validateToekn(token);

//         if (isValidToekn) {
//             let loginId = await getLoginUserId(token);

//             let data = {
//                 user_id: loginId,
//                 challenge_id: req.body.challenge_id,
//                 comment: req.body.comment

//             }
//             var comment = await Challengecomment.create(data);


//             let details = await Challengecomment.findOne({
//                 where: { id: comment.id },

//                 include: [
//                     {
//                         model: db.user
//                     }]
//             })


//             res.send({ success: true, message: "commented on a video", data: details });

//         } else {

//             res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });

//         }

//     } catch (e) {
//         res.send({ success: false, message: e.message, data: [] });
//     }

// }
exports.challengesComment = async (req, res) => {
    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            let loginId = await getLoginUserId(token);
            let data = {
                user_id: loginId,
                challenge_id: req.body.challenge_id,
                comment: req.body.comment,
                parent_id : (req.body.comment_id)?req.body.comment_id:0

            }
            var comment = await Challengecomment.create(data);
            let details = await Challengecomment.findOne({
                where: { id: comment.id },
                include: [
                    {
                        model: db.user
                    }]
            })
            res.send({ success: true, message: "Commented successfully.", data: details });

        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });

        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }

}

// exports.commentVideolist = async (req, res) => {
//     try {
//         let token = await User.getToken(req);
//         let isValidToekn = await validateToekn(token);
//         var All = [];
//         if (isValidToekn) {
//             let limit = parseInt(req.query.limit);
//             let offset = parseInt(0 + (req.query.page - 1) * limit);
//             let totatCount = await Challengecomment.count({ where: { challenge_id: req.query.challenge_id } });

//             let list = await Challengecomment.findAndCountAll({
//                 where: {

//                     challenge_id: req.query.challenge_id

//                 },
//                 limit: limit,
//                 offset: offset,

//                 include: [
//                     {
//                         model: db.user
//                     },
//                 ]
//             });
//             for (const row of list['rows']) {

//                 var obj = Object.assign({}, row.get());
//                 obj.total_comment_likes = await getLikeOnCommentCount(obj.id,'main');
//                 obj.total_comments_on_comment = await getCommentOnCommentCount(obj.id,'main');
//                 All.push(obj);
//             }


//             if (list) {
//                 list['rows'] = All;
//                 list['count'] = totatCount;
//                 list['currentPage'] = req.query.page;
//                 list['totalPages'] = Math.ceil(list['count'] / limit);
//             }
//             res.send({ success: true, message: "Comment List", data: list });
//         } else {
//             res.send({ success: false, message: "Invalid token", data: [] });
//         }
//     } catch (e) {
//         res.send({ success: false, message: e.message, data: [] });
//     }
// }

exports.videoCommentList = async (req, res) => {
    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        var All = [];
        if (isValidToekn) {
            let limit = parseInt(req.query.limit);
            let offset = parseInt(0 + (req.query.page - 1) * limit);
            let totatCount = await Challengecomment.count({ where: { challenge_id: req.query.challenge_id,parent_id : 0 } });
            let list = await Challengecomment.findAndCountAll({
                where: {
                    challenge_id: req.query.challenge_id,
                    parent_id : 0
                },
                limit: limit,
                offset: offset,
                include: [
                    {
                        model: db.user
                    }
                ]
            });
            for (const row of list['rows']) {
                var obj = Object.assign({}, row.get());
                obj.total_comment_likes = await getLikeOnCommentCount(obj.id);
                obj.total_comments_on_comment = await commentCount(obj.id);
                All.push(obj);
            }
            if (list) {
                list['rows'] = All;
                list['count'] = totatCount;
                list['currentPage'] = req.query.page;
                list['totalPages'] = Math.ceil(list['count'] / limit);
            }
            res.send({ success: true, message: "Comment List", data: list });
        } else {
            res.send({ success: false, message: "Invalid token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.commentOfComment = async (req, res) => {
   
    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        var All = [];
        if (isValidToekn) {
            let limit = parseInt(req.query.limit);
            let offset = parseInt(0 + (req.query.page - 1) * limit);
            let totatCount = await Challengecomment.count({ where: { parent_id : req.query.comment_id } });
            let list = await Challengecomment.findAndCountAll({
                where: {
                    parent_id : req.query.comment_id
                },
                limit: limit,
                offset: offset,
                include: [
                    {
                        model: db.user
                    }
                ]
            });
            for (const row of list['rows']) {
                var obj = Object.assign({}, row.get());
                obj.total_comment_likes = await getLikeOnCommentCount(obj.id);
                obj.total_comments_on_comment = await commentCount(obj.id);
                All.push(obj);
            }
            if (list) {
                list['rows'] = All;
                list['count'] = totatCount;
                list['currentPage'] = req.query.page;
                list['totalPages'] = Math.ceil(list['count'] / limit);
            }
            res.send({ success: true, message: "Comment List", data: list });
          
        } else {
            res.send({ success: false, message: "Invalid token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}




// exports.commentDetails = async (req, res) => {
//     try {
//         let token = await User.getToken(req);
//         let isValidToekn = await validateToekn(token);
//         var All = [];
//         if (isValidToekn) {

//             let limit = parseInt(req.query.limit);
//             let offset = parseInt(0 + (req.query.page - 1) * limit);

          
        
//        if( req.query.type == 'main'){
//         whereCondition =  {
//                     comment_id : req.query.comment_id }
//                 }else{
//                     whereCondition =  { parent_id : req.query.comment_id
//                     }
//                 }         
            
//             let details = await Commentoncomment.findAndCountAll({
//                 where: whereCondition,
//                 limit: limit,
//                 offset: offset,

//                 include: [
//                     {
//                         model: db.user
//                     }
//                     // {
//                     //     model: db.comment_on_comment,
//                     //     include: [
//                     //         {
//                     //             model: db.user
//                     //         }
//                     //     ]
//                     // }
//                 ]
//             });
//             for (const row of details['rows']) {

//                 var obj = Object.assign({}, row.get());
//                 if(req.query.type == 'main'){
//                     obj.total_comment_likes = await getLikeOnCommentCount(obj.id,'inner');
//                     obj.total_comments_on_comment = await getCommentOnCommentCount(obj.id,'inner');
//                 }else{
//                     obj.total_comment_likes = await getLikeOnCommentCount(obj.id,'inner');
//                     obj.total_comments_on_comment = await getCommentOnCommentCount(obj.id,'inner');
//                 }
               
               
//                 All.push(obj);
//             }


//             if (details) {
//                 details['rows'] = All;
//                 details['count'] = details.count;
//                 details['currentPage'] = req.query.page;
//                 details['totalPages'] = Math.ceil(details['count'] / limit);
//             }
//             res.send({ success: true, message: "Comments Details", data: details });

//         } else {
//             res.send({ success: false, message: "Invalid token", data: [] });
//         }


//     } catch (e) {
//         res.send({ success: false, message: e.message, data: [] });
//     }
// }


exports.shareVideo = async (req, res) => {
    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);

        if (isValidToekn) {
            let loginId = await getLoginUserId(token);

            let data = {
                user_id: loginId,
                challenge_id: req.body.challenge_id

            }
            await Challengeshare.create(data);

            res.send({ success: true, message: "video shared", data: [] });

        } else {

            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });

        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }


}

exports.commentLike = async (req, res) => {

    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);

        if (isValidToekn) {
            let loginId = await getLoginUserId(token);

            const data = {
                user_id: loginId,
                comment_id: req.body.comment_id
            }
      
            if (req.body.type == '1') {
                const likes = await Commentlikes.create(data);
                res.send({ success: true, message: "liked a comment", data: [] });
            }
            if (req.body.type == '0') {
                const likes = await Commentlikes.destroy({
                    where: {
                        user_id: loginId,
                        comment_id: req.body.comment_id
                    }
                });
                res.send({ success: true, message: "Unliked a comment", data: [] });
            }

        } else {

            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });

        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }

}

// exports.commentOnComment = async (req, res) => {
//     try {

//         let token = await User.getToken(req);
//         let isValidToekn = await validateToekn(token);

//         if (isValidToekn) {
//             let loginId = await getLoginUserId(token);
//             if (req.body.type == 'main') {
//                 var data = {
//                     user_id: loginId,
//                     comment_id: req.body.comment_id,
//                     comment: req.body.comment
//                 }

//             }else{
//                 var data = {
//                     user_id: loginId,
//                     parent_id: req.body.comment_id,
//                     comment: req.body.comment
//                 }
//             }
//             let comment = await Commentoncomment.create(data);
//             let detail = await Commentoncomment.findOne({
//                 where: { id: comment.id },
//                 include: [
//                     { model: db.user }
//                 ]
//             });

//             res.send({ success: true, message: "commented on comment", data: detail });




//         } else {

//             res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });

//         }

//     } catch (e) {
//         res.send({ success: false, message: e.message, data: [] });
//     }

// }


//PRACTICE

exports.addPractice = async (req, res) => {
    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);

        if (isValidToekn) {
            let loginId = await getLoginUserId(token);

            let data = {
                user_id: loginId,
                practice_name: req.body.practice_name,
                focus: req.body.focus,
                duration: req.body.duration,
                mood: req.body.mood,
                productivity: req.body.productivity
            }
            var practice = await Practice.create(data);

            res.send({ success: true, message: "Practice Added", data: practice });

        } else {

            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });

        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}


exports.practiceList = async (req, res) => {
    try {
        let All = [];
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token)

        if (isValidToekn) {
            let loginId = await getLoginUserId(token);
            let limit = parseInt(req.query.limit);
            let offset = parseInt(0 + (req.query.page - 1) * limit);
            let totatCount = await Practice.count({ where: {  user_id: req.query.user_id } });
            let lists = await Practice.findAndCountAll({
                where: 
                { user_id: req.query.user_id },
                
                limit: limit,
                offset: offset,

                include: [
                    { model: db.user }
                ]

               
            });
            for (const row of lists['rows']) {
                var obj = Object.assign({}, row.get());
                obj.is_like = await getIsLikeAtPractice(obj.id, loginId);
                obj.like_practice_count = await getPracticeLikeCount(obj.id);
                obj.comment_practice_count = await getPracticeCommentCount(obj.id);
                obj.share_practice_count = await getPracticeShareCount(obj.id);
                
                All.push(obj);
            }
            if (lists) {
                lists['rows'] = All;
                lists['count'] = totatCount;
                lists['currentPage'] = req.query.page;
                lists['totalPages'] = Math.ceil(lists['count'] / limit);
            }
            res.send({ success: true, message: "List of Practice", data: lists });
        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid Token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }

}


exports.practiceDetails = async (req, res) => {
    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token)

        if (isValidToekn) {
            let loginId = await getLoginUserId(token);

            let details = await Practice.findOne({
                where: {
                    id: req.query.id
                
                },
                include: [
                    {
                        model: db.user
                    }
                ]
               
            });

            details.like_practice_count = await getPracticeLikeCount(details.id);
            details.is_like = await getIsLikeAtPractice(details.id, loginId);
            details.comment_practice_count = await getPracticeCommentCount(details.id);
            details.share_practice_count = await getPracticeShareCount(details.id);
        

            res.send({ success: true, message: "Details of Practice", data: details });

        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid Token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }

}

exports.practiceLike = async (req, res) => {
    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);

        if (isValidToekn) {
            let loginId = await getLoginUserId(token);
            let data = {
                user_id: loginId,
                practice_id: req.body.practice_id
            }
            if (req.body.type == '1') {
                const likes = await Practicelikes.create(data);
                res.send({ success: true, message: "Practice Liked", data: [] });
            }
            if (req.body.type == '0') {
                const likes = await Practicelikes.destroy({
                    where: {
                        user_id: loginId,
                        practice_id: req.body.practice_id
                    }
                });
                res.send({ success: true, message: "Practice Unliked", data: [] });
            }


        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid Token", data: [] })
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }

}

exports.practiceComment = async (req, res) => {
    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);

        if (isValidToekn) {
            let loginId = await getLoginUserId(token);
            let data = {
                user_id: loginId,
                practice_id: req.body.practice_id,
                comment: req.body.comment,
                parent_id : (req.body.comment_id)?req.body.comment_id:0
            }
            var comment = await Practicecomment.create(data);
            let details = await Practicecomment.findOne({
                where: { id: comment.id },
                include: [
                    {
                        model: db.user
                    }]
                })
            res.send({ success: true, message: "Commented on Practice ", data: details });

        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid Token", data: [] })
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }

}

exports.practiceCommentList = async (req, res) => {
    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        var All = [];
        if (isValidToekn) {
            let limit = parseInt(req.query.limit);
            let offset = parseInt(0 + (req.query.page - 1) * limit);
            let totalCount = await Practicecomment.count({ where: { practice_id: req.query.practice_id } });
            let list = await Practicecomment.findAndCountAll({
                where: {
                    [Op.and]: [
                        { practice_id: req.query.practice_id },
                        { parent_id : 0 }
                    ]
                },
                limit: limit,
                offset: offset,
                include: [
                    {
                        model: db.user
                    }
                ]
            });
            for (const row of list['rows']) {
                var obj = Object.assign({}, row.get());
                obj.comment_like_count = await getPracticeLikeOnCommentCount(obj.id);
                obj.comment_on_comment_count = await getPracticeCommentOnCommentCount(obj.id);
                All.push(obj);
            }

            if (list) {
                list['rows'] = All;
                list['count'] = totalCount;
                list['currentPage'] = req.query.page;
                list['totalPages'] = Math.ceil(list['count'] / limit);
            }
            res.send({ success: true, message: "Comments on Practice List ", data: list });

        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid Token", data: [] })
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
     }
}

exports.practiceShare = async (req, res) => {
    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);

        if (isValidToekn) {
            let loginId = await getLoginUserId(token);
            let data = {
                user_id: loginId,
                practice_id: req.body.practice_id
            }
            await Practiceshare.create(data);
            res.send({ success: true, message: "Practice Shared", data: [] });

        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid Token", data: [] })
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }

}

exports.practicecommentLike = async (req, res) => {
    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);

        if (isValidToekn) {
            let loginId = await getLoginUserId(token);
            let data = {
                user_id: loginId,
                practice_comment_id: req.body.practice_comment_id
            }
            if (req.body.type == '1') {
                const likes = await PracticelikeonComment.create(data);
                res.send({ success: true, message: "Liked your Comment", data: [] });
            }
            if (req.body.type == '0') {
                const likes = await PracticelikeonComment.destroy({
                    where: {
                        user_id: loginId,
                        practice_comment_id: req.body.practice_comment_id
                    }
                });
                res.send({ success: true, message: "Unliked your Comment", data: [] });
            }


        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid Token", data: [] })
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}


exports.practicecomment_Comment = async (req, res) => {
    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
         var All = [];
        if (isValidToekn) {
            let limit = parseInt(req.query.limit);
            let offset = parseInt(0 + (req.query.page - 1) * limit);
            totalcount = await Practicecomment.count({ where : {parent_id : req.query.comment_id}})
            let list = await Practicecomment.findAndCountAll({
                where : {
                    parent_id : req.query.comment_id
                },
                limit : limit,
                offset : offset,
                include : [
                    {
                        model: db.user
                    }
                ]
            });
            for (const row of list['rows']) {
                var obj = Object.assign({},row.get());
                obj.practice_comment_like_count = await getPracticeLikeOnCommentCount(obj.id)
                obj.practice_comment_on_comment_count = await getPracticeCommentOnCommentCount(obj.id)
                All.push(obj);
            }
            if (list) {
                list['rows'] = All;
                list['count'] = totalcount;
                list['currentPage'] = req.query.page;
                list['totalPages'] = Math.ceil(list['count'] /limit );
            }
            res.send({ success: true, message: "Comment List ", data: list });

        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid Token", data: [] })
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }

}



exports.practiceStats = async (req, res) => {

    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var response;
            let loginId = await getLoginUserId(token);

            if (req.query.type == 'today') {
                response = {
                    total_duration: await getTotalPracticeDuration(loginId, req.query.type),
                    session_count: await getPracticeSessionCount(loginId, req.query.type),
                    focus_avg: await getPracticeFocusAvg(loginId, req.query.type),
                    mood_avg: await getPracticeMoodAvg(loginId, req.query.type),
                    productivity_avg: await getPracticeProductivityAvg(loginId, req.query.type)

                }

            } else if (req.query.type == 'week') {
                response = {
                    total_duration: await getTotalPracticeDuration(loginId, req.query.type),
                    session_count: await getPracticeSessionCount(loginId, req.query.type),
                    focus_avg: await getPracticeFocusAvg(loginId, req.query.type),
                    mood_avg: await getPracticeMoodAvg(loginId, req.query.type),
                    productivity_avg: await getPracticeProductivityAvg(loginId, req.query.type)

                }
                console.log(response)
            } else if (req.query.type == 'month') {
                response = {
                    total_duration: await getTotalPracticeDuration(loginId, req.query.type),
                    session_count: await getPracticeSessionCount(loginId, req.query.type),
                    focus_avg: await getPracticeFocusAvg(loginId, req.query.type),
                    mood_avg: await getPracticeMoodAvg(loginId, req.query.type),
                    productivity_avg: await getPracticeProductivityAvg(loginId, req.query.type)

                }
            } else {
                response = {
                    total_duration: await getTotalPracticeDuration(loginId, req.query.type),
                    session_count: await getPracticeSessionCount(loginId, req.query.type),
                    focus_avg: await getPracticeFocusAvg(loginId, req.query.type),
                    mood_avg: await getPracticeMoodAvg(loginId, req.query.type),
                    productivity_avg: await getPracticeProductivityAvg(loginId, req.query.type)

                }


            }

            res.send({ success: true, message: "Statistics ", data: response });
        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid Token", data: [] })
        }


    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

// QUIZ

exports.quizList = async (req, res) => {

    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            let quiz = await Quiz.findAll({
                // where: {id : req.query.id},
                include: [
                    { model: db.quiz_question_options }
                ]
            })

            res.send({ success: true, message: "Quiz List", data: quiz });

        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid Token", data: [] })

        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }

}