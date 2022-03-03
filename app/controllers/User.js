const db = require("../models");
const UserRoom = db.user_room;
const Room = db.room;
const Message = db.message;
const User = db.user;
const Blog = db.blog;
const Hashtag = db.hashtag;
const UserSavedRoutine = db.userSaveRoutine;
const RoutineVideo = db.routineVideo;
const TeacherVideos = db.teacherVideo;
const Routine = db.routine;
const TeacherPrfile = db.teacherProfile;
const UserEmoji = db.userEmoji;
const UserPlaylist = db.userPlaylist;
const InstagramInfo = db.instagramInfo;
const Op = db.Sequelize.Op;
const Sequelize = require('sequelize');
const config = require("../config/config.js");
const user = require("../routes/user");
var logger = require('@setreflex/logger').logger();
const request = require('request');
var https = require('follow-redirects').https;
var qs = require('querystring');
const axios = require('axios');
var fs = require('fs');
const Series = db.series;
const SeriesVideo = db.seriesVideo; 

// const { where } = require("sequelize");
// const Instagram = require('instagram-web-api')



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
		let limit = 10
		let offset = 0 + (req.query.page - 1) * limit;
		let totatCount = await Blog.count({ where: whereCondition });
		let blogList = await Blog.findAndCountAll({
			where: whereCondition,
			limit: limit,
			offset: offset,
			order: [['list_order', 'ASC']]
		});
		for (const row of blogList['rows']) {
			var obj = Object.assign({}, row.get());
			obj.description = (obj.description)?obj.description.replace(/<\/?[^>]+(>|$)/g, ""):'';
			All.push(obj);
		}
		if (blogList) {
			blogList['rows'] = All;
			blogList['count'] = totatCount;
			blogList['currentPage'] = req.query.page;
			blogList['totalPages'] = Math.ceil(blogList['count'] / limit);
		}
		res.send({ success: true, message: "", data: blogList });
	} else {
		res.send({ success: false, message: "Invalid token", data: [] });
	}
};

exports.blogDetail = async function (req, res, next) {
	try {
		var blog = await Blog.findOne({ where: { id: req.params.blog_id } });
		res.send({ success: true, message: "", data: blog });
	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}
}

exports.userDetail = async function (req, res, next) {

	try {
		let token = await User.getToken(req);
		let isValidToekn = await validateToekn(token);
		if (isValidToekn) {
			let loginId = await getLoginUserId(token);
			result = await User.findOne({
				where: { id: loginId }
			});
			res.send({ success: true, message: "", data: result });
		} else {
			res.send({ success: false, message: "Invalid token", data: [] });
		}
	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}
}

exports.savedRoutineList = async function (req, res, next) {

	try {
		let token = await User.getToken(req);
		let isValidToekn = await validateToekn(token);
		if (isValidToekn) {
			let loginId = await getLoginUserId(token);
			var All = [];
			let limit = 10
			let offset = 0 + (req.query.page - 1) * limit;
			let whereCondition = {
				[Op.and]: [
					{ user_id: loginId },
					{ type: 'routine' }
				]
			}
			let totatCount = await UserSavedRoutine.count({ where: { user_id: loginId, type: 'routine' } });
			let userVideoList = await UserSavedRoutine.findAndCountAll({
				where: whereCondition,
				limit: limit,
				offset: offset,
				include: [{
					model: db.routine
				}
				],
				order: [['id', 'DESC']]
			}
			);
			for (const row of userVideoList['rows']) {
				var obj = Object.assign({}, row.get());
				obj.total_duration = await getTotalRoutineDuration(obj.routine_id);
				obj.total_duration_inMint = await getTotalRoutineMinutDuration(obj.routine_id);
				var type = await checkRoutineContentType(obj.routine_id,'routine');
				obj.content_type = (type == 'same')?obj.content_type : type;
				All.push(obj);
			}
			userVideoList['rows'] = All;
			userVideoList['count'] = totatCount;
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

exports.savedVideoList = async function (req, res, next) {

	try {

		let token = await User.getToken(req);
		let isValidToekn = await validateToekn(token);
		if (isValidToekn) {
			let loginId = await getLoginUserId(token);
			console.log('Login User:' + loginId)
			var All = [];
			let limit = 10
			let offset = 0 + (req.query.page - 1) * limit;
			let totatCount = await UserSavedRoutine.count({ where: { user_id: loginId, type: 'video', playlist_id: req.query.play_list_id } });
			let userVideoList = await UserSavedRoutine.findAndCountAll({
				where: {
					user_id: loginId,
					type: 'video',
					playlist_id: req.query.play_list_id
				},
				limit: limit,
				offset: offset,
				include: [{
					model: db.teacherVideo,
					include: [
						{
							model: db.videoSlice,
						}
					]
				},
				{
					model: db.routineVideo,
					include: [
						{
							model: db.videoSlice,
						}
					]
				}
				],
				order: [['id', 'DESC']]
			}
			);
			for (const row of userVideoList['rows']) {
				var obj = Object.assign({}, row.get());
				// obj.total_duration = await getTotalRoutineDuration(obj.routine_id);
				All.push(obj);
			}
			userVideoList['rows'] = All;
			userVideoList['count'] = totatCount;
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
			let whereCondition = {
				[Op.and]: [
					{ role_id: 3 },
					{ status: 'active' }
				]
			}

			if (req.query.search) {
				whereCondition = {
					[Op.and]: [
						{ role_id: 3 },
						{
							fullname: {
								[Op.like]: '%' + req.query.search + '%'
							}
						},
						{ status: 'active' }
					]
				}
			}
			let limit = 10
			let offset = 0 + (req.query.page - 1) * limit;
			let totatCount = await User.count({ where: whereCondition });
			let teacherList = await User.findAndCountAll({
				where: whereCondition,
				include: [{
					model: db.teacherProfile,
					include: [{
						model: db.userEmoji
					}]
				}
				],
				limit: limit,
				offset: offset,
				order: [['teacherProfile', 'list_order', 'ASC']]
			}
			);
			for (const row of teacherList['rows']) {
				var obj = Object.assign({}, row.get());
				obj.routine_count = await getRoutineCount(obj.id);
				obj.video_count = await getVideoCount(obj.id);
				obj.normal_video_count = await getNormalVideoCount(obj.id);
				All.push(obj);
			}
			teacherList['rows'] = All;
			teacherList['count'] = totatCount;
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

exports.adminTeacherList = async function (req, res, next) {

	try {
		let token = await User.getToken(req);
		let isValidToekn = await validateToekn(token);
		if (isValidToekn) {
			var All = [];
			let whereCondition = {
				[Op.and]: [
					{ role_id: 3 }
					// { status: 'active' }
				]
			}

			if (req.query.search) {
				whereCondition = {
					[Op.and]: [
						{ role_id: 3 },
						{
							fullname: {
								[Op.like]: '%' + req.query.search + '%'
							}
						},
						{ status: 'active' }
					]
				}
			}
			let limit = 10
			let offset = 0 + (req.query.page - 1) * limit
			let teacherList = await User.findAndCountAll({
				where: whereCondition,
				include: [{
					model: db.teacherProfile
				}
				],
				limit: limit,
				offset: offset,
				order: [['teacherProfile', 'list_order', 'ASC']]
			}
			);
			for (const row of teacherList['rows']) {
				var obj = Object.assign({}, row.get());
				obj.series_count = await getSeriesCount(obj.id);
				obj.routine_count = await getRoutineCount(obj.id);
				obj.video_count = await getVideoCount(obj.id);
				obj.normal_video_count = await getNormalVideoCount(obj.id);
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
exports.feedList = async function (req, res, next) {

	try {
		// const username = "pankajsonava453@gmail.com";
		// const password = "sonava@123";
		// const client = new Instagram({ username, password });

		// (async () => {
		// 	await client.login()
		// 	const profile = await client.getProfile()
		// const media = await client.getMediaByShortcode({ shortcode: 'BQE6Cq2AqM9' })
		// var media = await client.getChallenge({ challengeUrl: '/challenge/1284161654/a1B2c3d4E6/' })
		// const location = await client.getMediaFeedByLocation({ locationId: '26914683' })
		// const tag = await client.getMediaFeedByHashtag({ hashtag: 'pmmodi' })
		// 	res.send({ success: true, message: "", data: profile });

		// })()
	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}
}

exports.routineVideoList = async function (req, res, next) {

	try {

		let token = await User.getToken(req);
		let isValidToekn = await validateToekn(token);
		if (isValidToekn) {
			let whereCondition = {
				routine_id: req.query.routine_id
			}
			if (req.query.search) {
				whereCondition = {
					[Op.and]: [
						{ routine_id: req.query.routine_id },
						{
							video_title: {
								[Op.like]: '%' + req.query.search + '%'
							}
						}
					]
				}
			}
			
			let limit = 10
			let offset = 0 + (req.query.page - 1) * limit;
			let totatCount = await RoutineVideo.count({ where: whereCondition });
			let routineVideoList = await RoutineVideo.findAndCountAll({
				where: whereCondition,
				limit: limit,
				offset: offset,
				include: [
					{
						model: db.videoSlice
					},
					{
						model: db.routine
					},
					{
						model: db.user
					},
					{
						model: db.routine,
						include: [
							{
								model: db.routineFolder,
							}
						]
					}
				],
				group: ['routineVideo.id'],
				// order: [['id', 'DESC']]
				order: [['list_order', 'ASC']]
			}
			);
			routineVideoList['rows'] = routineVideoList['rows'];
			routineVideoList['count'] = totatCount;
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

exports.seriesVideoList =  async function(req, res, next){
	try {

		let token = await User.getToken(req);
		let isValidToekn = await validateToekn(token);
		if (isValidToekn) {
			let whereCondition = {
				series_id: req.query.series_id
			}
			if (req.query.search) {
				whereCondition = {
					[Op.and]: [
						{ series_id: req.query.series_id },
						{
							video_title: {
								[Op.like]: '%' + req.query.search + '%'
							}
						}
					]
				}
			}
			
			let limit = 10
			let offset = 0 + (req.query.page - 1) * limit;
			let totatCount = await SeriesVideo.count({ where: whereCondition });
			let routineVideoList = await SeriesVideo.findAndCountAll({
				where: whereCondition,
				limit: limit,
				offset: offset,
				include: [
					{
						model: db.videoSlice
					},
					{
						model: db.series
					},
					{
						model: db.user
					},
					{
						model: db.series,
						include: [
							// {
							// 	model: db.routineFolder,
							// }
						]
					}
				],
				group: ['seriesVideo.id'],
				// order: [['id', 'DESC']]
				order: [['list_order', 'ASC']]
			}
			);
			routineVideoList['rows'] = routineVideoList['rows'];
			routineVideoList['count'] = totatCount;
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

exports.adminRoutineVideoList = async function (req, res, next) {

	try {

		let token = await User.getToken(req);
		let isValidToekn = await validateToekn(token);
		if (isValidToekn) {
			let whereCondition = {
				routine_id: req.query.routine_id
			}
			if (req.query.search) {
				whereCondition = {
					[Op.and]: [
						{ routine_id: req.query.routine_id },
						{
							video_title: {
								[Op.like]: '%' + req.query.search + '%'
							}
						}
					]
				}
			}
			let limit = 10
			let offset = 0 + (req.query.page - 1) * limit;
			let count = await RoutineVideo.count({ where: whereCondition });
			let routineVideoList = await RoutineVideo.findAndCountAll({
				where: whereCondition,
				limit: limit,
				offset: offset,
				include: [
					{
						model: db.videoSlice
					},
					{
						model: db.routine
					},
					{
						model: db.user
					},
					{
						model: db.routine,
						include: [
							{
								model: db.routineFolder,
							}
						]
					}
				],
				group: ['routineVideo.id'],
				order: [['list_order', 'ASC']]
			}
			);
			routineVideoList['rows'] = routineVideoList['rows'];
			routineVideoList['count'] = count;
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

exports.adminSeriesVideoList = async function (req, res, next) {

	try {

		let token = await User.getToken(req);
		let isValidToekn = await validateToekn(token);
		if (isValidToekn) {
			let whereCondition = {
				series_id: req.query.series_id
			}
			if (req.query.search) {
				whereCondition = {
					[Op.and]: [
						{ series_id: req.query.series_id },
						{
							video_title: {
								[Op.like]: '%' + req.query.search + '%'
							}
						}
					]
				}
			}
			let limit = 10
			let offset = 0 + (req.query.page - 1) * limit;
			let count = await SeriesVideo.count({ where: whereCondition });
			let routineVideoList = await SeriesVideo.findAndCountAll({
				where: whereCondition,
				limit: limit,
				offset: offset,
				include: [
					{
						model: db.videoSlice
					},
					{
						model: db.series
					},
					{
						model: db.user
					},
					{
						model: db.series,
						include: [
							{
								model: db.routineFolder,
							}
						]
					}
				],
				group: ['seriesVideo.id'],
				order: [['list_order', 'ASC']]
			}
			);
			routineVideoList['rows'] = routineVideoList['rows'];
			routineVideoList['count'] = count;
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

exports.getUserPlayList = async function (req, res, next) {

	// try {

		let token = await User.getToken(req);
		let isValidToekn = await validateToekn(token);
		if (isValidToekn) {
			var All = [];
			let whereCondition = {
				user_id: req.query.user_id
			}
			if (req.query.search) {
				whereCondition = {
					[Op.and]: [
						{ user_id: req.query.user_id },
						{
							name: {
								[Op.like]: '%' + req.query.search + '%'
							}
						}
					]
				}
			}
			let limit = 10
			let offset = 0 + (req.query.page - 1) * limit;
			let totatCount = await UserPlaylist.count({ where: whereCondition });
			let routineVideoList = await UserPlaylist.findAndCountAll({
				where: whereCondition,
				limit: limit,
				offset: offset,
				order: [['id', 'DESC']]
			}
			);
			for (const row of routineVideoList['rows']) {
				var obj = Object.assign({}, row.get());
				obj.total_duration_inMint = await getTotalPlayListDuration(obj.id);
				obj.total_duration = await getTotalDurationHms(obj.id);
				obj.video_count = await getPlayListVideoCount(obj.id);
				All.push(obj);
			}
			routineVideoList['rows'] = All;
			routineVideoList['count'] = totatCount;
			routineVideoList['currentPage'] = req.query.page;
			routineVideoList['totalPages'] = Math.ceil(routineVideoList['count'] / limit);
			res.send({ success: true, message: "", data: routineVideoList });
		} else {
			res.send({ success: false, message: "Invalid token", data: [] });
		}

	// } catch (e) {
	// 	res.send({ success: false, message: e.message, data: [] });
	// }
}


exports.removeArticle = async function (req, res, next) {

	try {
		var playList = await UserPlaylist.destroy({ where: { id: req.query.id } });
		if (playList) {
			await UserSavedRoutine.destroy({ where: { playlist_id: req.query.id } });
			res.send({ success: true, message: "PlayList deleted successfully.", data: '' });
		} else {
			res.send({ success: false, message: "PlayList not found.", data: '' });
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
			var videoAll = [];
			if (req.query.type == 'profile') {
				result = await TeacherPrfile.findOne({
					where: { user_id: req.query.teacher_id }
				}
				);
				let emojis = await UserEmoji.findAll({ where: { user_id: req.query.teacher_id } });
				result['emojis'] = emojis;
			}

			let limit = 10
			let offset = 0 + (req.query.page - 1) * limit
			if (req.query.type == 'video') {
				let whereCondition = {
					[Op.and]: [{ user_id: req.query.teacher_id }]
				}
	
				if (req.query.level && req.query.level != 'all') {
					whereCondition = {
						[Op.and]: [{ user_id: req.query.teacher_id },
							       {video_level:req.query.level}
						      ]
					}
				}
				console.log('where',whereCondition)

				result = await TeacherVideos.findAndCountAll({
					where: whereCondition,
					limit: limit,
					offset: offset,
					include: [{
						model: db.videoSlice
					}],
					order: [['list_order', 'ASC']]
				}
				);

				for (const row of result['rows']) {
					var obj = Object.assign({}, row.get());
					var isSaved = await UserSavedRoutine.findOne({ where: { video_id: obj.id, user_id: req.query.teacher_id } });
					obj.is_saved = (isSaved) ? true : false;
					videoAll.push(obj);
				}
				result['rows'] = videoAll;
				result['currentPage'] = req.query.page;
				result['totalPages'] = Math.ceil(result['count'] / limit);
			}
			if (req.query.type == 'routine') {
				let whereCondition = {
					[Op.and]: [
						{ user_id: req.query.teacher_id }
					]
				}
	
				if (req.query.level && req.query.level != 'all') {
					whereCondition = {
					[Op.and]: [
						{ user_id: req.query.teacher_id },
						{routine_level:req.query.level}
					 ]
					}
				}
				result = await Routine.findAndCountAll({
					where: whereCondition,
					limit: limit,
					offset: offset,
					include: [{
						model: db.routineFolder
					}],
					order: [['id', 'DESC']]
				}
				);
				for (const row of result['rows']) {
					var obj = Object.assign({}, row.get());
					var isSaved = await UserSavedRoutine.findOne({ where: { routine_id: obj.id, user_id: req.query.teacher_id } });
					obj.is_saved = (isSaved) ? true : false;
					obj.total_duration = await getTotalRoutineDuration(obj.id);
					obj.total_duration_inMint = await getTotalRoutineMinutDuration(obj.id);
					var type = await checkRoutineContentType(obj.id,'routine');
					obj.content_type = (type == 'same')?obj.content_type : type;
					All.push(obj);

				}
				result['rows'] = All;
				result['currentPage'] = req.query.page;
				result['totalPages'] = Math.ceil(result['count'] / limit);
			}
			if (req.query.type == 'series') {
				let whereCondition = {
					[Op.and]: [
						{ user_id: req.query.teacher_id }
					]
				}
	
				if (req.query.level && req.query.level != 'all') {
					whereCondition = {
					[Op.and]: [
						{ user_id: req.query.teacher_id },
						{series_level:req.query.level}
					 ]
					}
				}
				result = await Series.findAndCountAll({
					where: whereCondition,
					limit: limit,
					offset: offset,
					// include: [{
					// 	model: db.routineFolder
					// }],
					order: [['id', 'DESC']]
				}
				);
				for (const row of result['rows']) {
					var obj = Object.assign({}, row.get());
					// var isSaved = await UserSavedRoutine.findOne({ where: { routine_id: obj.id, user_id: req.query.teacher_id } });
					// obj.is_saved = (isSaved) ? true : false;
					obj.total_duration = await getTotalRoutineDuration(obj.id);
					obj.total_duration_inMint = await getTotalRoutineMinutDuration(obj.id);
					var type = await checkRoutineContentType(obj.id,'series');
					obj.content_type = (type == 'same')?obj.content_type : type;
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
	//   logger.info('get data  #### %s.', req.body.type);
	try {
		let token = await User.getToken(req);
		let isValidToekn = await validateToekn(token);
		var message;
		if (isValidToekn) {
			let user_id = await getLoginUserId(token);
			if (req.body.type == 'save') {
				let data = {
					user_id: user_id,
					routine_id: req.body.routine_id,
					type: 'routine'
				}
				var isSaved = await UserSavedRoutine.findOne({ where: data });
				if (isSaved) {
					message = 'Routine aleredy saved.';
					res.send({ success: true, message: message, data: [] });
				} else {
					await UserSavedRoutine.create(data);
				}
			} else {
				await UserSavedRoutine.destroy({ where: { id: req.body.routine_id, user_id: user_id } });
			}

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

exports.saveUnsaveVideo = async function (req, res, next) {
	//   logger.info('get data  #### %s.', req.body.type);
	try {
		let token = await User.getToken(req);
		let isValidToekn = await validateToekn(token);
		var message;
		if (isValidToekn) {
			let user_id = await getLoginUserId(token);

			if (req.body.type == 'save') {
				var saveData;
				var playListId;
				// console.log(req.files.playlist_icon)
				if (req.body.playlist_type == 'name') {
					var fileName = '';
					if (req.files != null) {
						const image = req.files.playlist_icon
						let dir = 'uploads/playlist_icon';
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
					var createData;
					if (req.files != null) {
						 createData = {
							user_id: user_id,
							name: req.body.playlist,
							icon : fileName
						}
			     	}else{
						createData = {
							user_id: user_id,
							name: req.body.playlist,
						}
					 }
					 console.log(createData)
					let playList = await UserPlaylist.findOne({ where: {user_id:user_id , name:createData.name} });
					if (playList) {
						return res.send({ success: false, message: 'Sorry , this playlist already has been added by you.', data: [] });
					}
					let addRes = await UserPlaylist.create(createData);
					playListId = addRes.id;
				} else {
					playListId = req.body.playlist;
				}

				if (req.body.video_type == 'artist') {
					saveData = {
						user_id: user_id,
						video_id: req.body.video_id,
						type: 'video',
						playlist_id: playListId
					}
				} else {
					saveData = {
						user_id: user_id,
						routine_video_id: req.body.video_id,
						type: 'video',
						playlist_id: playListId
					}
				}
				var isSaved = await UserSavedRoutine.findOne({ where: saveData });
				if (isSaved) {
					message = 'Video aleredy saved.';
					res.send({ success: true, message: message, data: [] });
				} else {
					await UserSavedRoutine.create(saveData);
				}
			} else {
				await UserSavedRoutine.destroy({ where: { id: req.body.video_id, user_id: user_id } });
			}

			if (req.body.type == 'save') {
				message = 'Video saved successfully.'
			} else {
				message = 'Video unsaved successfully.'
			}
			res.send({ success: true, message: message, data: [] });
		} else {
			res.send({ success: false, message: message, data: [] });
		}

	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}
}
exports.updatePlayListIcon = async function (req, res, next) {
	//   logger.info('get data  #### %s.', req.body.type);
	try {
		let token = await User.getToken(req);
		let isValidToekn = await validateToekn(token);
		var message;
		if (isValidToekn) {
			console.log(req.body)
			var playListIcon;
			if (req.files != null) {
		      playListIcon =	await uploadPlayListIcon(req.files.playlist_icon);
			}
		var playList = await UserPlaylist.findOne({where:{id:req.body.playlist_id}});
		let updateData = {
			icon: (playListIcon)?playListIcon:playList.icon,
			name:req.body.name
		}
		var Updatedstatus = UserPlaylist.update(updateData, { where: { id: req.body.playlist_id } });
		 if(Updatedstatus){
		  res.send({ success: true, message: 'Playlist Updated Successfully.', data: [] });
		 }else{
			res.send({ success: false, message: 'Something went wrong.', data: [] });
		 }
		} else {
			res.send({ success: false, message: message, data: [] });
		}

	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}
}

let uploadPlayListIcon = async (playListIcon) => {
	var fileName;
	if (playListIcon != null) {
		const image = playListIcon
		let dir = 'uploads/playlist_icon';
		const path = dir + '/' + image.name
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		await image.mv(path, (error) => {
			if (error) {
				res.writeHead(500, {
					'Content-Type': 'application/json'
				})
				res.end(JSON.stringify({ status: 'error', message: error }))
			}
		})
		fileName = image.name
	}
	return fileName;
}

let getRandomString = (num) => {
	var text = "";
	var char_list = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (var i = 0; i < num; i++) {
		text += char_list.charAt(Math.floor(Math.random() * char_list.length));
	}
	return text;
}

let getRoutineCount = async (teacherId) => {
	return await Routine.count({ where: { user_id: teacherId } });
}

let getSeriesCount = async (teacherId) => {
	return await Series.count({ where: { user_id: teacherId } });
}

let getVideoCount = async (teacherId) => {
	return await RoutineVideo.count({ where: { user_id: teacherId } });
}

let getNormalVideoCount = async (teacherId) => {
	return await TeacherVideos.count({ where: { user_id: teacherId } });
}

let getPlayListVideoCount = async (playListId) => {
	return await UserSavedRoutine.count({
		where: {
			playlist_id: playListId,
			type: 'video'
		}
	}
	);

}
let checkRoutineContentType = async(routineId,type)=>{
	  var videos;
	  console.log('routineId',routineId)
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
		return ('0' + hours).slice(-2) + ' hrs :' + ('0' + minutes).slice(-2) + ' min :' + ('0' + seconds).slice(-2) + ' sec'
	}
}

let getTotalRoutineMinutDuration = async (routineId) => {
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
		var hoursMin = hoursum * 60
		var minutes = mintsum


		return (hoursMin)?(""+hoursMin + minutes+""):(""+minutes+"");
	}
}

let getTotalPlayListDuration = async (playListId) => {

	let savedVideos = await UserSavedRoutine.findAll({
		where: {
			playlist_id: playListId,
			type: 'video'
		},
		include: [
			{
				model: db.teacherVideo
			},
			{
				model: db.routineVideo
			}
		],
		order: [['id', 'DESC']]
	}
	);

	if (savedVideos) {
		var times = [0, 0, 0]
		var max = times.length;
		// store time values
		var hoursum = 0;
		var mintsum = 0;
		var secondsum = 0;
		var duration = 0;
		for (var j = 0; j < savedVideos.length; j++) {
			if (savedVideos[j].teacherVideo) {
				 duration = (savedVideos[j].teacherVideo.duration).split(':');
			} else if (savedVideos[j].routineVideo) {
				 duration = (savedVideos[j].routineVideo.video_duration).split(':');
			}
			
			hoursum = parseInt(hoursum) + (typeof duration !== 'undefined' && duration)?parseInt(duration[0]):0
			mintsum = parseInt(mintsum) + (typeof duration !== 'undefined' && duration)?parseInt(duration[1]):0
			secondsum = parseInt(secondsum) + (typeof duration !== 'undefined' && duration)?parseInt(duration[2]):0

		}
		var hoursMin = hoursum * 60
		var minutes = mintsum;
		return (hoursMin + minutes);
	}
}

let getTotalDurationHms = async (playListId) => {
	let savedVideos = await UserSavedRoutine.findAll({
		where: {
			playlist_id: playListId,
			type: 'video'
		},
		include: [
			{
				model: db.teacherVideo
			},
			{
				model: db.routineVideo
			}
		],
		order: [['id', 'DESC']]
	}
	);
	if (savedVideos) {
		var times = [0, 0, 0]
		var max = times.length;
		// store time values
		var hoursum = 0;
		var mintsum = 0;
		var secondsum = 0;
		for (var j = 0; j < savedVideos.length; j++) {
			if (savedVideos[j].teacherVideo) {
				var duration = (savedVideos[j].teacherVideo.duration).split(':');
			} else if (savedVideos[j].routineVideo) {
				var duration = (savedVideos[j].routineVideo.video_duration).split(':');
			}
			hoursum = parseInt(hoursum) + (typeof duration !== 'undefined' && duration)?parseInt(duration[0]):0
			mintsum = parseInt(mintsum) + (typeof duration !== 'undefined' && duration)?parseInt(duration[1]):0
			secondsum = parseInt(secondsum) + (typeof duration !== 'undefined' && duration)?parseInt(duration[2]):0

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
		return ('0' + hours).slice(-2) + ' hrs :' + ('0' + minutes).slice(-2) + ' min :' + ('0' + seconds).slice(-2) + ' sec'
	}
}

let getLoginUserId = async (token) => {
	let userObj = await User.findOne({ where: { login_token: token } });
	if (userObj) {
		return userObj.id;
	}
}


let validateToekn = async (token) => {
	let userObj = await User.findOne({ where: { login_token: token } });
	if (userObj) {
		return true;
	}
	return false;
}

let timeAgo = (date, timezone) => {
	var date = new Date(Date.parse(date + " UTC")).toLocaleString("en-US", { timeZone: timezone });
	return dateFormat(date.toString(), "dddd mmmm dS , yyyy h:MM:ss TT");
}

let bytesToSize = (bytes) => {
	var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	if (bytes == 0) return '0 Byte';
	var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
	return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];

}

// get hashtag

exports.Hashtag = async function (req, res, next) {
	try {
		var hashtag = await Hashtag.findOne({});
		res.send({ success: true, message: "Data found successfully.", data: hashtag });
	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}
}

// get hashtag details form instagram//
exports.getHashtagDetails = async function (req, res, next) {
	//logger.info('get data  #### %s.', req.body.hashtag);
	try {
		let token = await User.getToken(req);
		let isValidToekn = await validateToekn(token);
		var message;
		var hashtag = req.body.hashtag.toLowerCase();

		if (isValidToekn) {
			let user_id = await getLoginUserId(token);
			if (req.body.hashtag == "" || req.body.hashtag == undefined) {
				message = "Please provide hashtag.";
				res.send({ success: false, message: message, data: [] });
			} else {
				/* Get Match Hashtag form instram*/

				var url = 'https://www.instagram.com/graphql/query/?query_hash=3e7706b09c6184d5eafd8b032dbcf487&variables={"tag_name":"' + hashtag + '","first":25,"after":""}';

				var response = await axios.get(url, {
					headers: {
						'accept-encoding': 'gzip, deflate, br',
						'x-ig-capabilities': '3w==',
						'Accept-Language': 'en-GB,en-US;q=0.8,en;q=0.6',
						'User-Agent': 'Instagram 128.0.0.19.128 (Linux; Android 8.0; ANE-LX1 Build/HUAWEIANE-LX1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.109 Mobile Safari/537.36',
						'Accept': '*/*',
						'Referer': 'https://www.instagram.com/',
						'authority': 'i.Instagram.com/',
						'Cookie': 'ds_user_id=44372909615; sessionid=44372909615%3AQHywPHTupeVFzY%3A1;'
					}
				}).then(response => {
					return response;
				}).catch(error => {
					console.log("Error", error);
					return 0
				})
				//console.log(response.data);
				if (response != 0) {
					var responseData = response.data;
					var result = await InstagramInfo.findOne({
						where: { "hashtag": hashtag }
					});

					var updateData = {
						"hashtag": hashtag,
						"responseInfo": JSON.stringify(responseData)
					}
					//console.log("____________________",response.data.status);
					if (response.data.status == "ok") {
						if (result) {
							console.log("update");
							var Updatedstatus = InstagramInfo.update(updateData, { where: { hashtag: hashtag } });
						} else {
							console.log("insert");
							var Updatedstatus = InstagramInfo.create(updateData);
							message = "Data Found successfully.";
							res.send({ success: true, message: message, data: responseData });
						}
						if (Updatedstatus) {
							var finalResult = await InstagramInfo.findOne({
								where: { "hashtag": hashtag }
							});
						}
					} else {
						var finalResult = await InstagramInfo.findOne({
							where: { "hashtag": hashtag }
						});
					}

					if (finalResult) {
						message = "Data Found successfully.";
						res.send({ success: true, message: message, data: finalResult.responseInfo });
					} else {
						message = "Data Not Found";
						res.send({ success: true, message: message, data: [] });
					}
				} else {
					message = "Data Not Found.";
					res.send({ success: false, message: message, data: [] });
				}

			}
			//res.send({ success: true, message: message, data: [] });
		} else {
			res.send({ success: false, message: message, data: [] });
		}

	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}
}


