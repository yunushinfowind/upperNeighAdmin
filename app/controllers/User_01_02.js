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
const InstagramInfo = db.instagramInfo;
const Op = db.Sequelize.Op;
const EmojiImage = db.emojiImage;
const Sequelize = require('sequelize');
const config = require("../config/config.js");
const user = require("../routes/user");
var logger = require('@setreflex/logger').logger();
const request = require('request');
var https = require('follow-redirects').https;
var qs = require('querystring');
const axios = require('axios');

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
		let offset = 0 + (req.query.page - 1) * limit
		let totatCount = await Blog.count({ where: whereCondition});
		let blogList = await Blog.findAndCountAll({
			where: whereCondition,
			limit: limit,
			offset: offset,
			order: [['list_order', 'ASC']]
		});
		for (const row of blogList['rows']) {
            var obj = Object.assign({}, row.get());
            obj.description = obj.description.replace(/<\/?[^>]+(>|$)/g, "");
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
			let offset = (req.query.page - 1) + (req.query.page - 1) * limit;
			let totatCount = await UserSavedRoutine.count({ where: {user_id: loginId , type: 'routine'}});
			let userVideoList = await UserSavedRoutine.findAndCountAll({
				where: {
					user_id: loginId,
					type: 'routine'
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
			for (const row of userVideoList['rows']) {
				var obj = Object.assign({}, row.get());
				obj.total_duration = await getTotalRoutineDuration(obj.routine_id);
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
			let totatCount = await UserSavedRoutine.count({ where: {user_id: loginId , type: 'video'}});
			let userVideoList = await UserSavedRoutine.findAndCountAll({
				where: {
					user_id: loginId,
					type: 'video'
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
			let offset = 0 + (req.query.page - 1) * limit
			let totatCount = await User.count({ where: whereCondition});
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
				order: [['teacherProfile','list_order', 'ASC']]
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
				// limit: limit,
				// offset: offset,
				order: [['teacherProfile','list_order', 'ASC']]
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
	
		// console.log('innnnnnnnnnnnnnnnnnnnnnnnnnnnn');
		// var emojiArrr =	["one.png","two.png","three.png","four.png","five.png","six.png","seven.png","eight.png","nine.png","keycap_ten.png","1234.png","zero.png","hash.png","symbols.png","arrow_backward.png","arrow_down.png","arrow_forward.png","arrow_left.png","capital_abcd.png","abcd.png","abc.png","arrow_lower_left.png","arrow_lower_right.png","arrow_right.png","arrow_up.png","arrow_upper_left.png","arrow_upper_right.png","arrow_double_down.png","arrow_double_up.png","arrow_down_small.png","arrow_heading_down.png","arrow_heading_up.png","leftwards_arrow_with_hook.png","arrow_right_hook.png","left_right_arrow.png","arrow_up_down.png","arrow_up_small.png","arrows_clockwise.png","arrows_counterclockwise.png","rewind.png","fast_forward.png","information_source.png","ok.png","twisted_rightwards_arrows.png","repeat.png","repeat_one.png","new.png","top.png","up.png","cool.png","free.png","ng.png","cinema.png","koko.png","signal_strength.png","u5272.png","u5408.png","u55b6.png","u6307.png","u6708.png","u6709.png","u6e80.png","u7121.png","u7533.png","u7a7a.png","u7981.png","sa.png","restroom.png","mens.png","womens.png","baby_symbol.png","no_smoking.png","parking.png","wheelchair.png","metro.png","baggage_claim.png","accept.png","wc.png","potable_water.png","put_litter_in_its_place.png","secret.png","congratulations.png","m.png","passport_control.png","left_luggage.png","customs.png","ideograph_advantage.png","cl.png","sos.png","id.png","no_entry_sign.png","underage.png","no_mobile_phones.png","do_not_litter.png","non-potable_water.png","no_bicycles.png","no_pedestrians.png","children_crossing.png","no_entry.png","eight_spoked_asterisk.png","eight_pointed_black_star.png","heart_decoration.png","vs.png","vibration_mode.png","mobile_phone_off.png","chart.png","currency_exchange.png","aries.png","taurus.png","gemini.png","cancer.png","leo.png","virgo.png","libra.png","scorpius.png","sagittarius.png","capricorn.png","aquarius.png","pisces.png","ophiuchus.png","six_pointed_star.png","negative_squared_cross_mark.png","a.png","b.png","ab.png","o2.png","diamond_shape_with_a_dot_inside.png","recycle.png","end.png","on.png","soon.png","clock1.png","clock130.png","clock10.png","clock1030.png","clock11.png","clock1130.png","clock12.png","clock1230.png","clock2.png","clock230.png","clock3.png","clock330.png","clock4.png","clock430.png","clock5.png","clock530.png","clock6.png","clock630.png","clock7.png","clock730.png","clock8.png","clock830.png","clock9.png","clock930.png","heavy_dollar_sign.png","copyright.png","registered.png","tm.png","x.png","heavy_exclamation_mark.png","bangbang.png","interrobang.png","o.png","heavy_multiplication_x.png","heavy_plus_sign.png","heavy_minus_sign.png","heavy_division_sign.png","white_flower.png","100.png","heavy_check_mark.png","ballot_box_with_check.png","radio_button.png","link.png","curly_loop.png","wavy_dash.png","part_alternation_mark.png","trident.png","black_square.png","white_check_mark.png","black_square_button.png","white_square_button.png","black_circle.png","white_circle.png","red_circle.png","large_blue_circle.png","large_blue_diamond.png","large_orange_diamond.png","small_blue_diamond.png","small_orange_diamond.png","small_red_triangle.png","small_red_triangle_down.png","shipit.png"];
		// var emojiLength = emojiArrr.length;
		// for(let i=0;i<emojiLength ; i++){
		// 	let data = {
		// 		group_id : 5,
		// 		image : emojiArrr[i]
		// 	}
		// 	EmojiImage.create(data);
		
		// }
		
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
			let totatCount = await RoutineVideo.count({ where: whereCondition});
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
			let offset = 0 + (req.query.page - 1) * limit
			let routineVideoList = await RoutineVideo.findAndCountAll({
				where: whereCondition,
				// limit: limit,
				// offset: offset,
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
				result = await TeacherVideos.findAndCountAll({
					where: {
						[Op.and]: [{ user_id: req.query.teacher_id }]
					},
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
				result = await Routine.findAndCountAll({
					where: {
						[Op.and]: [{ user_id: req.query.teacher_id }]
					},
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
				if (req.body.video_type == 'artist') {
					saveData = {
						user_id: user_id,
						video_id: req.body.video_id,
						type: 'video'
					}
				} else {
					saveData = {
						user_id: user_id,
						routine_video_id: req.body.video_id,
						type: 'video'
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


let getVideoCount = async (teacherId) => {
	return await RoutineVideo.count({ where: { user_id: teacherId } });
}

let getNormalVideoCount = async (teacherId) => {
	return await TeacherVideos.count({ where: { user_id: teacherId } });
}

let getTotalRoutineDuration = async (routineId) => {
	let videos = await RoutineVideo.findAll({ where: { routine_id: routineId } });
	console.log(videos);
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

let getTotalRoutineMinutDuration = async (routineId) => {
	console.log('Innnnn')
	let videos = await RoutineVideo.findAll({ where: { routine_id: routineId } });
	console.log(videos);
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


		return (hoursMin + minutes);
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
						'Cookie': 'ds_user_id=44372909615; sessionid=44372909615%3A5J1AyRj2nXG37M%3A16;'
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


