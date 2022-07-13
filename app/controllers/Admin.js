const db = require("../models");
const UserRoom = db.user_room;
const Room = db.room;
const Message = db.message;
const User = db.user;
const UserProfile = db.teacherProfile;
const Blog = db.blog;
const Hashtag = db.hashtag;
const UserSavedRoutine = db.userSaveRoutine;
const RoutineVideo = db.routineVideo;
const SeriesVideo = db.seriesVideo;
const TeacherVideo = db.teacherVideo;
const Routine = db.routine;
const TeacherPrfile = db.teacherProfile;
const UserEmoji = db.userEmoji;
const EmojiImage = db.emojiImage;
const RoutineFolder = db.routineFolder;
const VideoSliceModel = db.videoSlice;
const Series = db.series;
const SeriesVideos = db.seriesVideo;
const SeriesFolder = db.seriesFolder;
const Quiz = db.quiz_quests;
const Quiz_Options = db.quiz_question_options;
const Setting = db.setting;
const Op = db.Sequelize.Op;
const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const config = require("../config/config.js");
const user = require("../routes/user");
var fs = require('fs');
var mkdirp = require('mkdirp');
const { where, JSONB, json } = require("sequelize");
const ThumbnailGenerator = require('video-thumbnail-generator').default;
const { getVideoDurationInSeconds } = require('get-video-duration')
const request = require('request');
var https = require('follow-redirects').https;
var qs = require('querystring');
const aws4 = require('aws4');
var nodemailer = require('nodemailer');
const ffprobe = require('@ffprobe-installer/ffprobe');
const { create } = require("domain");
const e = require("express");
var logger = require('@setreflex/logger').logger();


exports.changePassword = async function (req, res, next) {
    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var loginId = await getLoginUserId(token);
            let user = await User.findOne({ where: { id: loginId } });
            if (user) {
                await bcrypt.compare(req.body.current_password, user.password, function (err, isMatch) {
                    if (err) {
                        console.log('innnnn')
                        res.status(500).send({
                            'success': false, message: err.message
                        });
                    }

                    console.log(isMatch);
                    if (!isMatch) {
                        res.send({ 'success': false, message: "Current password doesn't match." });
                    } else {
                        if (req.body.new_password != req.body.confirm_password) {
                            return res.send({ 'success': false, message: "New password  and confirm password doesn't match." });
                        }
                        var salt = 10;
                        var updateData = {};
                        bcrypt.hash(req.body.new_password, salt, (err, passwordHash) => {
                            updateData = {
                                password: passwordHash,
                            };
                            User.update(updateData, { where: { id: loginId } });
                        })
                        res.send({ 'success': true, message: 'Paswword changed successfully', 'data': [] });
                    }
                });
            }
            else {
                res.status(200).send({
                    'success': false, message: "Current password doesn't match."
                });
            };
        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.updateStatus = async function (req, res, next) {

    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var loginId = await getLoginUserId(token);
            let user = await User.findOne({ where: { id: req.body.user_id } });
            if (user) {
                let data = {
                    status: (user.status == 'active') ? 'inactive' : 'active'
                }
                await User.update(data, { where: { id: req.body.user_id } });
                user = await User.findOne({ where: { id: req.body.user_id } });
                res.send({ 'success': true, message: 'Status updated successfully', 'data': user });
            }
            else {
                res.status(200).send({
                    'success': false, message: "User not found!"
                });
            };
        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.forgotPassword = async (req, res) => {
    try {
        let user = await User.findOne({ where: { email: req.body.email, role_id: 1 } });
        if (user) {

            var smtpConfig = {
                service: 'gmail',
                host: 'smtp.gmail.com',
                port: 587,
                secure: true,
                requireTLS: true,
                auth: {
                    user: config.EMAIL,
                    pass: config.PASS
                }
            };
            var password = '';
            length = 8;
            chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
            for (var i = length; i > 0; --i)
                password += chars[Math.floor(Math.random() * chars.length)];
            var salt = 10;
            bcrypt.hash(password, salt, (err, encrypted) => {
                passwordHash = encrypted;
                userData = {
                    password: passwordHash,
                };
                User.update(userData, { where: { email: req.body.email } });
            });

            var message = '<B>Your new Password is :' + password + '</b>';
            var transporter = nodemailer.createTransport(smtpConfig);
            var mailOptions = {
                from: config.EMAIL, // sender address
                to: req.body.email, // list of receivers
                subject: "Forgot Password", // Subject line
                text: 'Hello world ?', // plaintext body
                html: message // html body
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    return res.send({ success: false, message: error.message, data: [] });
                }
                else {
                    res.send({ success: true, message: "Password has been sent to your email Id successfully.", data: [] });
                }
            });
        } else {
            res.send({ success: false, message: "Sorry, Email not found.", data: [] });
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.addBlog = async (req, res) => {

    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var fileName = '';
            if (req.files != null) {
                const image = req.files.image
                let dir = 'uploads/blogs';
                const path = dir + '/' + image.name
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                image.mv(path, (error) => {
                    if (error) {
                        res.writeHead(500, {
                            'Content-Type': 'application/json'
                        })
                        res.end(JSON.stringify({ status: 'error', message: error }))
                    }
                })
                fileName = image.name
            }
            let data = {
                title: req.body.title,
                description: req.body.description,
                image: fileName,
                url: req.body.url,
                list_order: await getAllBlogCount() + 1
            }
            await Blog.create(data);
            res.send({ success: true, message: "Blog created successfully.", data: [] });
        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.editBlog = async (req, res) => {

    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var blog = await Blog.findOne({ where: { id: req.body.id } });
            var fileName;
            if (req.files != null) {
                const image = req.files.image
                let dir = 'uploads/blogs';
                const path = dir + '/' + image.name
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                image.mv(path, (error) => {
                    if (error) {
                        res.writeHead(500, {
                            'Content-Type': 'application/json'
                        })
                        res.end(JSON.stringify({ status: 'error', message: error }))
                    }
                })
                fileName = image.name
            }
            if (blog) {
                let data = {
                    title: req.body.title,
                    description: req.body.description,
                    image: fileName,
                    url: req.body.url
                }
                await Blog.update(data, { where: { id: req.body.id } });
                res.send({ success: true, message: "Blog updated successfully.", data: [] });
            } else {
                res.send({ success: false, message: "Blog not found.", data: [] });
            }
        } else {
            res.send({ success: false, message: "Invalid token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.blogDetail = async (req, res) => {
    let token = await User.getToken(req);
    let isValidToekn = await validateToekn(token);
    if (isValidToekn) {
        var blog = await Blog.findOne({ where: { id: req.params.id } });
        var obj = Object.assign({}, blog.get());
        // obj.description = obj.description.replace(/<\/?[^>]+(>|$)/g, "");
        res.send({ success: true, message: "", data: obj });
    } else {
        res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
    }

};

exports.teacherInfo = async (req, res) => {
    let token = await User.getToken(req);
    let isValidToekn = await validateToekn(token);
    if (isValidToekn) {
        var teacher = await User.findOne({
            where:
                { id: req.params.id },
            include: [
                {
                    model: db.teacherProfile
                    , include: [
                        {
                            model: db.userEmoji
                        }
                    ]
                },

            ]
        });
        res.send({ success: true, message: "", data: teacher });
    } else {
        res.send({ success: false, message: "Invalid token", data: [] });
    }

};

exports.blogDelete = async (req, res) => {
    let token = await User.getToken(req);
    let isValidToekn = await validateToekn(token);
    if (isValidToekn) {
        var blog = await Blog.destroy({ where: { id: req.params.id } });
        res.send({ success: true, message: "Blog deleted successfully.", data: [] });
    } else {
        res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
    }

};

exports.routineList = async function (req, res, next) {

    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var All = [];
            let search = {
                user_id: req.query.user_id
            }
            if (req.query.search) {
                search = {
                    [Op.and]: [
                        {
                            routine_name: {
                                [Op.like]: '%' + req.query.search + '%'
                            }
                        },
                        {
                            user_id: req.query.user_id
                        }
                    ]

                }
            }

            let limit = 50;
            let offset = 0 + (req.query.page - 1) * limit;
            let count = await Routine.count({ where: search });
            let routineList = await Routine.findAndCountAll({
                where: search,
                limit: limit,
                offset: offset,
                order: [['id', 'DESC']],
                include: [
                    {
                        model: db.user
                    },
                    {
                        model: db.routineVideo
                    }
                ]
            }
            );
            for (const row of routineList['rows']) {
                var obj = Object.assign({}, row.get());
                obj.video_count = await getVideoCount(obj.id);
                var type = await checkRoutineContentType(obj.id,'series');
                obj.content_type = (type == 'same')?obj.content_type : type;
                All.push(obj);
            }
            routineList['rows'] = All;
            routineList['currentPage'] = req.query.page;
            routineList['count'] = count;
            routineList['totalPages'] = Math.ceil(routineList['count'] / limit);
            res.send({ success: true, message: "", data: routineList });
        } else {
            res.send({ success: false, message: "Invalid token", data: [] });
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.seriesList = async function (req, res, next) {

    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var All = [];
            let search = {
                user_id: req.query.user_id
            }
            if (req.query.search) {
                search = {
                    [Op.and]: [
                        {
                            routine_name: {
                                [Op.like]: '%' + req.query.search + '%'
                            }
                        },
                        {
                            user_id: req.query.user_id
                        }
                    ]

                }
            }

            let limit = 50;
            let offset = 0 + (req.query.page - 1) * limit;
            let count = await Series.count({ where: search });
            let routineList = await Series.findAndCountAll({
                where: search,
                limit: limit,
                offset: offset,
                order: [['id', 'DESC']],
                include: [
                    {
                        model: db.user
                    },
                    {
                        model: db.seriesVideo
                    }
                ]
            }
            );
            for (const row of routineList['rows']) {
                var obj = Object.assign({}, row.get());
                obj.video_count = await getSeriesVideoCount(obj.id);
                var type = await checkRoutineContentType(obj.id,'series');
                obj.content_type = (type == 'same')?obj.content_type : type;
                All.push(obj);
            }
            routineList['rows'] = All;
            routineList['currentPage'] = req.query.page;
            routineList['count'] = count;
            routineList['totalPages'] = Math.ceil(routineList['count'] / limit);
            res.send({ success: true, message: "", data: routineList });
        } else {
            res.send({ success: false, message: "Invalid token", data: [] });
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.userList = async (req, res) => {
    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var All = [];
            let search = {
                role_id: 2
            }
            if (req.query.search) {
                search = {
                    [Op.and]: [
                        {
                            fullname: {
                                [Op.like]: '%' + req.query.search + '%'
                            }
                        },
                        {
                            role_id: 2
                        }
                    ]

                }
            }
            let limit = 50
            let offset = 0 + (req.query.page - 1) * limit
            let userList = await User.findAndCountAll({
                where: search,
                limit: limit,
                offset: offset,
                order: [['id', 'DESC']]
            }
            );
            userList['rows'] = userList['rows'];
            userList['currentPage'] = req.query.page;
            userList['totalPages'] = Math.ceil(userList['count'] / limit);
            res.send({ success: true, message: "", data: userList });
        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.artistList = async (req, res) => {

    try {
        let teacherList = await User.findAll({
            where: { role_id: 3 },
            order: [['id', 'DESC']]
        }
        );
        res.send({ success: true, message: "", data: teacherList });
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}
exports.addRoutine = async (req, res) => {

    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var fileName = '';
            console.log('body',res.body)
            var routine = await Routine.findOne({ where: { routine_name: req.body.routine_name, user_id: parseInt(req.body.user_id) } });
            if (routine) {
                return res.send({ success: false, message: "This Routine already has been added by you.", data: [] });
            }

            if (req.files) {
                const image = req.files.image
                let dir = 'uploads/routines/images';
                const path = dir + '/' + image.name
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                image.mv(path, (error) => {
                    if (error) {
                        res.writeHead(500, {
                            'Content-Type': 'application/json'
                        })
                        res.end(JSON.stringify({ status: 'error', message: error }))
                    }
                })
                fileName = image.name
            }

            var user = await User.findOne({ where: { id: req.body.user_id } });
            var sliceFolderName = user.fullname + ' ' + req.body.routine_name
            let insertData = {
                routine_name: req.body.routine_name,
                user_id: parseInt(req.body.user_id),
                routine_description: req.body.routine_description,
                routine_level: req.body.routine_level,
                image: fileName,
                content_type : req.body.content_type
            }
            var routineResponse = await Routine.create(insertData);
            // if(req.body.content_type == 'premium')
            // {   
                let updatetData = {
                    content_type : req.body.content_type
                }
                await RoutineVideo.update(updatetData, { where: { routine_id: routineResponse.id } });   
            // }
            var routineId = routineResponse.id;
            /* create routine folder */
            var options = await getOptionValue('/api/v1/folders/', 'POST');
            var requset = https.request(options, function (response) {
                var chunks = [];
                response.on("data", function (chunk) {
                    chunks.push(chunk);
                });
                response.on("end", function (chunk) {
                    var body = Buffer.concat(chunks);
                    var routineFolder = {
                        type: 'routine',
                        folder_info: body,
                        routine_id: routineId
                    }
                    RoutineFolder.create(routineFolder);
                });
                response.on("error", function (error) {
                    console.error(error);
                });
            });
            var postData = qs.stringify({
                'name': sliceFolderName,
            });
            requset.write(postData);
            requset.end();
            res.send({ success: true, message: "Routine created successfully.", data: [] });
        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.addSeries = async (req, res) => {

    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var fileName = '';
            console.log('body',res.body)
            var routine = await Series.findOne({ where: { series_name: req.body.series_name, user_id: parseInt(req.body.user_id) } });
            if (routine) {
                return res.send({ success: false, message: "This Series already has been added by you.", data: [] });
            }

            if (req.files) {
                const image = req.files.image
                let dir = 'uploads/series/images';
                const path = dir + '/' + image.name
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                image.mv(path, (error) => {
                    if (error) {
                        res.writeHead(500, {
                            'Content-Type': 'application/json'
                        })
                        res.end(JSON.stringify({ status: 'error', message: error }))
                    }
                })
                fileName = image.name
            }

            var user = await User.findOne({ where: { id: req.body.user_id } });
            var sliceFolderName = user.fullname + ' ' + req.body.routine_name
            let insertData = {
                series_name: req.body.series_name,
                user_id: parseInt(req.body.user_id),
                series_description: req.body.series_description,
                series_level: req.body.series_level,
                image: fileName,
                content_type : req.body.content_type
            }
            var routineResponse = await Series.create(insertData);
            // if(req.body.content_type == 'premium')
            // {   
                // let updatetData = {
                //     content_type : req.body.content_type
                // }
                // await RoutineFolder.update(updatetData, { where: { series_id: routineResponse.id } });   
            // }
            var routineId = routineResponse.id;
            /* create routine folder */
            var options = await getOptionValue('/api/v1/folders/', 'POST');
            var requset = https.request(options, function (response) {
                var chunks = [];
                response.on("data", function (chunk) {
                    chunks.push(chunk);
                });
                response.on("end", function (chunk) {
                    var body = Buffer.concat(chunks);
                    var routineFolder = {
                        type: 'series',
                        folder_info: body,
                        series_id: routineId
                    }
                    RoutineFolder.create(routineFolder);
                });
                response.on("error", function (error) {
                    console.error(error);
                });
            });
            var postData = qs.stringify({
                'name': sliceFolderName,
            });
            requset.write(postData);
            requset.end();
            res.send({ success: true, message: "Series created successfully.", data: [] });
        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.editRoutine = async (req, res) => {

    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {

            var routineExist = await Routine.findOne({
                where: {
                    routine_name: req.body.routine_name,
                    [Op.and]: [
                        { user_id: parseInt(req.body.user_id) },
                        {
                            id: {
                                [Op.not]: req.body.id
                            }
                        },
                        {
                            routine_name: {
                                [Op.eq]: req.body.routine_name
                            }
                        }
                    ]
                }
            });

            /*if (routineExist) {
                return res.send({ success: false, message: "This Routine already has been added by you.", data: [] });
            }*/

            var routine = await Routine.findOne({
                where: { id: req.body.id },
                include: [
                    {
                        model: db.routineFolder
                    }
                ],
            });

            var folderId = routine.routineFolder.folder_info.id;
            var fileName;
            if (req.files) {
                const image = req.files.image
                let dir = 'uploads/routines/images';
                const path = dir + '/' + image.name
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                image.mv(path, (error) => {
                    if (error) {
                        res.writeHead(500, {
                            'Content-Type': 'application/json'
                        })
                        res.end(JSON.stringify({ status: 'error', message: error }))
                    }
                })
                fileName = image.name
            }
            if (routine) {
                let updatetData = {
                    routine_name: req.body.routine_name,
                    user_id: parseInt(req.body.user_id),
                    routine_description: req.body.routine_description,
                    routine_level: req.body.routine_level,
                    image: fileName,
                    content_type : req.body.content_type
                }
                await Routine.update(updatetData, { where: { id: req.body.id } });
                // if(req.body.content_type == 'premium')
                // {   
                    let updatData = {
                        content_type : req.body.content_type
                    }
                    await RoutineVideo.update(updatData, { where: { routine_id: req.body.id } });   
                // }
                /*update routine folder name */
                if (routine.routine_name != req.routine_name) {
                    var options = await getOptionValue('/api/v1/folders/' + folderId + '/', 'POST');
                    var requset = https.request(options, function (response) {
                        var chunks = [];
                        response.on("data", function (chunk) {
                            chunks.push(chunk);
                        });
                        response.on("end", function (chunk) {
                            var body = Buffer.concat(chunks);
                            // console.log(JSON.parse(body))
                        });
                        response.on("error", function (error) {
                            console.error(error);
                        });
                    });
                    var postData = qs.stringify({
                        'name': req.body.routine_name,
                    });
                    requset.write(postData);
                    requset.end();
                }
                res.send({ success: true, message: "Routine updated successfully.", data: [] });
            } else {
                res.send({ success: false, message: "Routine not found.", data: [] });
            }
        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.editSeries = async (req, res) => {

    // try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var routineExist = await Series.findOne({
                where: {
                    series_name: req.body.series_name,
                    [Op.and]: [
                        { user_id: parseInt(req.body.user_id) },
                        {
                            id: {
                                [Op.not]: req.body.id
                            }
                        },
                        {
                            series_name: {
                                [Op.eq]: req.body.series_name
                            }
                        }
                    ]
                }
            });
            var routine = await Series.findOne({
                where: { id: req.body.id },
                include: [
                    {
                        model: db.routineFolder
                    }
                ],
            });

            var folderId = routine.routineFolder.folder_info.id;
            var fileName;
            if (req.files) {
                const image = req.files.image
                let dir = 'uploads/routines/images';
                const path = dir + '/' + image.name
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                image.mv(path, (error) => {
                    if (error) {
                        res.writeHead(500, {
                            'Content-Type': 'application/json'
                        })
                        res.end(JSON.stringify({ status: 'error', message: error }))
                    }
                })
                fileName = image.name
            }
            if (routine) {
                let updatetData = {
                    series_name: req.body.series_name,
                    user_id: parseInt(req.body.user_id),
                    series_description: req.body.series_description,
                    series_level: req.body.series_level,
                    image: fileName,
                    content_type : req.body.content_type
                }
                await Series.update(updatetData, { where: { id: req.body.id } });
                // if(req.body.content_type == 'premium')
                // {   
                    let updatData = {
                        content_type : req.body.content_type
                    }
                    await RoutineFolder.update(updatData, { where: { series_id: req.body.id } });   
                // }
                /*update routine folder name */
                if (routine.routine_name != req.routine_name) {
                    var options = await getOptionValue('/api/v1/folders/' + folderId + '/', 'POST');
                    var requset = https.request(options, function (response) {
                        var chunks = [];
                        response.on("data", function (chunk) {
                            chunks.push(chunk);
                        });
                        response.on("end", function (chunk) {
                            var body = Buffer.concat(chunks);
                            // console.log(JSON.parse(body))
                        });
                        response.on("error", function (error) {
                            console.error(error);
                        });
                    });
                    var postData = qs.stringify({
                        'name': req.body.routine_name,
                    });
                    requset.write(postData);
                    requset.end();
                }
                res.send({ success: true, message: "Routine updated successfully.", data: [] });
            } else {
                res.send({ success: false, message: "Routine not found.", data: [] });
            }
        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
        }
    // } catch (e) {
    //     res.send({ success: false, message: e.message, data: [] });
    // }
}

exports.editRoutineVideoOld = async (req, res) => {

    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var routineVideo = await RoutineVideo.findOne({ where: { id: req.body.id } });
            if (routineVideo) {
                if (req.files != null) {
                    var filePath = 'uploads/routines/videos' + '/' + routineVideo.video_file_name;
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                    var videos = req.files.video;
                    let dir = 'uploads/routines/videos';
                    const path = dir + '/' + videos.name
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    videos.mv(path, (error) => {
                        if (error) {
                            res.writeHead(500, {
                                'Content-Type': 'application/json'
                            })
                            res.end(JSON.stringify({ status: 'error', message: error }))
                        }
                    })
                    video_link = videos.name
                    var videoPath = 'uploads/routines/videos/' + video_link;
                    dir = 'uploads/routines/thumbs/';
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    var duration = await getVideoDurationInSeconds(config.HOST + videoPath);
                    var measuredTime = new Date(null);
                    measuredTime.setSeconds(duration); // specify value of SECONDS
                    var MHSTime = measuredTime.toISOString().substr(11, 8);
                    total_duration = MHSTime;
                    const tg = await new ThumbnailGenerator({
                        sourcePath: videoPath,
                        thumbnailPath: 'uploads/routines/thumbs/',
                        tmpDir: '/uploads/routines/videos/thumbs/'
                    });

                    tg.generateOneByPercentCb(50, async (err, result) => {
                        video_thumb = result;
                        let Data = {
                            video_title: req.body.video_title,
                            video_description: req.body.video_description,
                            video_duration: total_duration,
                            video_thumb: video_thumb,
                            video_link: video_link,
                            slice_added: 'no',
                            notation_file_added: 'no',
                        }
                        await RoutineVideo.update(Data, { where: { id: req.body.id } });
                    });
                    return res.send({ success: true, message: "Routine video updated.", data: [] });
                } else {
                    let data = {
                        video_title: req.body.video_title,
                        video_description: req.body.video_description
                    }
                    await RoutineVideo.update(data, { where: { id: req.body.id } });
                    return res.send({ success: true, message: "Routine video updated.", data: [] });
                }
            }
            res.send({ success: false, message: "Routine video not found.", data: [] });
        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.editRoutineVideo = async (req, res) => {
    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var routineVideo = await RoutineVideo.findOne({ where: { id: req.body.id } });

            if (routineVideo) {
                if (routineVideo.video_type == 'embed_url') {
                    if (req.files != null) {
                        var thumbFile = routineVideo.video_thumb.replace(config.HOST, "");
                        var filePath = 'uploads/routines/thumbs' + '/' + thumbFile;
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                        var videos = req.files.thumb;
                        let dir = 'uploads/routines/thumbs';
                        const path = dir + '/' + videos.name
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        videos.mv(path, (error) => {
                            if (error) {
                                res.writeHead(500, {
                                    'Content-Type': 'application/json'
                                })
                                res.end(JSON.stringify({ status: 'error', message: error }))
                            }
                        })
                        video_link = videos.name
                        let Data = {
                            video_title: req.body.video_title,
                            video_description: req.body.video_description,
                            video_duration: "00:00:00",
                            video_thumb: video_link,
                            video_link: req.body.embed_url,
                            content_type : req.body.content_type
                        }

                        await RoutineVideo.update(Data, { where: { id: req.body.id } });

                        return res.send({ success: true, message: "Artist video updated.", data: [] });
                    } else {
                        let Data = {
                            video_title: req.body.video_title,
                            video_description: req.body.video_description,
                            video_link: req.body.embed_url,
                            content_type : req.body.content_type
                        }
                        await RoutineVideo.update(Data, { where: { id: req.body.id } });
                        /// Update videoslice table data //
                        var embed_video_link = req.body.embed_url
                        var rest = embed_video_link.replace("https://www.soundslice.com/slices/", "");
                        var lastFirst = rest.replace("/embed", "");
                        var lastScorehash = lastFirst.replace("/", "");

                        var sliceBody = {
                            "scorehash": lastScorehash,
                            "slug": "",
                            "slug": "",
                            "slug": "",
                            "url": "",
                            "embed_url": ""

                        }

                        sliceData = {
                            type: 'embed_url',
                            slice_info: JSON.stringify(sliceBody),
                            recording_info: JSON.stringify({ "errors": { "source_data": ["Enter a valid URL."] } })
                        }

                        await VideoSliceModel.update(sliceData, { where: { video_id: req.body.id, routine_id: routineVideo.routine_id, type: 'embed_url' } });

                        return res.send({ success: true, message: "Artist video updated.", data: [] });
                    }
                } else {
                    if (req.files != null) {
                        var filePath = 'uploads/routines/videos' + '/' + routineVideo.video_file_name;
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                        var videos = req.files.video;
                        let dir = 'uploads/routines/videos';
                        const path = dir + '/' + videos.name
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        videos.mv(path, (error) => {
                            if (error) {
                                res.writeHead(500, {
                                    'Content-Type': 'application/json'
                                })
                                res.end(JSON.stringify({ status: 'error', message: error }))
                            }
                        })
                        video_link = videos.name
                        var videoPath = 'uploads/routines/videos/' + video_link;
                        dir = 'uploads/routines/thumbs/';
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        var duration = await getVideoDurationInSeconds(config.HOST + videoPath);
                        var measuredTime = new Date(null);
                        measuredTime.setSeconds(duration); // specify value of SECONDS
                        var MHSTime = measuredTime.toISOString().substr(11, 8);
                        total_duration = MHSTime;
                        const tg = await new ThumbnailGenerator({
                            sourcePath: videoPath,
                            thumbnailPath: 'uploads/routines/thumbs/',
                            tmpDir: '/uploads/routines/videos/thumbs/'
                        });

                        tg.generateOneByPercentCb(50, async (err, result) => {
                            video_thumb = result;
                            let Data = {
                                video_title: req.body.video_title,
                                video_description: req.body.video_description,
                                video_duration: total_duration,
                                video_thumb: video_thumb,
                                video_link: video_link,
                                slice_added: 'no',
                                notation_file_added: 'no',
                                content_type : req.body.content_type
                            }
                            await RoutineVideo.update(Data, { where: { id: req.body.id } });
                        });
                        return res.send({ success: true, message: "Routine video updated.", data: [] });
                    } else {
                        let data = {
                            video_title: req.body.video_title,
                            video_description: req.body.video_description,
                            content_type : req.body.content_type
                        }
                        console.log('data',data);
                        await RoutineVideo.update(data, { where: { id: req.body.id } });
                        return res.send({ success: true, message: "Routine video updated.", data: [] });
                    }
                }
            }
            res.send({ success: false, message: "Routine video not found.", data: [] });
        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}


exports.editSeriesVideo = async (req, res) => {
    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var routineVideo = await SeriesVideo.findOne({ where: { id: req.body.id } });

            if (routineVideo) {
                if (routineVideo.video_type == 'embed_url') {
                    if (req.files != null) {
                        var thumbFile = routineVideo.video_thumb.replace(config.HOST, "");
                        var filePath = 'uploads/series/thumbs' + '/' + thumbFile;
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                        var videos = req.files.thumb;
                        let dir = 'uploads/series/thumbs';
                        const path = dir + '/' + videos.name
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        videos.mv(path, (error) => {
                            if (error) {
                                res.writeHead(500, {
                                    'Content-Type': 'application/json'
                                })
                                res.end(JSON.stringify({ status: 'error', message: error }))
                            }
                        })
                        video_link = videos.name
                        let Data = {
                            video_title: req.body.video_title,
                            video_description: req.body.video_description,
                            video_duration: "00:00:00",
                            video_thumb: video_link,
                            video_link: req.body.embed_url,
                            content_type : req.body.content_type
                        }

                        await SeriesVideo.update(Data, { where: { id: req.body.id } });

                        return res.send({ success: true, message: "Series video updated.", data: [] });
                    } else {
                        let Data = {
                            video_title: req.body.video_title,
                            video_description: req.body.video_description,
                            video_link: req.body.embed_url,
                            content_type : req.body.content_type
                        }
                        await SeriesVideo.update(Data, { where: { id: req.body.id } });
                        /// Update videoslice table data //
                        var embed_video_link = req.body.embed_url
                        var rest = embed_video_link.replace("https://www.soundslice.com/slices/", "");
                        var lastFirst = rest.replace("/embed", "");
                        var lastScorehash = lastFirst.replace("/", "");

                        var sliceBody = {
                            "scorehash": lastScorehash,
                            "slug": "",
                            "slug": "",
                            "slug": "",
                            "url": "",
                            "embed_url": ""

                        }

                        sliceData = {
                            type: 'embed_url',
                            slice_info: JSON.stringify(sliceBody),
                            recording_info: JSON.stringify({ "errors": { "source_data": ["Enter a valid URL."] } })
                        }

                        await VideoSliceModel.update(sliceData, { where: { video_id: req.body.id, series_id: routineVideo.series_id, type: 'embed_url' } });

                        return res.send({ success: true, message: "Series video updated.", data: [] });
                    }
                } else {
                    if (req.files != null) {
                        var filePath = 'uploads/series/videos' + '/' + routineVideo.video_file_name;
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                        var videos = req.files.video;
                        let dir = 'uploads/series/videos';
                        const path = dir + '/' + videos.name
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        videos.mv(path, (error) => {
                            if (error) {
                                res.writeHead(500, {
                                    'Content-Type': 'application/json'
                                })
                                res.end(JSON.stringify({ status: 'error', message: error }))
                            }
                        })
                        video_link = videos.name
                        var videoPath = 'uploads/series/videos/' + video_link;
                        dir = 'uploads/series/thumbs/';
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        var duration = await getVideoDurationInSeconds(config.HOST + videoPath);
                        var measuredTime = new Date(null);
                        measuredTime.setSeconds(duration); // specify value of SECONDS
                        var MHSTime = measuredTime.toISOString().substr(11, 8);
                        total_duration = MHSTime;
                        const tg = await new ThumbnailGenerator({
                            sourcePath: videoPath,
                            thumbnailPath: 'uploads/series/thumbs/',
                            tmpDir: '/uploads/series/videos/thumbs/'
                        });

                        tg.generateOneByPercentCb(50, async (err, result) => {
                            video_thumb = result;
                            let Data = {
                                video_title: req.body.video_title,
                                video_description: req.body.video_description,
                                video_duration: total_duration,
                                video_thumb: video_thumb,
                                video_link: video_link,
                                slice_added: 'no',
                                notation_file_added: 'no',
                                content_type : req.body.content_type
                            }
                            await SeriesVideo.update(Data, { where: { id: req.body.id } });
                        });
                        return res.send({ success: true, message: "Series video updated.", data: [] });
                    } else {
                        let data = {
                            video_title: req.body.video_title,
                            video_description: req.body.video_description,
                            content_type : req.body.content_type
                        }
                        console.log('data',data);
                        await SeriesVideo.update(data, { where: { id: req.body.id } });
                        return res.send({ success: true, message: "Series video updated.", data: [] });
                    }
                }
            }
            res.send({ success: false, message: "Series video not found.", data: [] });
        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}


exports.editArtistVideo = async (req, res) => {

    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var routineVideo = await TeacherVideo.findOne({ where: { id: req.body.id } });
            if (routineVideo) {
                
                if (routineVideo.video_type == 'embed_url') {
                    if (req.files != null) {

                        var thumbFile = routineVideo.video_thumb.replace(config.HOST, "");
                        var filePath = 'uploads/artists/thumbs' + '/' + thumbFile;
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                        var videos = req.files.thumb;
                        let dir = 'uploads/artists/thumbs';
                        const path = dir + '/' + videos.name
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        videos.mv(path, (error) => {
                            if (error) {
                                res.writeHead(500, {
                                    'Content-Type': 'application/json'
                                })
                                res.end(JSON.stringify({ status: 'error', message: error }))
                            }
                        })
                        video_link = videos.name
                        let Data = {
                            video_title: req.body.video_title,
                            video_description: req.body.video_description,
                            duration: "00:00:00",
                            video_thumb: video_link,
                            video_link: req.body.embed_url,
                            video_level: req.body.video_level,
                            content_type: req.body.content_type
                        }
                        await TeacherVideo.update(Data, { where: { id: req.body.id } });

                        return res.send({ success: true, message: "Artist video updated.", data: [] });
                    } else {
                        let data = {
                            video_title: req.body.video_title,
                            video_description: req.body.video_description,
                            video_link: req.body.embed_url,
                            video_level: req.body.video_level,
                            content_type: req.body.content_type
                        }
                        await TeacherVideo.update(data, { where: { id: req.body.id } });
                        /// Update videoslice table data //
                        var embed_video_link = req.body.embed_url
                        var rest = embed_video_link.replace("https://www.soundslice.com/slices/", "");
                        var lastFirst = rest.replace("/embed", "");
                        var lastScorehash = lastFirst.replace("/", "");

                        var sliceBody = {
                            "scorehash": lastScorehash,
                            "slug": "",
                            "slug": "",
                            "slug": "",
                            "url": "",
                            "embed_url": ""

                        }

                        sliceData = {
                            type: 'embed_url',
                            slice_info: JSON.stringify(sliceBody),
                            recording_info: JSON.stringify({ "errors": { "source_data": ["Enter a valid URL."] } })
                        }

                        await VideoSliceModel.update(sliceData, { where: { artist_video_id: req.body.id, artist_id: routineVideo.user_id, type: 'embed_url' } });

                        return res.send({ success: true, message: "Artist video updated.", data: [] });
                    }
                } else {
                    if (req.files != null) {
                        var filePath = 'uploads/artists/videos' + '/' + routineVideo.video_file_name;
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                        var videos = req.files.video;
                        let dir = 'uploads/artists/videos';
                        const path = dir + '/' + videos.name
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        videos.mv(path, (error) => {
                            if (error) {
                                res.writeHead(500, {
                                    'Content-Type': 'application/json'
                                })
                                res.end(JSON.stringify({ status: 'error', message: error }))
                            }
                        })
                        video_link = videos.name
                        var videoPath = 'uploads/artists/videos/' + video_link;
                        dir = 'uploads/artists/thumbs/';
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        // console.log(config.HOST+videoPath);
                        var duration = await getVideoDurationInSeconds(config.HOST + videoPath);
                        var measuredTime = new Date(null);
                        measuredTime.setSeconds(duration); // specify value of SECONDS
                        var MHSTime = measuredTime.toISOString().substr(11, 8);
                        total_duration = MHSTime;

                        const tg = await new ThumbnailGenerator({
                            sourcePath: videoPath,
                            thumbnailPath: 'uploads/artists/thumbs/',
                            tmpDir: '/uploads/artists/videos/thumbs/'
                        });

                        tg.generateOneByPercentCb(50, async (err, result) => {
                            video_thumb = result;
                            let Data = {
                                video_title: req.body.video_title,
                                video_description: req.body.video_description,
                                duration: total_duration,
                                video_thumb: video_thumb,
                                video_link: video_link,
                                slice_added: 'no',
                                notation_file_added: 'no',
                                video_level: req.body.video_level,
                                content_type: req.body.content_type
                            }
                            await TeacherVideo.update(Data, { where: { id: req.body.id } });
                        });
                        return res.send({ success: true, message: "Artist video updated.", data: [] });
                    } else {
                        let data = {
                            video_title: req.body.video_title,
                            video_description: req.body.video_description,
                            video_level: req.body.video_level,
                            content_type: req.body.content_type
                        }
                        await TeacherVideo.update(data, { where: { id: req.body.id } });
                        return res.send({ success: true, message: "Artist video updated.", data: [] });
                    }
                }

            }
            res.send({ success: false, message: "Routine video not found.", data: [] });
        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}


exports.editArtistVideoOld = async (req, res) => {

    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var routineVideo = await TeacherVideo.findOne({ where: { id: req.body.id } });
            if (routineVideo) {
                if (req.files != null) {
                    var filePath = 'uploads/artists/videos' + '/' + routineVideo.video_file_name;
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                    var videos = req.files.video;
                    let dir = 'uploads/artists/videos';
                    const path = dir + '/' + videos.name
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    videos.mv(path, (error) => {
                        if (error) {
                            res.writeHead(500, {
                                'Content-Type': 'application/json'
                            })
                            res.end(JSON.stringify({ status: 'error', message: error }))
                        }
                    })
                    video_link = videos.name
                    var videoPath = 'uploads/artists/videos/' + video_link;
                    dir = 'uploads/artists/thumbs/';
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    // console.log(config.HOST+videoPath);
                    var duration = await getVideoDurationInSeconds(config.HOST + videoPath);
                    var measuredTime = new Date(null);
                    measuredTime.setSeconds(duration); // specify value of SECONDS
                    var MHSTime = measuredTime.toISOString().substr(11, 8);
                    total_duration = MHSTime;

                    const tg = await new ThumbnailGenerator({
                        sourcePath: videoPath,
                        thumbnailPath: 'uploads/routines/thumbs/',
                        tmpDir: '/uploads/routines/videos/thumbs/'
                    });

                    tg.generateOneByPercentCb(50, async (err, result) => {
                        video_thumb = result;
                        let Data = {
                            video_title: req.body.video_title,
                            video_description: req.body.video_description,
                            duration: total_duration,
                            video_thumb: video_thumb,
                            video_link: video_link,
                        }
                        await TeacherVideo.update(Data, { where: { id: req.body.id } });
                    });
                    return res.send({ success: true, message: "Artist video updated.", data: [] });
                } else {
                    let data = {
                        video_title: req.body.video_title,
                        video_description: req.body.video_description
                    }
                    await TeacherVideo.update(data, { where: { id: req.body.id } });
                    return res.send({ success: true, message: "Artist video updated.", data: [] });
                }
            }
            res.send({ success: false, message: "Routine video not found.", data: [] });
        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.routineDetail = async (req, res) => {
    try {

        var routine = await Routine.findOne({
            where: { id: req.params.id },
            include: [
                {
                    model: db.user
                }
            ],
        });
        res.send({ success: true, message: "", data: routine });
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.seriesDetail = async (req, res) => {
    try {

        var routine = await Series.findOne({
            where: { id: req.params.id },
            include: [
                {
                    model: db.user
                }
            ],
        });
        res.send({ success: true, message: "", data: routine });
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.routineVideoDetail = async (req, res) => {

    try {

        var routine = await RoutineVideo.findOne({
            where: { id: req.params.id },
            include: [
                {
                    model: db.user
                },
                {
                    model: db.routine
                },
                {
                    model: db.videoSlice
                }
            ],
        });
        //console.log(routine);
        res.send({ success: true, message: "", data: routine });
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.artistVideoDetail = async (req, res) => {

    try {

        var routine = await TeacherVideo.findOne({
            where: { id: req.params.id },
            include: [
                {
                    model: db.user
                }
                // {
                //     model: db.routine
                // },
                // {
                //     model: db.videoSlice
                // }
            ],
        });
        res.send({ success: true, message: "", data: routine });
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}
exports.routineDetail1 = (req, res) => {
    // let token = await User.getToken(req);
    // let isValidToekn = await validateToekn(token);
    // if (isValidToekn) {
    try {
        // var blog = await Routine.findOne({ where: { id: req.params.id } });
        var soundSliceAppId = "sbErSkzqmRCBEFqYPkGcNNIWvRVwIHcD";
        var soundSlicePassword = "y9kPea:Rf&q2zXuAs*\Qt&/~MU2\JRST";
        // var { soundSliceAppId, soundSlicePassword } = process.env;
        var auth = 'Basic ' + Buffer.from(soundSliceAppId + ':' + soundSlicePassword).toString('base64');
        /* var options = {
            'method': 'GET',
            'url': 'https://www.soundslice.com/api/v1/scores',
            'headers': {
                'Accept': 'application/json',
              'Authorization': 'Basic c2JFclNrenFtUkNCRUZxWVBrR2NOTklXdlJWd0lIY0Q6eTlrUGVhOlJmJnEyelh1QXMqXFF0Ji9+TVUyXEpSU1Q=',
            },
            
          };
          request(options, function (error, response) {
            if (error) throw new Error(error);
            console.log(response.body);
            res.send({ success: true, message: "", data: JSON.parse(response.body)  });
          });
          */
        /*
        var  body = {
           'name': 'The Quick Brown Fox',
           'artist': 'Lazy Dog',
           'embed_status': '4',
           'print_status': '3',
           'status': '3'
         };
         const stringifiedObject = JSON.stringify(body);
         var options = {
           'method': 'POST',
           'hostname': 'www.soundslice.com',
           'path': '/api/v1/scores/',
           'headers': {
             'Authorization': 'Basic c2JFclNrenFtUkNCRUZxWVBrR2NOTklXdlJWd0lIY0Q6eTlrUGVhOlJmJnEyelh1QXMqXFF0Ji9+TVUyXEpSU1Q=',
           },
           body:  stringifiedObject
         };
         request(options, function (error, response) {
           if (error) throw new Error(error);
           console.log(response);
           res.send({ success: true, message: "", data: response  });
         });
         */
        /*
        var options = {
            'method': 'POST',
            'hostname': 'www.soundslice.com',
            'path': '/api/v1/scores/',
            'headers': {
                'Authorization': 'Basic c2JFclNrenFtUkNCRUZxWVBrR2NOTklXdlJWd0lIY0Q6eTlrUGVhOlJmJnEyelh1QXMqXFF0Ji9+TVUyXEpSU1Q=',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': 'sesn=eyJ0ZXN0Y29va2llIjoid29ya2VkIn0:1kaXWy:WEQlXjbM4RAdb65Vb0G5h7S4whA'
            },
            'maxRedirects': 20
        };

        var req = https.request(options, function (response) {
            var chunks = [];

            response.on("data", function (chunk) {
                chunks.push(chunk);
            });

            response.on("end", function (chunk) {
                var body = Buffer.concat(chunks);
                console.log(body.toString());
                res.send({ success: true, message: "", data: JSON.parse(body) });
            });

            response.on("error", function (error) {
                console.error(error);
            });
        });
        var postData = qs.stringify({
            'name': 'The Quick Brown Fox',
            'artist': 'Lazy Dog',
            'embed_status': '4',
            'print_status': '3',
            'status': '3'
        });
        req.write(postData);
        req.end();
        */
        /*
        var options = {
            'method': 'POST',
            'hostname': 'www.soundslice.com',
            'path': '/api/v1/folders/',
            'headers': {
                'Authorization': 'Basic c2JFclNrenFtUkNCRUZxWVBrR2NOTklXdlJWd0lIY0Q6eTlrUGVhOlJmJnEyelh1QXMqXFF0Ji9+TVUyXEpSU1Q=',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            'maxRedirects': 20
        };

        var req = https.request(options, function (response) {
            var chunks = [];
            response.on("data", function (chunk) {
                chunks.push(chunk);
            });
            response.on("end", function (chunk) {
                var body = Buffer.concat(chunks);
                console.log(body.toString());
                res.send({ success: true, message: "", data: JSON.parse(body) });
            });

            response.on("error", function (error) {
                console.error(error);
            });
        });
        var postData = qs.stringify({
            'name': 'YUNUSH',
        });
        req.write(postData);
        req.end();
        */
        var options = {
            'method': 'POST',
            'hostname': 'www.soundslice.com',
            'path': '/api/v1/scores/484797/recordings/',
            'headers': {
                'Authorization': 'Basic c2JFclNrenFtUkNCRUZxWVBrR2NOTklXdlJWd0lIY0Q6eTlrUGVhOlJmJnEyelh1QXMqXFF0Ji9+TVUyXEpSU1Q=',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            'maxRedirects': 20
        };

        var req = https.request(options, function (response) {
            var chunks = [];

            response.on("data", function (chunk) {
                chunks.push(chunk);
            });

            response.on("end", function (chunk) {
                var body = Buffer.concat(chunks);
                //console.log(body.toString());
                res.send({ success: true, message: "", data: JSON.parse(body) });
            });

            response.on("error", function (error) {
                console.error(error);
            });
        });
        var postData = qs.stringify({
            'name': 'Video',
            'source': 1,
            'source_data': 'https://www.youtube.com/watch?v=dDN-t69sa3U',

        });
        req.write(postData);
        req.end();
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
    //test
    // } else {
    //     res.send({ success: false, message: "Invalid token", data: [] });
    // }

};

exports.routineDelete = async (request, res) => {
    let token = await User.getToken(request);
    let isValidToekn = await validateToekn(token);
    if (isValidToekn) {
        var routine = await Routine.findOne({
            where: { id: request.params.id },
            include: [
                {
                    model: db.routineFolder
                }
            ],
        });
        await removeFileFromFolder('uploads/routines/images' + routine.image)
        var routineDelete = await Routine.destroy({ where: { id: request.params.id } });
        res.send({ success: true, message: "Routine deleted successfully.", data: [] });
        // var folderId = routine.routineFolder.folder_info.id;
        // /*delete folder's sloces*/
        // var slices = await VideoSliceModel.findAll({ where: { routine_id: routine.id } });
        // if (slices && slices.length > 0) {
        //     for (let i = 0; i < slices.length; i++) {
        //         var slug = slices[i];
        //         var slugId = JSON.parse(slug.slice_info).slug;
        //         var options = await getOptionValue('/api/v1/scores/' + slugId, 'DELETE');
        //         var req = https.request(options, function (response) {
        //             var chunks = [];
        //             response.on("data", function (chunk) {
        //                 chunks.push(chunk);
        //             });
        //             response.on("end", function (chunk) {
        //                 var body = Buffer.concat(chunks);
        //             });
        //             response.on("error", function (error) {
        //                 console.error(error);
        //             });
        //         });
        //         var postData = qs.stringify({
        //         });
        //         req.write(postData);
        //         req.end();
        //     }
        // }
        // /*delete routine folder from soundslice*/
        // var options = await getOptionValue('/api/v1/folders/' + folderId + '/', 'DELETE');
        // var req = https.request(options, function (response) {
        //     var chunks = [];
        //     response.on("data", function (chunk) {
        //         chunks.push(chunk);
        //     });
        //     response.on("end", async function (chunk) {
        //         var body = Buffer.concat(chunks);
        //         //console.log(body.toString());
        //         var routineDelete = await Routine.destroy({ where: { id: request.params.id } });
        //         res.send({ success: true, message: "Routine deleted successfully.", data: [] });
        //     });
        //     response.on("error", function (error) {
        //         return res.send({ success: false, message: error.message, data: [] });
        //     });
        // });
        // var postData = qs.stringify({
        // });
        // req.write(postData);
        // req.end();
    } else {
        res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
    }

};

exports.seriesDelete = async (request, res) => {
    let token = await User.getToken(request);
    let isValidToekn = await validateToekn(token);
    if (isValidToekn) {
        var series = await Series.findOne({
            where: { id: request.params.id },
            include: [
                {
                    model: db.routineFolder
                }
            ],
        });
        await removeFileFromFolder('uploads/series/images' + series.image)
        var routineDelete = await Series.destroy({ where: { id: request.params.id } });
        res.send({ success: true, message: "Series deleted successfully.", data: [] });
    } else {
        res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
    }

};

exports.routineVideoDelete = async (request, res) => {
    let token = await User.getToken(request);
    let isValidToekn = await validateToekn(token);
    if (isValidToekn) {
        var sliceSeleted = false;
        var video = await RoutineVideo.findOne({ where: { id: request.params.id } });
        await removeFileFromFolder('uploads/routines/videos/' + video.video_file_name)
        var slice = await VideoSliceModel.findOne({
            where: { video_id: request.params.id }
        });

        if (slice) {
            var slugId = slice.slice_info.slug;
            var options = await getOptionValue('/api/v1/scores/' + slugId, 'DELETE');
            var req = https.request(options, function (response) {
                var chunks = [];
                response.on("data", function (chunk) {
                    chunks.push(chunk);
                });
                response.on("end", function (chunk) {
                    var body = Buffer.concat(chunks);
                    console.log(body.toString());
                    sliceSeleted = true;
                });
                response.on("error", function (error) {
                    return res.send({ success: false, message: error.message, data: [] });
                });
            });
            var postData = qs.stringify({
            });
            req.write(postData);
            req.end();
            await RoutineVideo.destroy({ where: { id: request.params.id } });
            res.send({ success: true, message: "Routine video deleted successfully.", data: [] });
        } else {
            await RoutineVideo.destroy({ where: { id: request.params.id } });
            return res.send({ success: true, message: "Routine video deleted successfully.", data: [] });
        }

    } else {
        res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
    }

};

exports.seriesVideoDelete = async (request, res) => {
    let token = await User.getToken(request);
    let isValidToekn = await validateToekn(token);
    if (isValidToekn) {
        var sliceSeleted = false;
        var video = await SeriesVideo.findOne({ where: { id: request.params.id } });
        await removeFileFromFolder('uploads/series/videos/' + video.video_file_name)
        var slice = await VideoSliceModel.findOne({
            where: { video_id: request.params.id }
        });

        if (slice) {
            var slugId = slice.slice_info.slug;
            var options = await getOptionValue('/api/v1/scores/' + slugId, 'DELETE');
            var req = https.request(options, function (response) {
                var chunks = [];
                response.on("data", function (chunk) {
                    chunks.push(chunk);
                });
                response.on("end", function (chunk) {
                    var body = Buffer.concat(chunks);
                    console.log(body.toString());
                    sliceSeleted = true;
                });
                response.on("error", function (error) {
                    return res.send({ success: false, message: error.message, data: [] });
                });
            });
            var postData = qs.stringify({
            });
            req.write(postData);
            req.end();
            await SeriesVideo.destroy({ where: { id: request.params.id } });
            res.send({ success: true, message: "Series video deleted successfully.", data: [] });
        } else {
            await SeriesVideo.destroy({ where: { id: request.params.id } });
            return res.send({ success: true, message: "Series video deleted successfully.", data: [] });
        }

    } else {
        res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
    }

};

exports.teacherDelete = async (req, res) => {
    let token = await User.getToken(req);
    let isValidToekn = await validateToekn(token);
    if (isValidToekn) {
        var blog = await User.destroy({ where: { id: req.params.id } });
        res.send({ success: true, message: "Artist deleted successfully.", data: [] });
    } else {
        res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
    }

};

exports.videoArtistDelete = async (req, res) => {
    let token = await User.getToken(req);
    let isValidToekn = await validateToekn(token);
    if (isValidToekn) {
        var video = await TeacherVideo.findOne({ where: { id: req.params.id } });
        await removeFileFromFolder('uploads/artists/videos/' + video.video_file_name)
        await TeacherVideo.destroy({ where: { id: req.params.id } });
        res.send({ success: true, message: "Artist video deleted successfully.", data: [] });
    } else {
        res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
    }
};


exports.addRoutineVideoOld = async (req, res) => {
    try {
        var videos = [];
        var postData = [];
        var uploadedVideos = req.files;
        // console.log(req.body);
        videos = ((uploadedVideos != 'null') && !Array.isArray(uploadedVideos['videos[]'])) ? [uploadedVideos['videos[]']] : uploadedVideos['videos[]'];
        postData = ((req.body != 'null') && !Array.isArray(req.body['data[]'])) ? [req.body['data[]']] : req.body['data[]'];
        //console.log(postData);
        var length = videos.length;
        for (let i = 0; i < length; i++) {
            postData[i] = JSON.parse(postData[i]);
            //console.log(postData[i]);
            var video_thumb = '';
            var video_link = '';
            var total_duration = '';
            if (videos[i]) {
                let dir = 'uploads/routines/videos';
                var NewName = Math.round(new Date() / 1000) + User.generateToken();
                var fileExt = videos[i].mimetype.split('/').pop();
                var fileName = NewName + '.' + fileExt;
                const path = dir + '/' + fileName
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                videos[i].mv(path, (error) => {
                    if (error) {
                        res.writeHead(500, {
                            'Content-Type': 'application/json'
                        })
                        res.end(JSON.stringify({ status: 'error', message: error }))
                    }
                })
                video_link = fileName
            }
            if (req.body.video_url) {
                video_link = req.body.video_url
            }
            var videoPath = 'uploads/routines/videos/' + video_link;
            let dir = 'uploads/routines/thumbs/';
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            console.log(videoPath);
            var duration = await getVideoDurationInSeconds(config.HOST + videoPath);
            var measuredTime = new Date(null);
            measuredTime.setSeconds(duration); // specify value of SECONDS
            var MHSTime = measuredTime.toISOString().substr(11, 8);
            total_duration = MHSTime;

            const tg = await new ThumbnailGenerator({
                sourcePath: videoPath,
                thumbnailPath: 'uploads/routines/thumbs/',
                tmpDir: '/uploads/routines/videos/thumbs/'
            });

            tg.generateOneByPercentCb(50, async (err, result) => {
                video_thumb = result;
                let insertData = {
                    user_id: parseInt(postData[i].user_id),
                    routine_id: postData[i].routine_id,
                    video_title: postData[i].video_title,
                    video_duration: "00:00:00",
                    video_description: postData[i].video_description,
                    video_thumb: video_thumb,
                    video_link: video_link,
                    video_type: (postData[i].video_type) ? postData[i].video_type : 'local'
                }
                var routineVideo = await RoutineVideo.create(insertData);
            });
        }
        console.log('complete')
        return res.send({ success: true, message: "Routine video created successfully.", data: [] });
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.addRoutineVideo = async (req, res) => {

    try {
        var videos = [];
        var postData = [];
        var uploadedVideos = req.files;

        var thumbs = [];
        // console.log(req.body);
        videos = ((uploadedVideos != 'null') && !Array.isArray(uploadedVideos['videos[]'])) ? [uploadedVideos['videos[]']] : uploadedVideos['videos[]'];
        postData = ((req.body != 'null') && !Array.isArray(req.body['data[]'])) ? [req.body['data[]']] : req.body['data[]'];

        var length1 = videos.length;
        var length = postData.length;
        for (let i = 0; i < length; i++) {
            postData[i] = JSON.parse(postData[i]);
            var video_thumb = '';
            var total_duration = '';
            //if(postData[i].embed_url !="" && postData[i].embed_url != undefined){
            if (postData[i].video_type != "" && postData[i].video_type == 'embed_url') {
                var embed_video_link = postData[i].embed_url
                var rest = embed_video_link.replace("https://www.soundslice.com/slices/", "");
                var lastFirst = rest.replace("/embed", "");
                var lastScorehash = lastFirst.replace("/", "");
                console.log('scorehash:' + lastScorehash)
                var thumb_video_thumb = '';
                if (videos[i] && videos[i] != undefined) {

                    /*get url video duration*/
                    var urlVideoDuration;
                    var options = await getOptionValue('/api/v1/slices/' + lastScorehash + '/recordings/', 'GET');
                    var req = https.request(options, async function (response) {
                        var chunks = [];
                        response.on("data", function (chunk) {
                            chunks.push(chunk);
                        });
                        response.on("end", async function (chunk) {
                            var body = Buffer.concat(chunks);
                            var responseBody = body.toString();
                            responseBody = JSON.parse(responseBody)
                            urlVideoDuration = convertSecondToHMS(responseBody[0].cropped_duration)
                            /*adding data*/
                            let dir = 'uploads/routines/thumbs/';
                            var NewName = Math.round(new Date() / 1000) + User.generateToken();
                            var fileExt = videos[i].mimetype.split('/').pop();
                            // var fileExt = videos[i].name.split('.').pop();
                            var thumbfileName = NewName + '.' + fileExt;
                            const path = dir + '/' + thumbfileName
                            if (!fs.existsSync(dir)) {
                                fs.mkdirSync(dir, { recursive: true });
                            }
                            videos[i].mv(path, (error) => {
                                if (error) {
                                    res.writeHead(500, {
                                        'Content-Type': 'application/json'
                                    })
                                    res.end(JSON.stringify({ status: 'error', message: error }))
                                }
                            })
                            var thumb_file_name = thumbfileName;
                            console.log('datav------------------------',postData[i])
                            let insertData = {
                                user_id: parseInt(postData[i].user_id),
                                routine_id: postData[i].routine_id,
                                video_title: postData[i].video_title,
                                video_duration: urlVideoDuration,
                                video_description: postData[i].video_description,
                                content_type: postData[i].content_type,
                                video_thumb: thumb_file_name,
                                video_link: postData[i].embed_url,
                                slice_added: "yes",
                                notation_file_added: "yes",
                                video_type: (postData[i].video_type) ? postData[i].video_type : 'local',
                                list_order: await getRoutineVideoCount(parseInt(postData[i].routine_id)) + 1
                            }
                            var routineVideo = await RoutineVideo.create(insertData);
                            var embed_video_link = postData[i].embed_url
                            var rest = embed_video_link.replace("https://www.soundslice.com/slices/", "");
                            var lastFirst = rest.replace("/embed", "");
                            var lastScorehash = lastFirst.replace("/", "");
                            let sliceBody = {
                                "scorehash": lastScorehash,
                                "slug": "",
                                "slug": "",
                                "slug": "",
                                "url": "",
                                "embed_url": ""

                            }
                            let sliceData = {
                                video_id: routineVideo.id,
                                type: 'embed_url',
                                slice_info: JSON.stringify(sliceBody),
                                recording_info: JSON.stringify({ "errors": { "source_data": ["Enter a valid URL."] } }),
                                routine_id: postData[i].routine_id
                            }
                            VideoSliceModel.create(sliceData);
                        });
                        response.on("error", function (error) {
                            return res.send({ success: false, message: error.message, data: [] });
                        });
                    });
                    var pData = qs.stringify({
                    });
                    req.write(pData);
                    req.end();
                    console.log('final duration :' + urlVideoDuration)

                }

            } else {
                logger.info('Lenght count  #### %s.', videos[i]);
                if (videos[i] && videos[i] != undefined) {
                    let dir = 'uploads/routines/videos';
                    var NewName = Math.round(new Date() / 1000) + User.generateToken();
                    var fileExt = videos[i].mimetype.split('/').pop();
                    // var fileExt = videos[i].name.split('.').pop();
                    var fileName = NewName + '.' + fileExt;
                    const path = dir + '/' + fileName
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    videos[i].mv(path, (error) => {
                        if (error) {
                            res.writeHead(500, {
                                'Content-Type': 'application/json'
                            })
                            res.end(JSON.stringify({ status: 'error', message: error }))
                        }
                    })
                    var video_link = fileName


                    var videoPath = 'uploads/routines/videos/' + video_link;
                    let thumbdir = 'uploads/routines/thumbs/';
                    if (!fs.existsSync(thumbdir)) {
                        fs.mkdirSync(thumbdir, { recursive: true });
                    }
                    console.log(videoPath);
                    var duration = await getVideoDurationInSeconds(config.HOST + videoPath);
                    var measuredTime = new Date(null);
                    measuredTime.setSeconds(duration); // specify value of SECONDS
                    var MHSTime = measuredTime.toISOString().substr(11, 8);
                    total_duration = MHSTime;

                    const tg = await new ThumbnailGenerator({
                        sourcePath: videoPath,
                        thumbnailPath: 'uploads/routines/thumbs/',
                        tmpDir: '/uploads/routines/videos/thumbs/'
                    });

                    tg.generateOneByPercentCb(50, async (err, result) => {
                        video_thumb = result;
                        console.log('video_link');
                        console.log(video_link);
                        console.log('datav------------------------',postData[i])
                        let insertData = {
                            user_id: parseInt(postData[i].user_id),
                            routine_id: postData[i].routine_id,
                            video_title: postData[i].video_title,
                            video_duration: total_duration,
                            video_description: postData[i].video_description,
                            content_type: postData[i].content_type,
                            video_thumb: video_thumb,
                            video_link: video_link,
                            video_type: (postData[i].video_type) ? postData[i].video_type : 'local',
                            list_order: await getRoutineVideoCount(parseInt(postData[i].routine_id)) + 1
                        }
                        var routineVideo = await RoutineVideo.create(insertData);
                    });
                }
            }
        }
        console.log('complete')
        return res.send({ success: true, message: "Routine video created successfully.", data: [] });
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.addSeriesVideo = async (req, res) => {

    try {
        var videos = [];
        var postData = [];
        var uploadedVideos = req.files;

        var thumbs = [];
        // console.log(req.body);
        videos = ((uploadedVideos != 'null') && !Array.isArray(uploadedVideos['videos[]'])) ? [uploadedVideos['videos[]']] : uploadedVideos['videos[]'];
        postData = ((req.body != 'null') && !Array.isArray(req.body['data[]'])) ? [req.body['data[]']] : req.body['data[]'];

        var length1 = videos.length;
        var length = postData.length;
        for (let i = 0; i < length; i++) {
            postData[i] = JSON.parse(postData[i]);
            var video_thumb = '';
            var total_duration = '';
            //if(postData[i].embed_url !="" && postData[i].embed_url != undefined){
            if (postData[i].video_type != "" && postData[i].video_type == 'embed_url') {
                var embed_video_link = postData[i].embed_url
                var rest = embed_video_link.replace("https://www.soundslice.com/slices/", "");
                var lastFirst = rest.replace("/embed", "");
                var lastScorehash = lastFirst.replace("/", "");
                console.log('scorehash:' + lastScorehash)
                var thumb_video_thumb = '';
                if (videos[i] && videos[i] != undefined) {

                    /*get url video duration*/
                    var urlVideoDuration;
                    var options = await getOptionValue('/api/v1/slices/' + lastScorehash + '/recordings/', 'GET');
                    var req = https.request(options, async function (response) {
                        var chunks = [];
                        response.on("data", function (chunk) {
                            chunks.push(chunk);
                        });
                        response.on("end", async function (chunk) {
                            var body = Buffer.concat(chunks);
                            var responseBody = body.toString();
                            responseBody = JSON.parse(responseBody)
                            urlVideoDuration = convertSecondToHMS(responseBody[0].cropped_duration)
                            /*adding data*/
                            let dir = 'uploads/series/thumbs/';
                            var NewName = Math.round(new Date() / 1000) + User.generateToken();
                            var fileExt = videos[i].mimetype.split('/').pop();
                            // var fileExt = videos[i].name.split('.').pop();
                            var thumbfileName = NewName + '.' + fileExt;
                            const path = dir + '/' + thumbfileName
                            if (!fs.existsSync(dir)) {
                                fs.mkdirSync(dir, { recursive: true });
                            }
                            videos[i].mv(path, (error) => {
                                if (error) {
                                    res.writeHead(500, {
                                        'Content-Type': 'application/json'
                                    })
                                    res.end(JSON.stringify({ status: 'error', message: error }))
                                }
                            })
                            var thumb_file_name = thumbfileName;
                            console.log('datav------------------------',postData[i])
                            let insertData = {
                                user_id: parseInt(postData[i].user_id),
                                series_id: postData[i].series_id,
                                video_title: postData[i].video_title,
                                video_duration: urlVideoDuration,
                                video_description: postData[i].video_description,
                                content_type: postData[i].content_type,
                                video_thumb: thumb_file_name,
                                video_link: postData[i].embed_url,
                                slice_added: "yes",
                                notation_file_added: "yes",
                                video_type: (postData[i].video_type) ? postData[i].video_type : 'local',
                                list_order: await getSeriesVideoCount(parseInt(postData[i].series_id)) + 1
                            }
                            var routineVideo = await SeriesVideos.create(insertData);
                            var embed_video_link = postData[i].embed_url
                            var rest = embed_video_link.replace("https://www.soundslice.com/slices/", "");
                            var lastFirst = rest.replace("/embed", "");
                            var lastScorehash = lastFirst.replace("/", "");
                            let sliceBody = {
                                "scorehash": lastScorehash,
                                "slug": "",
                                "slug": "",
                                "slug": "",
                                "url": "",
                                "embed_url": ""

                            }
                            let sliceData = {
                                // video_id: routineVideo.id,
                                type: 'embed_url',
                                slice_info: JSON.stringify(sliceBody),
                                recording_info: JSON.stringify({ "errors": { "source_data": ["Enter a valid URL."] } }),
                                series_id: routineVideo.id
                            }
                            VideoSliceModel.create(sliceData);
                        });
                        response.on("error", function (error) {
                            return res.send({ success: false, message: error.message, data: [] });
                        });
                    });
                    var pData = qs.stringify({
                    });
                    req.write(pData);
                    req.end();
                    console.log('final duration :' + urlVideoDuration)

                }

            } else {
                logger.info('Lenght count  #### %s.', videos[i]);
                if (videos[i] && videos[i] != undefined) {
                    let dir = 'uploads/series/videos';
                    var NewName = Math.round(new Date() / 1000) + User.generateToken();
                    var fileExt = videos[i].mimetype.split('/').pop();
                    // var fileExt = videos[i].name.split('.').pop();
                    var fileName = NewName + '.' + fileExt;
                    const path = dir + '/' + fileName
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    videos[i].mv(path, (error) => {
                        if (error) {
                            res.writeHead(500, {
                                'Content-Type': 'application/json'
                            })
                            res.end(JSON.stringify({ status: 'error', message: error }))
                        }
                    })
                    var video_link = fileName


                    var videoPath = 'uploads/series/videos/' + video_link;
                    let thumbdir = 'uploads/series/thumbs/';
                    if (!fs.existsSync(thumbdir)) {
                        fs.mkdirSync(thumbdir, { recursive: true });
                    }
                    console.log(videoPath);
                    var duration = await getVideoDurationInSeconds(config.HOST + videoPath);
                    var measuredTime = new Date(null);
                    measuredTime.setSeconds(duration); // specify value of SECONDS
                    var MHSTime = measuredTime.toISOString().substr(11, 8);
                    total_duration = MHSTime;

                    const tg = await new ThumbnailGenerator({
                        sourcePath: videoPath,
                        thumbnailPath: 'uploads/series/thumbs/',
                        tmpDir: '/uploads/series/videos/thumbs/'
                    });

                    tg.generateOneByPercentCb(50, async (err, result) => {
                        video_thumb = result;
                        console.log('video_link');
                        console.log(video_link);
                        console.log('datav------------------------',postData[i])
                        let insertData = {
                            user_id: parseInt(postData[i].user_id),
                            series_id: postData[i].series_id,
                            video_title: postData[i].video_title,
                            video_duration: total_duration,
                            video_description: postData[i].video_description,
                            content_type: postData[i].content_type,
                            video_thumb: video_thumb,
                            video_link: video_link,
                            video_type: (postData[i].video_type) ? postData[i].video_type : 'local',
                            list_order: await getSeriesVideoCount(parseInt(postData[i].series_id)) + 1
                        }
                        var routineVideo = await SeriesVideos.create(insertData);
                    });
                }
            }
        }
        return res.send({ success: true, message: "Series video created successfully.", data: [] });
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.editRoutineVideo = async (req, res) => {
    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var routineVideo = await RoutineVideo.findOne({ where: { id: req.body.id } });

            if (routineVideo) {
                if (routineVideo.video_type == 'embed_url') {
                    if (req.files != null) {
                        var thumbFile = routineVideo.video_thumb.replace(config.HOST, "");
                        var filePath = 'uploads/series/thumbs' + '/' + thumbFile;
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                        var videos = req.files.thumb;
                        let dir = 'uploads/series/thumbs';
                        const path = dir + '/' + videos.name
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        videos.mv(path, (error) => {
                            if (error) {
                                res.writeHead(500, {
                                    'Content-Type': 'application/json'
                                })
                                res.end(JSON.stringify({ status: 'error', message: error }))
                            }
                        })
                        video_link = videos.name
                        let Data = {
                            video_title: req.body.video_title,
                            video_description: req.body.video_description,
                            video_duration: "00:00:00",
                            video_thumb: video_link,
                            video_link: req.body.embed_url,
                            content_type : req.body.content_type
                        }

                        await SeriesVideos.update(Data, { where: { id: req.body.id } });

                        return res.send({ success: true, message: "Artist video updated.", data: [] });
                    } else {
                        let Data = {
                            video_title: req.body.video_title,
                            video_description: req.body.video_description,
                            video_link: req.body.embed_url,
                            content_type : req.body.content_type
                        }
                        await SeriesVideos.update(Data, { where: { id: req.body.id } });
                        /// Update videoslice table data //
                        var embed_video_link = req.body.embed_url
                        var rest = embed_video_link.replace("https://www.soundslice.com/slices/", "");
                        var lastFirst = rest.replace("/embed", "");
                        var lastScorehash = lastFirst.replace("/", "");

                        var sliceBody = {
                            "scorehash": lastScorehash,
                            "slug": "",
                            "slug": "",
                            "slug": "",
                            "url": "",
                            "embed_url": ""

                        }

                        sliceData = {
                            type: 'embed_url',
                            slice_info: JSON.stringify(sliceBody),
                            recording_info: JSON.stringify({ "errors": { "source_data": ["Enter a valid URL."] } })
                        }

                        await VideoSliceModel.update(sliceData, { where: { video_id: req.body.id, routine_id: routineVideo.routine_id, type: 'embed_url' } });

                        return res.send({ success: true, message: "Artist video updated.", data: [] });
                    }
                } else {
                    if (req.files != null) {
                        var filePath = 'uploads/series/videos' + '/' + routineVideo.video_file_name;
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                        var videos = req.files.video;
                        let dir = 'uploads/series/videos';
                        const path = dir + '/' + videos.name
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        videos.mv(path, (error) => {
                            if (error) {
                                res.writeHead(500, {
                                    'Content-Type': 'application/json'
                                })
                                res.end(JSON.stringify({ status: 'error', message: error }))
                            }
                        })
                        video_link = videos.name
                        var videoPath = 'uploads/series/videos/' + video_link;
                        dir = 'uploads/series/thumbs/';
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        var duration = await getVideoDurationInSeconds(config.HOST + videoPath);
                        var measuredTime = new Date(null);
                        measuredTime.setSeconds(duration); // specify value of SECONDS
                        var MHSTime = measuredTime.toISOString().substr(11, 8);
                        total_duration = MHSTime;
                        const tg = await new ThumbnailGenerator({
                            sourcePath: videoPath,
                            thumbnailPath: 'uploads/series/thumbs/',
                            tmpDir: '/uploads/series/videos/thumbs/'
                        });

                        tg.generateOneByPercentCb(50, async (err, result) => {
                            video_thumb = result;
                            let Data = {
                                video_title: req.body.video_title,
                                video_description: req.body.video_description,
                                video_duration: total_duration,
                                video_thumb: video_thumb,
                                video_link: video_link,
                                slice_added: 'no',
                                notation_file_added: 'no',
                                content_type : req.body.content_type
                            }
                            await SeriesVideos.update(Data, { where: { id: req.body.id } });
                        });
                        return res.send({ success: true, message: "Routine video updated.", data: [] });
                    } else {
                        let data = {
                            video_title: req.body.video_title,
                            video_description: req.body.video_description,
                            content_type : req.body.content_type
                        }
                        console.log('data',data);
                        await SeriesVideos.update(data, { where: { id: req.body.id } });
                        return res.send({ success: true, message: "Routine video updated.", data: [] });
                    }
                }
            }
            res.send({ success: false, message: "Routine video not found.", data: [] });
        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.seriesVideoDetail = async (req, res) => {

    try {

        var routine = await SeriesVideos.findOne({
            where: { id: req.params.id },
            include: [
                {
                    model: db.user
                },
                {
                    model: db.series
                },
                {
                    model: db.videoSlice
                }
            ],
        });
        //console.log(routine);
        res.send({ success: true, message: "", data: routine });
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}
exports.addArtistVideo = async (req, res) => {

    try {
        var videos = [];
        var postData = [];
        var uploadedVideos = req.files;
        var thumbs = [];


        if (uploadedVideos == null) {
            console.log(uploadedVideos);
        }

        videos = ((uploadedVideos != 'null') && !Array.isArray(uploadedVideos['videos[]'])) ? [uploadedVideos['videos[]']] : uploadedVideos['videos[]'];
        postData = ((req.body != 'null') && !Array.isArray(req.body['data[]'])) ? [req.body['data[]']] : req.body['data[]'];
        var length1 = videos.length;
        var length = postData.length;
        for (let i = 0; i < length; i++) {
            postData[i] = JSON.parse(postData[i]);
            var video_thumb = '';
            //var video_link = '';
            var total_duration = '';
            //if(postData[i].embed_url !="" && postData[i].embed_url != undefined){
            if (postData[i].video_type != "" && postData[i].video_type == 'embed_url') {
                var embed_video_link = postData[i].embed_url
                var rest = embed_video_link.replace("https://www.soundslice.com/slices/", "");
                var lastFirst = rest.replace("/embed", "");
                var lastScorehash = lastFirst.replace("/", "");
                if (videos[i] && videos[i] != undefined) {

                    /*get url video duration*/
                    var urlVideoDuration;
                    var options = await getOptionValue('/api/v1/slices/' + lastScorehash + '/recordings/', 'GET');
                    var req = https.request(options, function (response) {
                        var chunks = [];
                        response.on("data", function (chunk) {
                            chunks.push(chunk);
                        });
                        response.on("end", async function (chunk) {
                            var body = Buffer.concat(chunks);
                            var responseBody = body.toString();
                            responseBody = JSON.parse(responseBody)
                            urlVideoDuration = convertSecondToHMS(responseBody[0].cropped_duration)
                            /*Insert data into table*/
                            let dir = 'uploads/artists/thumbs/';
                            var NewName = Math.round(new Date() / 1000) + User.generateToken();
                            // var fileExt = videos[i].mimetype.split('/').pop();
                            var fileExt = videos[i].name.split('.').pop();
                            var thumbfileName = NewName + '.' + fileExt;
                            const path = dir + '/' + thumbfileName
                            if (!fs.existsSync(dir)) {
                                fs.mkdirSync(dir, { recursive: true });
                            }
                            videos[i].mv(path, (error) => {
                                if (error) {
                                    res.writeHead(500, {
                                        'Content-Type': 'application/json'
                                    })
                                    res.end(JSON.stringify({ status: 'error', message: error }))
                                }
                            })
                            var thumb_video_thumb = thumbfileName;
                            let insertData = {
                                user_id: parseInt(postData[i].user_id),
                                video_title: postData[i].video_title,
                                duration: urlVideoDuration,
                                video_description: postData[i].video_description,
                                video_thumb: thumb_video_thumb,
                                video_link: postData[i].embed_url,
                                video_level: postData[i].video_level,
                                slice_added: "yes",
                                notation_file_added: "yes",
                                content_type: postData[i].content_type,
                                video_type: (postData[i].video_type) ? postData[i].video_type : 'local',
                                list_order: await getArtistVideoCount(parseInt(postData[i].user_id)) + 1
                            }
                            var routineVideo = await TeacherVideo.create(insertData);
                            var embed_video_link = postData[i].embed_url
                            var rest = embed_video_link.replace("https://www.soundslice.com/slices/", "");
                            var lastFirst = rest.replace("/embed", "");
                            var lastScorehash = lastFirst.replace("/", "");
                            var sliceBody = {
                                "scorehash": lastScorehash,
                                "slug": "",
                                "slug": "",
                                "slug": "",
                                "url": "",
                                "embed_url": ""

                            }

                            sliceData = {
                                artist_video_id: routineVideo.id,
                                type: 'embed_url',
                                slice_info: JSON.stringify(sliceBody),
                                recording_info: JSON.stringify({ "errors": { "source_data": ["Enter a valid URL."] } }),
                                artist_id: parseInt(postData[i].user_id)
                            }
                            VideoSliceModel.create(sliceData);
                        });
                        response.on("error", function (error) {
                            return res.send({ success: false, message: error.message, data: [] });
                        });
                    });
                    var pData = qs.stringify({
                    });
                    req.write(pData);
                    req.end();
                }

            } else {
                // logger.info('Lenght count  #### %s.', videos[i]);
                if (videos[i] && videos[i] != undefined) {
                    let dir = 'uploads/artists/videos';
                    var NewName = Math.round(new Date() / 1000) + User.generateToken();
                    // var fileExt = videos[i].mimetype.split('/').pop();
                    var fileExt = videos[i].name.split('.').pop();
                    var fileName = NewName + '.' + fileExt;
                    const path = dir + '/' + fileName
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    videos[i].mv(path, (error) => {
                        if (error) {
                            res.writeHead(500, {
                                'Content-Type': 'application/json'
                            })
                            res.end(JSON.stringify({ status: 'error', message: error }))
                        }
                    })
                    var video_link = fileName

                    /*if (req.body.video_url) {
                      video_link = req.body.video_url
                    }*/
                    var videoPath = 'uploads/artists/videos/' + video_link;
                    let thumbdir = 'uploads/artists/thumbs/';
                    if (!fs.existsSync(thumbdir)) {
                        fs.mkdirSync(thumbdir, { recursive: true });
                    }
                    console.log(videoPath);
                    var duration = await getVideoDurationInSeconds(config.HOST + videoPath);
                    var measuredTime = new Date(null);
                    measuredTime.setSeconds(duration); // specify value of SECONDS
                    var MHSTime = measuredTime.toISOString().substr(11, 8);
                    total_duration = MHSTime;

                    const tg = await new ThumbnailGenerator({
                        sourcePath: videoPath,
                        thumbnailPath: 'uploads/artists/thumbs/',
                        tmpDir: '/uploads/artists/videos/thumbs/'
                    });

                    tg.generateOneByPercentCb(50, async (err, result) => {
                        video_thumb = result;
                        let insertData = {
                            user_id: parseInt(postData[i].user_id),
                            video_title: postData[i].video_title,
                            duration: total_duration,
                            video_description: postData[i].video_description,
                            video_thumb: video_thumb,
                            video_link: video_link,
                            content_type: postData[i].content_type,
                            video_level: postData[i].video_level,
                            video_type: (postData[i].video_type) ? postData[i].video_type : 'local',
                            list_order: await getArtistVideoCount(parseInt(postData[i].user_id)) + 1
                        }
                        var routineVideo = await TeacherVideo.create(insertData);
                    });
                }
            }
        }
        console.log('complete')
        return res.send({ success: true, message: "Artist video created successfully.", data: [] });
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}



exports.addArtistVideoOld = async (req, res) => {

    try {

        console.log(req.body)
        var videos = [];
        var postData = [];
        var uploadedVideos = req.files;
        // console.log(req.body);
        videos = ((uploadedVideos != 'null') && !Array.isArray(uploadedVideos['videos[]'])) ? [uploadedVideos['videos[]']] : uploadedVideos['videos[]'];
        postData = ((req.body != 'null') && !Array.isArray(req.body['data[]'])) ? [req.body['data[]']] : req.body['data[]'];
        var length = videos.length;
        for (let i = 0; i < length; i++) {
            postData[i] = JSON.parse(postData[i]);
            console.log(postData[i]);
            var video_thumb = '';
            var video_link = '';
            var total_duration = '';
            if (videos[i]) {
                let dir = 'uploads/artists/videos';
                var NewName = Math.round(new Date() / 1000) + User.generateToken();
                var fileExt = videos[i].mimetype.split('/').pop();
                var fileName = NewName + '.' + fileExt;
                const path = dir + '/' + fileName

                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                videos[i].mv(path, (error) => {
                    if (error) {
                        res.writeHead(500, {
                            'Content-Type': 'application/json'
                        })
                        res.end(JSON.stringify({ status: 'error', message: error }))
                    }
                })
                video_link = fileName
            }
            if (req.body.video_url) {
                video_link = req.body.video_url
            }
            var videoPath = 'uploads/artists/videos/' + video_link;
            let dir = 'uploads/artists/thumbs/';
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            console.log(videoPath);
            // var duration = await getVideoDurationInSeconds(videoPath);

            // total_duration =  secondsToHms(duration);
            // console.log(duration)
            const tg = await new ThumbnailGenerator({
                sourcePath: videoPath,
                thumbnailPath: 'uploads/artists/thumbs/',
                tmpDir: '/uploads/artists/videos/thumbs/'
            });

            tg.generateOneByPercentCb(50, async (err, result) => {
                video_thumb = result;
                let insertData = {
                    user_id: parseInt(postData[i].user_id),
                    video_title: postData[i].video_title,
                    duration: '00:00:00',
                    video_description: postData[i].video_description,
                    video_thumb: video_thumb,
                    video_link: video_link,
                }
                var routineVideo = await TeacherVideo.create(insertData);
            });
        }
        return res.send({ success: true, message: "Artist video created successfully.", data: [] });
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.artistVideoList = async function (req, res, next) {

    //console.log(req.query)
    try {
        console.log(req.query);
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            let whereCondition = {
                user_id: req.query.user_id
            }
            if (req.query.search) {
                whereCondition = {
                    [Op.and]: [
                        { user_id: req.query.user_id },
                        {
                            video_title: {
                                [Op.like]: '%' + req.query.search + '%'
                            }
                        }
                    ]
                }
            }
            let limit = 50
            let offset = 0 + (req.query.page - 1) * limit
            let routineVideoList = await TeacherVideo.findAndCountAll({
                where: whereCondition,
                limit: limit,
                offset: offset,
                include: [{
                    model: db.user,
                    include: [
                        {
                            model: db.routineFolder,
                        }
                    ]
                }],
                order: [['list_order', 'ASC']]
            }
            );
            routineVideoList['rows'] = routineVideoList['rows'];
            routineVideoList['currentPage'] = req.query.page;
            routineVideoList['totalPages'] = Math.ceil(routineVideoList['count'] / limit);
            res.send({ success: true, message: "", data: routineVideoList });
        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}
exports.createVideoSliceRecordong = async (req, res) => {

    var video = await RoutineVideo.findOne({
        where: { id: req.body.video_id },
        include: [{
            model: db.videoSlice
        },
        {
            model: db.user
        },
        {
            model: db.routine,
            include: [
                {
                    model: db.routineFolder
                }
            ]
        }
        ],
    });
    logger.info('video Details  #### %s.', JSON.stringify(video));
    var videoPath = video.video_link;
    logger.info('videoPath %s%', videoPath);
    var artist = video.user.fullname;
    var routineFolder = video.routine.routineFolder;
    var recordingName = video.video_title;

    // var slug = video.videoSlouse.slice_info.slug;
    if (video.video_type == 'local') {
        source = 3
    } else if (video.video_type == 'video') {
        source = 3
    } else if (video.video_type == 'embed_url') {
        source = 1
    } else if (video.video_type == 'youtube') {
        source = 1
    }

    if (video.video_type == 'local') {
        source_data = videoPath;
    } else if (video.video_type == 'video') {
        source_data = videoPath
    } else if (video.video_type == 'embed_url') {
        source_data = video.video_link
    } else if (video.video_type == 'youtube') {
        source_data = video.video_link
    }
    //console.log(source_data);
    var sliceData;
    var options = await getOptionValue('/api/v1/scores/', 'POST');
    /** create slice */
    var apiReq = https.request(options, function (response) {
        var chunks = [];
        response.on("data", function (chunk) {
            chunks.push(chunk);
            logger.info('chunk data %s%', JSON.stringify(chunk));
        });

        response.on("end", async function (chunk) {
            var sliceBody = Buffer.concat(chunks);
            sliceinfo = JSON.parse(sliceBody.toString());

            /** slice recording */
            var recordingOptions = await getOptionValue('/api/v1/scores/' + sliceinfo.slug + '/recordings/', 'POST');
            var recordingReq = https.request(recordingOptions, function (recordingResponse) {
                var chunks = [];

                recordingResponse.on("data", function (chunk) {
                    chunks.push(chunk);
                });
                recordingResponse.on("end", function (chunk) {
                    var body = Buffer.concat(chunks);
                    //console.log(body.toString());
                    logger.info('recording info %s%', JSON.stringify(body));
                    sliceData = {
                        video_id: video.id,
                        type: 'routine',
                        slice_info: sliceBody,
                        recording_info: body,
                        routine_id: video.routine_id
                    }
                    VideoSliceModel.destroy({ where: { video_id: video.id, routine_id: video.routine_id } });
                    VideoSliceModel.create(sliceData);
                    RoutineVideo.update({ slice_added: 'yes' }, { where: { id: req.body.video_id } });
                    res.send({ success: true, message: "Slice created successfully", data: JSON.parse(body) });
                });

                recordingResponse.on("error", function (error) {
                    return res.send({ success: false, message: error.message, data: [] });
                });
            });
            var postData = qs.stringify({
                'name': recordingName,
                'source': source,
                'source_data': source_data
            });
            recordingReq.write(postData);
            recordingReq.end();
            /**end recording */
        });
        response.on("error", function (error) {
            return res.send({ success: false, message: error.message, data: [] });
        });
    });
    var postData = qs.stringify({
        'name': video.video_title,
        'artist': artist,
        'embed_status': '4',
        'print_status': '3',
        'status': '3',
        'folder_id': req.body.folder_id
    });
    apiReq.write(postData);
    apiReq.end();
    /** end slice */

}

// create artist video slice 

exports.createArtistVideoSliceRecordong = async (req, res) => {

    var video = await TeacherVideo.findOne({
        where: { id: req.body.video_id },
        include: [{
            model: db.videoSlice
        },
        {
            model: db.user,
            include: [
                {
                    model: db.routineFolder
                }
            ]
        }
        ],
    });
    logger.info('video Details  #### %s.', JSON.stringify(video));
    var videoPath = video.video_link;
    logger.info('videoPath %s%', videoPath);
    var artist = video.user.fullname;
    var routineFolder = video.user.routineFolder;
    var recordingName = video.video_title;

    // var slug = video.videoSlouse.slice_info.slug;
    if (video.video_type == 'local') {
        source = 3
    } else if (video.video_type == 'video') {
        source = 3
    } else if (video.video_type == 'embed_url') {
        source = 1
    } else if (video.video_type == 'youtube') {
        source = 1
    }

    if (video.video_type == 'local') {
        source_data = videoPath;
    } else if (video.video_type == 'video') {
        source_data = videoPath
    } else if (video.video_type == 'embed_url') {
        source_data = video.video_link
    } else if (video.video_type == 'youtube') {
        source_data = video.video_link
    }
    //console.log(source_data);
    var sliceData;
    var options = await getOptionValue('/api/v1/scores/', 'POST');
    /** create slice */
    var apiReq = https.request(options, function (response) {
        var chunks = [];
        response.on("data", function (chunk) {
            chunks.push(chunk);
            logger.info('chunk data %s%', JSON.stringify(chunk));
        });

        response.on("end", async function (chunk) {
            var sliceBody = Buffer.concat(chunks);
            sliceinfo = JSON.parse(sliceBody.toString());

            /** slice recording */
            var recordingOptions = await getOptionValue('/api/v1/scores/' + sliceinfo.slug + '/recordings/', 'POST');
            var recordingReq = https.request(recordingOptions, function (recordingResponse) {
                var chunks = [];

                recordingResponse.on("data", function (chunk) {
                    chunks.push(chunk);
                });
                recordingResponse.on("end", function (chunk) {
                    var body = Buffer.concat(chunks);
                    //console.log(body.toString());
                    logger.info('recording info %s%', JSON.stringify(body));
                    sliceData = {
                        artist_video_id: video.id,
                        type: 'normal',
                        slice_info: sliceBody,
                        recording_info: body,
                        artist_id: video.user.id
                    }
                    //console.log(sliceData);
                    VideoSliceModel.destroy({ where: { artist_video_id: video.id, artist_id: video.user.id } });
                    VideoSliceModel.create(sliceData);
                    TeacherVideo.update({ slice_added: 'yes' }, { where: { id: req.body.video_id } });
                    res.send({ success: true, message: "Slice created successfully", data: JSON.parse(body) });
                });

                recordingResponse.on("error", function (error) {
                    return res.send({ success: false, message: error.message, data: [] });
                });
            });
            var postData = qs.stringify({
                'name': recordingName,
                'source': source,
                'source_data': source_data
            });
            recordingReq.write(postData);
            recordingReq.end();
            /**end recording */
        });
        response.on("error", function (error) {
            return res.send({ success: false, message: error.message, data: [] });
        });
    });
    var postData = qs.stringify({
        'name': video.video_title,
        'artist': artist,
        'embed_status': '4',
        'print_status': '3',
        'status': '3',
        'folder_id': req.body.folder_id
    });
    apiReq.write(postData);
    apiReq.end();
    /** end slice */

}


exports.addSliceNotation = async function (req1, res, next) {

    try {

        var video = await RoutineVideo.findOne({
            where: { id: req1.body.video_id },
            include: [{
                model: db.videoSlice
            },
            {
                model: db.user
            },
            {
                model: db.routine,
                include: [
                    {
                        model: db.routineFolder
                    }
                ]
            }
            ],
        });
        if (video) {
            var slug = video.videoSlouse.slice_info.slug;
            var notation_file = req1.files.notation_file;
            var file_name;
            if (notation_file) {
                let dir = 'uploads/notations';
                const path = dir + '/' + notation_file.name
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                notation_file.mv(path, (error) => {
                    if (error) {
                        res.writeHead(500, {
                            'Content-Type': 'application/json'
                        })
                        res.end(JSON.stringify({ status: 'error', message: error }))
                    }
                })
                file_name = notation_file.name
            }

            var options = {
                'method': 'POST',
                'hostname': 'www.soundslice.com',
                'path': '/api/v1/scores/' + slug + '/notation/',
                'headers': {
                    'Authorization': 'Basic c2JFclNrenFtUkNCRUZxWVBrR2NOTklXdlJWd0lIY0Q6eTlrUGVhOlJmJnEyelh1QXMqXFF0Ji9+TVUyXEpSU1Q=',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                'maxRedirects': 20
            };

            var req = https.request(options, function (response) {
                var chunks = [];
                response.on("data", function (chunk) {
                    chunks.push(chunk);
                });
                response.on("end", function (chunk) {
                    var body = Buffer.concat(chunks);
                    var bodyInfo = JSON.parse(body)
                    var URL = bodyInfo.url;
                    request({
                        url: URL,
                        method: 'PUT',
                        headers: {
                        },
                        body: fs.readFileSync('uploads/notations/' + file_name).toString()
                    }, (error, response, body1) => {
                        if (error) {
                            console.log('Error sending message: ', error)
                        } else {
                            console.log(response.body);
                            console.log('Response: ', response.body.toString())
                        }
                        RoutineVideo.update({ notation_file_added: 'yes' }, { where: { id: req1.body.video_id } });
                        return res.send({ success: true, message: "Slice notatation added.", data: JSON.parse(body) });
                    })
                });
                response.on("error", function (error) {
                    console.error(error);
                });
            });
            var postData = qs.stringify({

            });
            req.write(postData);
            req.end();
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

// add notation for artist video 

exports.addArtistVideoSliceNotation = async function (req1, res, next) {

    try {

        var video = await TeacherVideo.findOne({
            where: { id: req1.body.video_id },
            include: [{
                model: db.videoSlice
            },
            {
                model: db.user,
                include: [
                    {
                        model: db.routineFolder
                    }
                ]
            }
            ],
        });


        if (video) {
            var slug = video.videoSlouse.slice_info.slug;
            var notation_file = req1.files.notation_file;
            var file_name;
            if (notation_file) {
                let dir = 'uploads/notations';
                const path = dir + '/' + notation_file.name
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                notation_file.mv(path, (error) => {
                    if (error) {
                        res.writeHead(500, {
                            'Content-Type': 'application/json'
                        })
                        res.end(JSON.stringify({ status: 'error', message: error }))
                    }
                })
                file_name = notation_file.name
            }

            var options = {
                'method': 'POST',
                'hostname': 'www.soundslice.com',
                'path': '/api/v1/scores/' + slug + '/notation/',
                'headers': {
                    'Authorization': 'Basic c2JFclNrenFtUkNCRUZxWVBrR2NOTklXdlJWd0lIY0Q6eTlrUGVhOlJmJnEyelh1QXMqXFF0Ji9+TVUyXEpSU1Q=',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                'maxRedirects': 20
            };

            var req = https.request(options, function (response) {
                var chunks = [];
                response.on("data", function (chunk) {
                    chunks.push(chunk);
                });
                response.on("end", function (chunk) {
                    var body = Buffer.concat(chunks);
                    var bodyInfo = JSON.parse(body)
                    var URL = bodyInfo.url;
                    request({
                        url: URL,
                        method: 'PUT',
                        headers: {
                        },
                        body: fs.readFileSync('uploads/notations/' + file_name).toString()
                    }, (error, response, body1) => {
                        if (error) {
                            console.log('Error sending message: ', error)
                        } else {
                            console.log(response.body);
                            console.log('Response: ', response.body.toString())
                        }
                        TeacherVideo.update({ notation_file_added: 'yes' }, { where: { id: req1.body.video_id } });
                        return res.send({ success: true, message: "Slice notatation added.", data: JSON.parse(body) });
                    })
                });
                response.on("error", function (error) {
                    console.error(error);
                });
            });
            var postData = qs.stringify({

            });
            req.write(postData);
            req.end();
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}


exports.addTeacherOld = async (req, res) => {
    let token = await User.getToken(req);
    let isValidToekn = await validateToekn(token);
    if (isValidToekn) {
        var fileName = '';
        var imageFile = typeof req.files.profile !== "undefined" ? req.files.profile.name : "";
        if (imageFile != "") {
            const image = req.files.profile
            let dir = 'uploads/profile';
            const path = dir + '/' + image.name
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            image.mv(path, (error) => {
                if (error) {
                    res.writeHead(500, {
                        'Content-Type': 'application/json'
                    })
                    res.end(JSON.stringify({ status: 'error', message: error }))
                }
            })
            fileName = image.name
        }
        let userData = {
            fullname: req.body.fullname,
            profile: fileName,
            role_id: 3
        }
        var userObj = await User.create(userData);
        let profileData = {
            user_id: userObj.id,
            profession: req.body.profession,
            history: req.body.history,
            career_highlight: req.body.career_highlight,
            key_point: req.body.key_point,
            performance: req.body.performance,
            address: req.body.address
        }
        await UserProfile.create(profileData);
        res.send({ success: true, message: "Teacher added successfully.", data: [] });
    } else {
        res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
    }
}


exports.addTeacher = async (req, res) => {

    let token = await User.getToken(req);
    let isValidToekn = await validateToekn(token);
    if (isValidToekn) {
        var fileName = '';
        var imageFile = typeof req.files.profile !== "undefined" ? req.files.profile.name : "";
        if (imageFile != "") {
            const image = req.files.profile
            let dir = 'uploads/profile';
            const path = dir + '/' + image.name
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            image.mv(path, (error) => {
                if (error) {
                    res.writeHead(500, {
                        'Content-Type': 'application/json'
                    })
                    res.end(JSON.stringify({ status: 'error', message: error }))
                }
            })
            fileName = image.name
        }
        let userData = {
            fullname: req.body.fullname,
            profile: fileName,
            role_id: 3
        }
        var userObj = await User.create(userData);
        let profileData = {
            user_id: userObj.id,
            profession: req.body.profession,
            history: req.body.history,
            career_highlight: req.body.career_highlight,
            key_point: req.body.key_point,
            performance: req.body.performance,
            address: req.body.address,
            list_order: await getAllArtistCount() + 1
        }
        await UserProfile.create(profileData);

        /* create artist folder */
        var sliceFolderName = req.body.fullname + new Date().toLocaleDateString();
        var options = await getOptionValue('/api/v1/folders/', 'POST');
        var requset = https.request(options, function (response) {
            var chunks = [];
            response.on("data", function (chunk) {
                chunks.push(chunk);
            });
            response.on("end", function (chunk) {
                var body = Buffer.concat(chunks);
                var routineFolder = {
                    type: 'normal',
                    folder_info: body,
                    artist_id: userObj.id
                }
                console.log(routineFolder);
                RoutineFolder.create(routineFolder);
            });
            response.on("error", function (error) {
                console.error(error);
            });
        });
        var postData = qs.stringify({
            'name': sliceFolderName,
        });
        requset.write(postData);
        requset.end();

        /*create artist emoji*/
        var emojis = JSON.parse(req.body['emojis[]']);
        var length = emojis.length;
        var teacherProfile = await TeacherPrfile.findOne({ where: { user_id: userObj.id } });
        for (let i = 0; i < length; i++) {
            let emojiData = {
                user_id: userObj.id,
                emoji: emojis[i],
                teacher_profile_id: teacherProfile.id
            }
            await UserEmoji.create(emojiData);
        }

        res.send({ success: true, message: "Artist added successfully.", data: [] });
    } else {
        res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
    }
}

exports.updateAdminProfile = async (req, res) => {

    try {

        let token = await User.getToken(req);


        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var admin = await User.findOne(
                {
                    where: { id: req.body.id }
                });

            var fileName;
            if (req.files != null) {
                const image = req.files.profile
                let dir = 'uploads/profile';
                const path = dir + '/' + image.name
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                image.mv(path, (error) => {
                    if (error) {
                        res.writeHead(500, {
                            'Content-Type': 'application/json'
                        })
                        res.end(JSON.stringify({ status: 'error', message: error }))
                    }
                })
                fileName = image.name
            }

            if (admin) {
                var data;
                if (fileName) {
                    data = {
                        fullname: req.body.fullname,
                        profile: fileName,
                        email: req.body.email
                    }
                } else {
                    data = {
                        fullname: req.body.fullname,
                        email: req.body.email
                    }
                }
                await User.update(data, { where: { id: req.body.id } });
                var updatedAdmin = await User.findOne(
                    {
                        where: { id: req.body.id }
                    });
                res.send({ success: true, message: "Profile updated successfully.", data: updatedAdmin });
            } else {
                res.send({ success: false, message: "Blog not found.", data: [] });
            }
        } else {
            res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.checkAdminCurrentPass = async (req, res) => {
    let token = await User.getToken(req);
    var loginId = await getLoginUserId(token);
    let user = await User.findOne({ where: { id: loginId } });
    if (user) {
        await bcrypt.compare(req.body.current_password, user.password, function (err, isMatch) {
            if (err) {
                res.status(500).send({
                    'success': false, message: err.message
                });
            }
            if (!isMatch) {
                res.send({ 'success': false, message: "Current password doesn't match." });
            } else {
                res.send({ 'success': true, message: '', 'data': [] });
            }
        });
    }
}

exports.editTeacher = async (req, res) => {

    // try {

    let token = await User.getToken(req);


    let isValidToekn = await validateToekn(token);
    if (isValidToekn) {
        var teacher = await User.findOne(
            {
                where: { id: req.body.id },
                include: [
                    {
                        model: db.routineFolder
                    },
                    {
                        model: db.teacherProfile
                    }
                ],
            });
        if (teacher.role_id == 3) {
            var folderId = teacher.routineFolder.folder_info.id;
        } else {
            var folderId = "";
        }

        var fileName;
        if (req.files != null) {
            const image = req.files.profile
            let dir = 'uploads/profile';
            const path = dir + '/' + image.name
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            image.mv(path, (error) => {
                if (error) {
                    res.writeHead(500, {
                        'Content-Type': 'application/json'
                    })
                    res.end(JSON.stringify({ status: 'error', message: error }))
                }
            })
            fileName = image.name
        }
        console.log("file:" + fileName);
        if (teacher) {
            let data = {
                fullname: req.body.fullname,
                profile: fileName,
                email: req.body.email
            }

            await User.update(data, { where: { id: req.body.id } });

            let profileData = {
                user_id: teacher.id,
                profession: req.body.profession,
                history: req.body.history,
                career_highlight: req.body.career_highlight,
                key_point: req.body.key_point,
                performance: req.body.performance,
                address: req.body.address
            }
            await UserProfile.update(profileData, { where: { user_id: teacher.id } });
            /*update emoji*/

            if (req.body['emojis[]']) {
                await UserEmoji.destroy({ where: { user_id: teacher.id } });
                var emojis = JSON.parse(req.body['emojis[]']);
                var length = emojis.length;
                for (let i = 0; i < length; i++) {
                    let emojiData = {
                        teacher_profile_id: teacher.teacherProfile.id,
                        user_id: teacher.id,
                        emoji: emojis[i],
                    }
                    await UserEmoji.create(emojiData);
                }
            }

            /*update artist folder name */
            if (folderId != "") {
                if (teacher.fullname != req.body.fullname) {
                    var options = await getOptionValue('/api/v1/folders/' + folderId + '/', 'POST');
                    var requset = https.request(options, function (response) {
                        var chunks = [];
                        response.on("data", function (chunk) {
                            chunks.push(chunk);
                        });
                        response.on("end", function (chunk) {
                            var body = Buffer.concat(chunks);
                            // console.log(JSON.parse(body))
                        });
                        response.on("error", function (error) {
                            console.error(error);
                        });
                    });
                    var postData = qs.stringify({
                        'name': req.body.fullname,
                    });
                    requset.write(postData);
                    requset.end();
                }
            }


            res.send({ success: true, message: "Artist profile updated successfully.", data: [] });
        } else {
            res.send({ success: false, message: "Blog not found.", data: [] });
        }
    } else {
        res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
    }
    // } catch (e) {
    //     res.send({ success: false, message: e.message, data: [] });
    // }
}

// exports.blogList = async (req, res) => {
//     let token = await User.getToken(req);
//     let isValidToekn = await validateToekn(token);
//     if (isValidToekn) {
//         let where = {
//             status: 'active'
//         }
//         console.log(req.query)
//         if (req.query.search) {
//             console.log('innnn')
//             where = {
//                 [Op.and]: [
//                     { status: 'active' },
//                     {
//                         title: {
//                             [Op.like]: '%' + req.query.search + '%'
//                         }
//                     }
//                 ]
//             }
//         }
//         let blogList = await Blog.findAll({ where: where });
//         res.send({ success: true, message: "", data: blogList });
//     } else {
//         res.send({ success: false, message: "Invalid token", data: [] });
//     }

// };

exports.blogList = async (req, res) => {
    let token = await User.getToken(req);
    let isValidToekn = await validateToekn(token);
    if (isValidToekn) {
        let whereCondition = {
            status: 'active'
        }
        if (req.query.search) {
            whereCondition = {
                [Op.and]: [
                    { status: 'active' },
                    {
                        title: {
                            [Op.like]: '%' + req.query.search + '%'
                        }
                    }
                ]
            }
        }
        var All = [];
        let limit = 50
        let offset = 0 + (req.query.page - 1) * limit
        let blogList = await Blog.findAndCountAll({
            where: whereCondition,
            // limit: limit,
            // offset: offset,
            order: [['list_order', 'ASC']]
        });
        for (const row of blogList['rows']) {
            var obj = Object.assign({}, row.get());
            // obj.description = obj.description.replace(/<\/?[^>]+(>|$)/g, "");
            All.push(obj);
        }
        if (blogList) {
            blogList['rows'] = All;
            blogList['currentPage'] = req.query.page;
            blogList['totalPages'] = Math.ceil(blogList['count'] / limit);
        }
        res.send({ success: true, message: "", data: blogList });
    } else {
        res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
    }
};

exports.commonList = async (req, res) => {
    console.log(req.query)
    let token = await User.getToken(req);
    let isValidToekn = await validateToekn(token);
    if (isValidToekn) {
        var whereCondition = {
            status: 'active'
        }
        var model;
        let limit = 50
        let offset = 0 + (req.query.page - 1) * limit
        var list;
        if (req.query.model == 'blog') {
            list = await Blog.findAndCountAll({
                where: whereCondition,
                limit: limit,
                offset: offset,
                order: [['list_order', 'ASC']]
            });
        } else if (req.query.model == 'artist') {
            let whereCondition = {
                [Op.and]: [
                    { role_id: 3 },
                    { status: 'active' }
                ]
            }
            list = await User.findAndCountAll({
                where: whereCondition,
                include: [{
                    model: db.teacherProfile
                }
                ],
                limit: limit,
                offset: offset,
                order: [['teacherProfile', 'list_order', 'ASC']]
            });
        } else if (req.query.model == 'artist_video') {
            let whereCondition = {
                [Op.and]: [
                    { user_id: req.query.user_id },
                ]
            }
            list = await TeacherVideo.findAndCountAll({
                where: whereCondition,
                limit: limit,
                offset: offset,
                order: [['list_order', 'ASC']]
            });
        } else if (req.query.model == 'routine_video') {
            let whereCondition = {
                [Op.and]: [
                    { routine_id: req.query.routine_id },
                ]
            }
            list = await RoutineVideo.findAndCountAll({
                where: whereCondition,
                limit: limit,
                offset: offset,
                order: [['list_order', 'ASC']]
            });
        }else if(req.query.model == 'series_video'){
            let whereCondition = {
                [Op.and]: [
                    { series_id: req.query.series_id },
                ]
            }
            list = await SeriesVideo.findAndCountAll({
                where: whereCondition,
                limit: limit,
                offset: offset,
                order: [['list_order', 'ASC']]
            });
        }
        if (list) {
            list['rows'] = list['rows'];
            list['currentPage'] = req.query.page;
            list['totalPages'] = Math.ceil(list['count'] / limit);
        }
        res.send({ success: true, message: "", data: list });
    } else {
        res.send({ success: false, message: "Invalid token", data: [] });
    }
};

exports.updateOfList = async (req, res) => {

    let token = await User.getToken(req);
    let isValidToekn = await validateToekn(token);
    if (isValidToekn) {

        var model;
        if (req.body.model == 'blog') {
            model = Blog;
        } else if (req.body.model == 'teacherProfile') {
            model = TeacherPrfile;
        } else if (req.body.model == 'artist_video') {
            model = TeacherVideo;
        } else if (req.body.model == 'routine_video') {
            model = RoutineVideo;
        }else if (req.body.model == 'series_video') {
            model = SeriesVideo;
        }
        // console.log(req.body)
        var newRecoreArray = ((req.body != 'null') && !Array.isArray(req.body['data[]'])) ? [req.body['data[]']] : req.body['data[]'];
        newRecoreArray = JSON.parse(newRecoreArray[0]);
        for (let i = 0; i < newRecoreArray.length; i++) {
            var order = (i + 1) + (50 * (req.body.page - 1));
            let data = {
                list_order: order,
            }
            var Id;
            var whereCon;
            if (req.body.model == 'blog') {
                Id = newRecoreArray[i].id;
                whereCon = {
                    id: Id
                }
            }
            else if (req.body.model == 'teacherProfile') {
                Id = newRecoreArray[i].teacherProfile.id;
                whereCon = {
                    id: Id
                }
            } else if (req.body.model == 'artist_video') {
                Id = newRecoreArray[i].id;
                whereCon = {
                    id: Id,
                    user_id: req.body.user_id
                }
            } else if (req.body.model == 'routine_video') {
                Id = newRecoreArray[i].id;
                whereCon = {
                    id: Id,
                    routine_id: req.body.routine_id
                }
            }else if (req.body.model == 'series_video') {
                Id = newRecoreArray[i].id;
                whereCon = {
                    id: Id,
                    series_id: req.body.series_id
                }
            }
            await model.update(data, { where: whereCon });
        }


        res.send({ success: true, message: "Order updated successfully", data: [] });
    } else {
        res.send({ success: false, message: "Invalid token", data: [] });
    }
};

let updateValue = async (model, data, id) => {
    let obj = await model.update(data, { where: { id: id } });
    if (obj) {
        return true;
    }
    return false;
}

exports.savedVideoList = async function (req, res, next) {

    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            let loginId = await getLoginUserId(token);

            let limit = 50
            let offset = 0 + (req.query.page - 1) * limit
            let userVideoList = await UserSavedRoutine.findAndCountAll({
                where: {
                    user_id: loginId
                },
                limit: limit,
                offset: offset,
                include: [{
                    model: db.routine
                }
                ],
                order: [['id', 'DESC']]
            }
            );
            console.log(userVideoList);
            userVideoList['rows'] = userVideoList['rows'];
            userVideoList['currentPage'] = req.query.page;
            userVideoList['totalPages'] = Math.ceil(userVideoList['count'] / limit);
            res.send({ success: true, message: "", data: userVideoList });
        } else {
            res.send({ success: false, message: "Invalid token", data: [] });
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.teacherList = async function (req, res, next) {

    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var All = [];
            let search = {
                role_id: 3
            }
            if (req.query.search) {
                search = {
                    [Op.and]: [
                        { role_id: 3 },
                        {
                            title: {
                                [Op.like]: '%' + req.query.search + '%'
                            }
                        }
                    ]

                }
            }
            let limit = 50
            let offset = 0 + (req.query.page - 1) * limit
            let teacherList = await User.findAndCountAll({
                where: search,
                limit: limit,
                offset: offset,
                order: [['id', 'DESC']]
            }
            );
            for (const row of teacherList['rows']) {
                var obj = Object.assign({}, row.get());
                obj.routine_count = await getRoutineCount(obj.id);
                obj.video_count = await getVideoCount(obj.id);
                All.push(obj);

            }
            teacherList['rows'] = All;
            teacherList['currentPage'] = req.query.page;
            teacherList['totalPages'] = Math.ceil(teacherList['count'] / limit);
            res.send({ success: true, message: "", data: teacherList });
        } else {
            res.send({ success: false, message: "Invalid token", data: [] });
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.routineVideoList = async function (req, res, next) {

    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            let limit = 50
            let offset = 0 + (req.query.page - 1) * limit
            let routineVideoList = await RoutineVideo.findAndCountAll({
                where: {
                    routine_id: req.query.routine_id
                },
                limit: limit,
                offset: offset,
                order: [['id', 'DESC']]
            }
            );
            routineVideoList['rows'] = routineVideoList['rows'];
            routineVideoList['currentPage'] = req.query.page;
            routineVideoList['totalPages'] = Math.ceil(routineVideoList['count'] / limit);
            res.send({ success: true, message: "", data: routineVideoList });
        } else {
            res.send({ success: false, message: "Invalid token", data: [] });
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.getEmojis = async function (req, res, next) {
    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            let emojiImage = await EmojiImage.findAll();
            res.send({ success: true, message: "Invalid token", data: emojiImage });
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.teacherDetail = async function (req, res, next) {

    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var result;
            var All = [];
            if (req.query.type == 'profile') {
                result = await TeacherPrfile.findOne({
                    where: { user_id: req.query.teacher_id }
                }
                );
                let emojis = await UserEmoji.findAll({ where: { user_id: req.query.teacher_id } });
                result['emojis'] = emojis;
            }

            let limit = 50
            let offset = 0 + (req.query.page - 1) * limit
            if (req.query.type == 'video') {
                result = await RoutineVideo.findAndCountAll({
                    where: {
                        [Op.and]: [{ user_id: req.query.teacher_id }]
                    },
                    limit: limit,
                    offset: offset,
                    order: [['id', 'DESC']]
                }
                );
                result['rows'] = result['rows'];
                result['currentPage'] = req.query.page;
                result['totalPages'] = Math.ceil(result['count'] / limit);
            }
            if (req.query.type == 'routine') {
                result = await Routine.findAndCountAll({
                    where: {
                        [Op.and]: [{ user_id: req.query.teacher_id }]
                    },
                    limit: limit,
                    offset: offset,
                    order: [['id', 'DESC']]
                }
                );
                for (const row of result['rows']) {
                    var obj = Object.assign({}, row.get());
                    obj.total_duration = await getTotalRoutineDuration(obj.id);
                    All.push(obj);

                }
                result['rows'] = All;
                result['currentPage'] = req.query.page;
                result['totalPages'] = Math.ceil(result['count'] / limit);
            }
            res.send({ success: true, message: "", data: result });
        } else {
            res.send({ success: false, message: "Invalid token", data: [] });
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.saveUnsaveRoutine = async function (req, res, next) {

    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            let user_id = await getLoginUserId(token);

            if (req.body.type == 'save') {
                let data = {
                    user_id: user_id,
                    routine_id: req.body.routine_id
                }
                console.log('innnn');
                await UserSavedRoutine.create(data);
            } else {
                await UserSavedRoutine.destroy({ where: { routine_id: req.body.routine_id, user_id: user_id } });
            }
            var message;
            if (req.body.type == 'save') {
                message = 'Routine saved successfully.'
            } else {
                message = 'Routine unsaved successfully.'
            }
            res.send({ success: true, message: message, data: [] });
        } else {
            res.send({ success: false, message: message, data: [] });
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.getSettings = async function (req, res, next) {

    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            let settings = await Setting.findAll();
            res.send({ success: true, message: '', data: settings });
        } else {
            res.send({ success: false, message: message, data: [] });
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}
exports.updateSettings = async function (req, res, next) {

    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            postData = ((req.body != 'null') && !Array.isArray(req.body['settings[]'])) ? [req.body['settings[]']] : req.body['settings[]'];
            postData = JSON.parse(postData);
            console.log(postData)
            var length = postData.length;
            for (let i = 0; i < length; i++) {
                let data = {
                    value: postData[i].value
                }
                await Setting.update(data, { where: { key_value: postData[i].key } });
            }
            res.send({ success: true, message: 'Setting update successfully.', data: [] });
        } else {
            res.send({ success: false, message: message, data: [] });
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}


exports.deleteSliceFolder = async function (req, res, next) {


    try {
        var folderId = req.params.folder_id;
        var options = {
            'method': 'DELETE',
            'hostname': 'www.soundslice.com',
            'path': '/api/v1/folders/' + folderId,
            'headers': {
                'Authorization': 'Basic c2JFclNrenFtUkNCRUZxWVBrR2NOTklXdlJWd0lIY0Q6eTlrUGVhOlJmJnEyelh1QXMqXFF0Ji9+TVUyXEpSU1Q=',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            'maxRedirects': 20
        };

        var req = https.request(options, function (response) {
            var chunks = [];

            response.on("data", function (chunk) {
                chunks.push(chunk);
            });

            response.on("end", function (chunk) {
                var body = Buffer.concat(chunks);
                console.log(body.toString());
                res.send({ success: true, message: "Folder deleted successfully.", data: JSON.parse(body) });
            });
            response.on("error", function (error) {
                console.error(error);
            });
        });
        var postData = qs.stringify({
        });
        req.write(postData);
        req.end();

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.deleteSlice = async function (req, res, next) {

    try {
        var slugId = req.params.slug;
        var options = {
            'method': 'DELETE',
            'hostname': 'www.soundslice.com',
            'path': '/api/v1/scores/' + slugId,
            'headers': {
                'Authorization': 'Basic c2JFclNrenFtUkNCRUZxWVBrR2NOTklXdlJWd0lIY0Q6eTlrUGVhOlJmJnEyelh1QXMqXFF0Ji9+TVUyXEpSU1Q=',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            'maxRedirects': 20
        };

        var req = https.request(options, function (response) {
            var chunks = [];

            response.on("data", function (chunk) {
                chunks.push(chunk);
            });

            response.on("end", function (chunk) {
                var body = Buffer.concat(chunks);
                console.log(body.toString());
                res.send({ success: true, message: "Slice deleted successfully.", data: JSON.parse(body) });
            });
            response.on("error", function (error) {
                console.error(error);
            });
        });
        var postData = qs.stringify({
        });
        req.write(postData);
        req.end();

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.getSliceNotation = async function (req, res, next) {

    var slug = req.params.slug;
    var options = {
        'method': 'GET',
        'url': 'https://www.soundslice.com/api/v1/scores/' + slug + '/notation',
        'headers': {
            'Accept': 'application/json',
            'Authorization': 'Basic c2JFclNrenFtUkNCRUZxWVBrR2NOTklXdlJWd0lIY0Q6eTlrUGVhOlJmJnEyelh1QXMqXFF0Ji9+TVUyXEpSU1Q=',
        },

    };
    request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
        res.send({ success: true, message: "", data: JSON.parse(response.body) });
    });
}

exports.dashboardCount = async function (req, res, next) {

    try {
        var result = {};
        result['artist_count'] = await getTotalArtist();
        result['user_count'] = await getTotalUser();
        result['video_count'] = await getTotalVideoCount();
        result['routine_count'] = await getTotalRoutineCount();

        res.send({ success: true, message: "", data: result });
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}


let getOptionValue = async (path, method) => {
    let data = {
        'method': method,
        'hostname': config.SOUNDSLICE_URL,
        'path': path,
        'headers': {
            'Authorization': config.SOUNDSLICE_AUTH,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        'maxRedirects': 20
    }
    return data;
}

let getTotalArtist = async () => {
    return await User.count({ where: { role_id: 3 } });
}


let getAllArtistCount = async () => {
    return await User.count({ where: { role_id: 3 } });
}

let getAllBlogCount = async () => {
    return await Blog.count();
}

let getArtistVideoCount = async (userId) => {
    return await TeacherVideo.count({ where: { user_id: userId } });
}
let getRoutineVideoCount = async (routineId) => {
    return await RoutineVideo.count({ where: { routine_id: routineId } });
}

let getSeriesVideoCount = async (seriesId) =>{
    return await SeriesVideo.count({ where: { series_id: seriesId } });
}

let getTotalUser = async () => {
    return await User.count({ where: { role_id: 2 } });
}

let getTotalVideoCount = async () => {
    return await RoutineVideo.count();
}

let getTotalRoutineCount = async () => {
    return await Routine.count();
}
let getRoutineCount = async (teacherId) => {
    return await Routine.count({ where: { user_id: teacherId } });
}


let getVideoCount = async (teacherId) => {
    return await RoutineVideo.count({ where: { routine_id: teacherId } });
}

// let getSeriesVideoCount = async (teacherId) => {
//     return await SeriesVideo.count({ where: { series_id: teacherId } });
// }

let getNormalVideoCount = async (teacherId) => {
    return await TeacherVideo.count({ where: { user_id: teacherId } });
}

let getTotalRoutineDuration = async (routineId) => {
    let videos = await RoutineVideo.findAll({ where: { routine_id: routineId } });
    if (videos) {
        var times = [0, 0, 0]
        var max = times.length;
        // store time values
        var hoursum = 0;
        var mintsum = 0;
        var secondsum = 0;
        for (var j = 0; j < videos.length; j++) {
            var duration = (videos[j].video_duration || '').split(':');
            hoursum = parseInt(hoursum) + parseInt(duration[0])
            mintsum = parseInt(mintsum) + parseInt(duration[1])
            secondsum = parseInt(secondsum) + parseInt(duration[2])

        }
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
        return ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2)
    }
}

let getLoginUserId = async (token) => {
    let userObj = await User.findOne({ where: { login_token: token } });
    if (userObj) {
        return userObj.id;
    }
}

let remove = removeFileFromFolder = async (filePath) => {
    if (fs.existsSync(filePath)) {
        return await fs.unlinkSync(filePath);
    }
}

let secondsToHms = (d) => {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay + sDisplay;
}

let convertSecondToHMS = (totalSeconds) => {
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    // If you want strings with leading zeroes:
    minutes = String(minutes).padStart(2, "0");
    hours = String(hours).padStart(2, "0");
    seconds = String(seconds).padStart(2, "0");
    return hours + ":" + minutes + ":" + seconds;
}

let validateToekn = async (token) => {
    let userObj = await User.findOne({ where: { login_token: token } });
    if (userObj) {
        return true;
    }
    return false;
}

//******** start hashtag section api ************//
// add hashtag
exports.addHashtag = async (req, res) => {

    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var fileName = '';
            if (req.files != null) {
                const image = req.files.image
                let dir = 'uploads/hashtag';
                const path = dir + '/' + image.name
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                image.mv(path, (error) => {
                    if (error) {
                        res.writeHead(500, {
                            'Content-Type': 'application/json'
                        })
                        res.end(JSON.stringify({ status: 'error', message: error }))
                    }
                })
                fileName = image.name
            }
            let data = {
                hashtag: req.body.hashtag,
                image: fileName
            }
            await Hashtag.create(data);
            res.send({ success: true, message: "Hashtag created successfully.", data: [] });
        } else {
            res.send({ success: false, message: "Invalid token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}
// hashtag list 
exports.hashtagList = async (req, res) => {
    let token = await User.getToken(req);
    let isValidToekn = await validateToekn(token);
    if (isValidToekn) {
        let where = {
            status: 'active'
        }
        //console.log(req.query)
        if (req.query.search) {
            console.log('innnn')
            where = {
                [Op.and]: [
                    { status: 'active' },
                    {
                        hashtag: {
                            [Op.like]: '%' + req.query.search + '%'
                        }
                    }
                ]
            }
        }
        let hashtagList = await Hashtag.findAll({ where: where });
        res.send({ success: true, message: "", data: hashtagList });
    } else {
        res.send({ success: false, message: "Invalid token", data: [] });
    }
};

// edit hashtag

exports.hashtagDetail = async (req, res) => {
    let token = await User.getToken(req);
    let isValidToekn = await validateToekn(token);
    if (isValidToekn) {
        var hashtag = await Hashtag.findOne();
        res.send({ success: true, message: "", data: hashtag });
    } else {
        res.send({ success: false, message: "Invalid token", data: [] });
    }
};

// update hashtag

exports.updateHashtag = async (req, res) => {

    try {

        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            var hashtagData = await Hashtag.findOne();
            var fileName;
            if (req.files != null) {
                var NewName = Math.round(new Date() / 1000) + User.generateToken();
                const image = req.files.hashtagVideo
                var fileExt = image.mimetype.split('/').pop();
                var fileName = NewName + '.' + fileExt;
                let dir = 'uploads/hashtag';
                const path = dir + '/' + fileName
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                image.mv(path, (error) => {
                    if (error) {
                        res.writeHead(500, {
                            'Content-Type': 'application/json'
                        })
                        res.end(JSON.stringify({ status: 'error', message: error }))
                    }
                })
                fileName = fileName

                //const image = req.files.hashtagVideo
                const tg = await new ThumbnailGenerator({
                    sourcePath: 'uploads/hashtag/' + fileName,
                    thumbnailPath: 'uploads/hashtag/thumbs/',
                    tmpDir: '/uploads/hashtag/thumbs/'
                });

                tg.generateOneByPercentCb(50, async (err, result) => {
                    video_thumb = result;
                    var data = {
                        hashtag: req.body.hashtag,
                        image: fileName,
                        video_thumb: video_thumb,
                    }
                    if (hashtagData) {
                        await Hashtag.update(data, { where: { type: "hashtag" } });
                    } else {
                        await Hashtag.create(data);
                    }

                });

            } else {
                var data = {
                    hashtag: req.body.hashtag,
                    image: hashtagData.image,
                    video_thumb: hashtagData.video_thumb,
                }
                if (hashtagData) {
                    await Hashtag.update(data, { where: { type: "hashtag" } });
                } else {
                    await Hashtag.create(data);
                }
            }

            //await Hashtag.update(data);
            res.send({ success: true, message: "Hashtag updated successfully.", data: [] });

        } else {
            res.send({ success: false, message: "Invalid token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}
//  delete hashtag

exports.hashtagDelete = async (req, res) => {
    let token = await User.getToken(req);
    let isValidToekn = await validateToekn(token);
    if (isValidToekn) {
        var hashtag = await Hashtag.destroy({ where: { id: req.params.id } });
        res.send({ success: true, message: "Hashtag deleted successfully.", data: [] });
    } else {
        res.send({ success: false, message: "Invalid token", data: [] });
    }
};

//SERIES-----------------

// exports.addSeries = async (req, res) => {
//     try {
//         let token = await User.getToken(req);
//         let isValidToekn = await validateToekn(token);
//         if (isValidToekn) {



//             const image = req.files.image
//             let dir = 'uploads/series/images';
//             const path = dir + '/' + image.name
//             if (!fs.existsSync(dir)) {
//                 fs.mkdirSync(dir, { recursive: true });
//             }
//             image.mv(path, (error) => {
//                 if (error) {
//                     res.writeHead(500, {
//                         'Content-Type': 'application/json'
//                     })
//                     res.end(JSON.stringify({ status: 'error', message: error }))
//                 }
//             })
//             var fileName = image.name


//             let Data = {
//                 name: req.body.name,
//                 description: req.body.description,
//                 image: fileName
//             }

//             await Series.create(Data);



//             res.send({ success: true, message: "Series created successfully.", data: Data });
//         } else {
//             res.send({ success: false, type: "token_invalid", message: "Invalid token", data: [] });
//         }
//     }
//     catch (e) {
//         res.send({ success: false, message: e.message, data: [] });
//     }
// }

// Quiz Add
exports.addQuiz = async (req, res) => {
    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        console.log("isValidToekn", isValidToekn);
        if (isValidToekn) {
            let Data = {
                question: req.body.question,
            }
            let quiz = await Quiz.create(Data);
            let option = [];
            options = req.body.option_name;
            option = options.split(",");

            // option.forEach(async function (optionRow, i) {
            for (const row of option) {
                let data = {
                    question_id: quiz.id,
                    option_name: row
                }

                await Quiz_Options.create(data);

            };

            res.send({ success: true, message: "Quiz created successfully.", data: [] });
        } else {
            res.send({ success: false, message: "Invalid Token", data: [] });
        }
    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

exports.quizList = async (req, res) => {
    try {
        let token = await User.getToken(req);
        let isValidToekn = await validateToekn(token);
        if (isValidToekn) {
            let list = await Quiz.findOne(
                {
                    where: {
                        id: req.query.id
                    },
                    include: [{
                        model: db.quiz_question_options
                    }]
                });
            res.send({ success: true, message: "Quiz list", data: list })
        } else {
            res.send({ success: false, message: "Invalid Token", data: [] });
        }

    } catch (e) {
        res.send({ success: false, message: e.message, data: [] });
    }
}

let checkRoutineContentType = async(routineId,type)=>{
    var videos;
    if(type == 'routine'){
      var exist  = await RoutineVideo.count({ where: {
           routine_id: routineId }
         });
         if(!exist){
          return 'same';
         }
       videos = await RoutineVideo.count({ where: {[Op.and]: [
           { content_type: 'free' },
           { routine_id: routineId }
           ]}
          });
          if(parseInt(videos) != 0){
              return 'free';
          }else{
              return 'premium';
          }
      }else{
       var exist = await SeriesVideo.count({ where: {
              series_id: routineId }
          });
          if(!exist){
              return 'same';
          }
       videos = await SeriesVideo.count({ where: {[Op.and]: [
              { content_type: 'free' },
              { series_id: routineId }
              ]}
             });
          if(parseInt(videos) != 0){
              return 'free';
          }else{
              return 'premium';
          }
      }		
      
}
    
