const db = require("../models");
const UserRoom = db.user_room;
const Room = db.room;
const Message = db.message;
const User = db.user;
const Op = db.Sequelize.Op;
const bcrypt = require('bcrypt');
var passport = require('passport');
var bcryptjs = require('bcryptjs');
var auth = require('../config/passport');
var dateFormat = require('dateformat');
const Sequelize = require('sequelize');
const config = require("../config/config.js");
var ffmpeg = require('fluent-ffmpeg');



exports.createRoom = async (req, res) => {

	const { Op } = require("sequelize");
	let userIds = JSON.parse(req.body.userId);
	let firstUserId = userIds[0];
	let allUsers = userIds;
	var roomData = {
		room_id: getRandomString(8)
	}
	if (req.body.group) {
		var roomData = {
			room_id: getRandomString(8),
			group_name: req.body.group
		}
	}
	if (req.body.type == 'group') {
		console.log('group')
		var data = await Room.create(roomData);
		if (data) {
			for (const element of allUsers) {
				let userRoomData = {};
				userRoomData = {
					user_id: element,
					room_id: data.id,
					type: 'group'
				}
				await UserRoom.create(userRoomData);
			}
			res.send({ data: data, message: "Room Created successfully." });
		}
	}else{
			console.log(req.body);
			var firstUserRoom = await UserRoom.findOne({where:{
				[Op.and]:[{ user_id: firstUserId },{type:'private'},{to_user:userIds[1]}]
				}});
				var exist = 0;
				if(firstUserRoom){
					var secondUser = await UserRoom.findOne({where:{
						[Op.and]:[{ user_id: userIds[1] },{type:'private'},{to_user:userIds[0]}]
						}});
						secondUser = secondUser.get();
						if(secondUser && (firstUserRoom.room_id == secondUser.room_id)){
							 exist = 1;
						}else{
							 exist = 0;
						}
						if(!exist){
							var data = await Room.create(roomData);
							if(data){
								i = 1;
								
							for (const element of allUsers) {
								let userRoomData = {
										user_id:element,
										room_id:data.id,
										to_user : userIds[index],
										type:'private'
									}
									console.log('userRoomData');
									console.log(userRoomData);
									var result = UserRoom.create(userRoomData);
									i--;
								}
								res.send({data:data,message:"Room Created successfully."});
							}
						}else{
							firstuser = userIds[0];
							seconduser = userIds[1];
							 var room = await Room.findOne({where:{id:firstUserRoom.room_id}})
							 var message = await Message.findOne({where:
								{
								[Op.or]:[
								    {[Op.and]:[ { user_id: firstuser },{to_user: seconduser}]},
									{[Op.and]:[ { user_id: seconduser },{to_user: firstuser}]}
									]
								}
							   });
							 var obj = Object.assign({}, room.get());
							 obj.chat_initiated = (message)?'yes':'no';
							 res.send({data:obj,message:"Room Created successfully."});
						}
			
				}else{
					console.log('else')
					   var data = await Room.create(roomData)
						if(data){
							index = 1;
						for (const element of allUsers) {
						let userRoomData = {};
							userRoomData = {
								user_id:element,
								room_id:data.id,
								to_user : userIds[index],
								type:'private'
							}
							await UserRoom.create(userRoomData);
							index--;
						}
						 var obj = Object.assign({}, data.get());
							 obj.chat_initiated = 'no';
						res.send({data:obj,message:"Room Created successfully."});
					}
				
				}
		}

};

exports.sendMessage = async function (req, res, next) {

	try {
		var uploadedFile = req.files;
		console.log(uploadedFile);
		var fileArray = []
		if (uploadedFile) {
			uploadedFile = ((uploadedFile != 'null') && !Array.isArray(uploadedFile['files[]'])) ? [uploadedFile['files[]']] : uploadedFile['files[]'];
			for (const image of uploadedFile) {
				var path = __dirname + '/images/' + image.name
				image.mv(path, (error) => {
					if (error) {
						console.error(error)
						res.writeHead(500, {
							'Content-Type': 'application/json'
						})
						res.end(JSON.stringify({ status: 'error', message: error }))

					}
				})

				var mimeType = image.mimetype;
				var type;
				if (mimeType.indexOf('mp4') >= 0) {
					type = 'mp4';
				} else if (mimeType.indexOf('image') >= 0) {
					type = 'image';
				} else {
					type = 'file';
				}
				let fileData = {
					name: image.name,
					size: bytesToSize(image.size),
					type: type,
					fileUrl: config.HOST + '/app/controllers/images/' + image.name
				}
				if (type == 'mp4') {
					/*var proc = await  new  ffmpeg(config.HOST +'/app/controllers/images/'+ image.name);
					  proc.takeScreenshots({
						  count: 1,
						  timemarks: [ '600' ] // number of seconds
						}, './app/controllers/images/thumbnail/', function(err) {
							
						console.log('screenshots were saved')
					  });*/

					ffmpeg.setFfprobePath("C:\ffmpeg\bin\ffprobe.exe");
					ffmpeg.ffprobe(config.HOST + '/app/controllers/images/' + image.name, function (err, metadata) {
						if (err) {
							console.log(err);
						}
						else {
							console.log(metadata);
							/*
							ffmpeg(config.HOST +'/app/controllers/images/'+ image.name)
							.screenshots({
								timestamps: [30.5, '50%', '01:10.123'],
							filename: 'thumbnail-at-%s-seconds.png',
							folder: './app/controllers/images/thumbnail/',
							size: '320x240'
						  });*/
						}
					});

				}
				fileArray.push(fileData)
			}
		}

		if (req.body.message_id) {
			const messageObj = await Message.findOne({ where: { id: req.body.message_id } });
			if (!messageObj) {
				throw Error(`messageObj not updated. id: ${id}`);
			}
			messageObj.message = req.body.message;
			await messageObj.save();
			var messageData = await Message.findOne({ where: { id: req.body.message_id } });
		} else {

			let userMessage = {
				room_id: req.body.room_id,
				user_id: req.body.from_user,
				message: (req.body.message || req.body.message != 'undefined') ? req.body.message : '',
				to_user: (req.body.to_user) ? req.body.to_user : '',
				read_by: req.body.from_user,
				files: (fileArray.length != 0) ? JSON.stringify(fileArray) : ''
			}
			var messageData = await Message.create(userMessage);
		}
		if (messageData) {
			var mes = await Message.findOne(
				{
					where: { id: messageData.id },
					include: [{
						model: db.user
					}
					]
				}
			);

			var newFileArray = [];
			var fileArray = (mes.files) ? JSON.parse(mes.files) : mes.files;
			if (fileArray) {
				for (const row of fileArray) {
					row.url = (row.type == 'image') ? config.HOST + '/app/controllers/images/' + row.name : config.HOST + '/app/controllers/images/image_icon.png';
					name: row.name,
						newFileArray.push(row);
				}
			}

			var obj = Object.assign({}, mes.get());
			obj.created_at = timeAgo(obj.created_at, obj.user.timezone);
			obj.files = newFileArray;
			res.send({ success: true, message: "Message sent successfully.", data: obj });
		}
	} catch (error) {
		console.log('error')
		console.log(error)
	}

}

exports.deleteMessage = async function (req, res, next) {

	try {
		let messageId = req.query.message_id;
		await Message.destroy({
			where: {
				id: messageId
			}
		});
		res.send({ success: true, message: "Message deleted successfully.", data: [] });
	} catch (e) {
		console.log(e);
	}
}

exports.deleteChat = async function (req, res, next) {

	try {
		let roomId = req.query.room_id;
		var messages = await Message.findAll({
			where: {
				room_id: roomId
			}
		});
		console.log(messages)
		messages.forEach(message => {
			let updatedata = {
				deleted_by: (!message.deleted_by) ? req.query.user_id : message.deleted_by + "," + req.query.user_id
			}
			Message.update(updatedata, {
				where: { id: message.id }
			})
		})
		res.send({ success: true, message: "Chat deleted successfully.", data: [] });


	} catch (e) {
		console.log(e);
	}
}

exports.readMessage = async function (req, res, next) {

	try {
		let messageId = req.query.message_id;
		let userId = req.query.user_id;
		var message = await Message.findOne({
			where: {
				id: messageId
			}
		});
		var read_by = message.read_by + ',' + userId;
		message.read_by = read_by;
		message.save();

		res.send({ success: true, message: "Message read successfully.", data: [] });
	} catch (e) {
		console.log(e);
	}
}

exports.userMessage = async function (req, res, next) {

	const { Op } = require("sequelize");
	let loginUserId = req.query.user_id;
	var All = [];
	var allFiles = [];
	// query for read to unread message 
	var allMyMessages = await Message.findAll({
		where: {
			[Op.and]: [
				{ room_id: req.query.room_id },
				{ user_id: { [Op.ne]: loginUserId } },
			]
		}
	}
	)
	for (const message of allMyMessages) {
		let updatedata = {
			read_by: message.read_by + ',' + loginUserId
		}
		let readUser = message.read_by;
		let readArray = [];
		let update = 1;
		readArray = JSON.parse("[" + readUser + "]");
		readArray.forEach(row => {
			if (loginUserId == parseInt(row)) {
				update = 0;
			}
		})
		if (update) {
			Message.update(updatedata, {
				where: { id: message.id }
			})
		}
	}
	// query for message listing with pagination
	let limit = 20
	let offset = 0 + (req.query.page - 1) * limit
	var result = await Message.findAndCountAll({
		where: {
			[Op.and]: [{ room_id: req.query.room_id }]
		},
		limit: limit,
		offset: offset,
		include: [{
			model: db.user
		}, { model: db.room }, { model: db.user, as: "toUser" }
		],
		order: [['id', 'DESC']]
	}
	);
	for (const row of result['rows']) {
		/*var unreadCount =  await db.sequelize.query("SELECT COUNT('*') as count FROM `messages` WHERE user_id != "+loginUserId+" and room_id = "+row.room_id+" and !FIND_IN_SET("+loginUserId+",read_by)", {
				 type: db.sequelize.QueryTypes.SELECT
				 });*/
		var newFileArray = [];
		var fileArray = (row.files) ? JSON.parse(row.files) : row.files;
		if (fileArray) {
			for (const row of fileArray) {
				let url = (row.type == 'image') ? config.HOST + '/app/controllers/images/' + row.name : config.HOST + '/app/controllers/images/image_icon.png';
				row.url = url;
				name: row.name,
					newFileArray.push(row);
			}
		}
		var obj = Object.assign({}, row.get());
		obj.created_at = timeAgo(obj.created_at, obj.user.timezone);
		//obj.unreadCount = unreadCount[0].count;
		obj.files = newFileArray;
		All.push(obj);

	}
	result['rows'] = All;
	result['currentPage'] = req.query.page;
	result['totalPages'] = Math.ceil(result['count'] / limit);
	result['allImages'] = [];
	await res.send({ success: true, message: "", data: result });

}

exports.userDetail = async function (req, res, next) {

	try {


		result = await User.findOne({
			where: { id: req.query.user_id }
		});

		res.send({ success: true, message: "", data: result });

	} catch (e) {
		console.log(e);
	}
}

exports.userList = async function (req, res, next) {

	try {

		const { Op } = require("sequelize");
		let loginUserId = req.query.user_id;
		var All = [];
		var userIds = [];
		userIds.push(loginUserId);


		if (req.query.room_id) {
			// query for connected userIds
			var connectedRooms = await UserRoom.findAll({
				where: {
					room_id: req.query.room_id
				},
			})
			connectedRooms.forEach(row => {
				userIds.push(row.user_id);
			});

		}

		var whereCon = {
			id: { [Op.notIn]: userIds }
		}
		// condition for searching
		if (req.query.search) {
			whereCon = {
				[Op.and]: [
					{
						id: {
							[Op.notIn]: userIds
						}
					},
					{
						name: {
							[Op.like]: '%' + req.query.search + '%'
						}
					}
				]
			}
		}
		// query for userList
		result = await User.findAll({
			where: whereCon,
			order: [['id', 'DESC']]
		});

		result.forEach(row => {
			var obj = Object.assign({}, row.get());
			obj.created_at = timeAgo(obj.created_at, obj.timezone);
			All.push(obj);
		});
		res.send({ success: true, message: "", data: All });

	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}
}

exports.allUserList = async function (req, res, next) {

	try {

		const { Op } = require("sequelize");
		let loginUserId = req.query.user_id;
		var All = [];
		var userIds = [];
		userIds.push(loginUserId);


		var whereCon = {
			id: { [Op.notIn]: userIds }
		}
		// condition for searching
		if (req.query.search) {
			whereCon = {
				[Op.and]: [{
					id: {
						[Op.notIn]: userIds
					}
				},
				{
					name: {
						[Op.like]: '%' + req.query.search + '%'
					}
				}
				]
			}
		}
		// query for userList
		let limit = 10;
		let offset = 0 + (req.query.page - 1) * limit
		result = await User.findAndCountAll({
			where: whereCon,
			order: [['id', 'DESC']],
			limit: limit,
			offset: offset,
		});

		if (result['rows'].length > 0) {
			for (const row of result['rows']) {
				var obj = Object.assign({}, row.get());
				obj.created_at = timeAgo(obj.created_at, obj.timezone);
				All.push(obj);
			}
		}
		result['rows'] = All;
		result['currentPage'] = req.query.page;
		result['totalPages'] = Math.ceil(result['count'] / limit);
		res.send({ success: true, message: "", data: result });

	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}
}

exports.joinGroup = async function (req, res, next) {

	try {
		var users = JSON.parse(req.body.users);
		const { Op } = require("sequelize");
		var All = [];
		users.forEach(userId => {
			let userData = {
				room_id: req.body.room_id,
				user_id: userId,
				type: 'group'
			}
			UserRoom.create(userData);
		});
		res.send({ success: true, message: "Joined Successfully.", data: [] });
	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}

}

exports.removeFromGroup = async function (req, res, next) {

	try {
		const { Op } = require("sequelize");
		let roomId = req.body.room_id;
		let userid = req.body.user_id;
		var All = [];
		await UserRoom.destroy({
			where: {
				[Op.and]: [{ room_id: roomId }, { user_id: userid }]
			}
		})

		res.send({ success: true, message: "Removed from group.", data: [] });
	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}
}

exports.groupUsers = async function (req, res, next) {

	try {
		console.log(req.query)
		var users = await UserRoom.findAll({
			where: { room_id: req.query.room_id },
			include: [{
				model: db.user
			}
			]
		}
		);
		res.send({ success: true, message: "Joined Successfully.", data: users });
	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}
}

exports.myRoomId = function (req, res, next) {
	const { Op } = require("sequelize");
	let loginUserId = req.query.user_id;
	var All = [];
	UserRoom.findAll({
		where: {
			user_id: loginUserId
		},
	}).then(
		result => {
			result.forEach(row => {
				All.push(row.room_id);
			});
			res.send({ success: true, message: "", data: All });
		}
	)
		.catch(err => {
			res.status(500).send({
				message:
					err.message || "Invalid credential."
			});
		});
}

exports.myRooms = function (req, res, next) {
	const { Op } = require("sequelize");
	let loginUserId = req.query.user_id;
	var All = [];
	UserRoom.findAll({
		where: {
			user_id: loginUserId
		},
		include: [
			{ model: db.room }
		],
	}).then(
		result => {
			result.forEach(row => {
				All.push(row.room.room_id);
			});
			res.send({ success: true, message: "", data: All });
		}
	)
		.catch(err => {
			res.status(500).send({
				message:
					err.message || "Invalid credential."
			});
		});
}


exports.connectedUserList = async function (req, res, next) {

	var userId = req.query.user_id;
	var search = req.query.search;
	var array = [];
	var roomIds = [];
	//var rooms = JSON.parse(req.query.rooms);

	var userRooms = await UserRoom.findAll({
		where: {
			user_id: userId
		},
		// group: ['room_id'],
	});

	userRooms.forEach(row => {
		if (!roomIds.includes(row.room_id)) {
			roomIds.push(row.room_id);
		}
	});

	var whereCon = {
		room_id: {
			[Op.in]: roomIds
		}
	}

	try {
		if (roomIds.length > 0) {
			var result = await Message.findAll({
				attributes: ['room_id', [db.Sequelize.fn("max", db.Sequelize.col('id')), 'maxId']
				],
				where: whereCon,
				group: ['room_id'],
				/*order: [
						 ['id', 'DESC'],
					   ],*/
			}
			);
			var response = result;
			var Ids = [];
			response.forEach(element => {
				var obj = Object.assign({}, element.get());
				Ids.push(obj.maxId);
			});

			var innerWhereCondition = {
				id: {
					[Op.in]: Ids
				}
			}
			if (req.query.search) {
				innerWhereCondition = {
					[Op.and]: [{
						id: {
							[Op.in]: Ids
						}
					},
					{
						[Op.or]: [
							{
								'$toUser.name$': {
									[Op.like]: '%' + req.query.search + '%'
								}
							},
							{
								'$room.group_name$': {
									[Op.like]: '%' + req.query.search + '%'
								}
							},
							{
								'$user.name$': {
									[Op.like]: '%' + req.query.search + '%'
								}
							}
						]
					}
					]
				}
			}
			//var roomIds = rooms.join(", ");
			let limit = 10;
			let offset = 0 + (req.query.page - 1) * limit
			var allMessage = await Message.findAndCountAll({
				where: innerWhereCondition,
				attributes: ['id', 'room_id', 'user_id', 'to_user', 'message', 'read_by', 'created_at'],
				include: [{
					model: db.user
				}, { model: db.room }, { model: db.user, as: "toUser" }
				],
				order: [
					['id', 'DESC'],
				],
				limit: limit,
				offset: offset,
			});
			if (allMessage['rows'].length > 0) {
				for (const row of allMessage['rows']) {
					var unreadCount = await db.sequelize.query("SELECT COUNT('*') as count FROM `messages` WHERE user_id != " + userId + " and room_id = " + row.room_id + " and !FIND_IN_SET(" + userId + ",read_by)", {
						type: db.sequelize.QueryTypes.SELECT
					});

					var obj = Object.assign({}, row.get());
					obj.unreadCount = unreadCount[0].count;
					obj.created_at = timeAgo(obj.created_at, obj.user.timezone);
					array.push(obj);
				}
			}
			allMessage['rows'] = array;
			allMessage['currentPage'] = req.query.page;
			allMessage['totalPages'] = Math.ceil(allMessage['count'] / limit);
			res.send({ success: true, message: "", data: allMessage });
		}
		res.send({ success: true, message: "", data: array });

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

async function getLatestMessage(roomId, userId) {
	const { Op } = require("sequelize");
	var message = '';
	let response = await Message.findOne({
		where: [{ room_id: roomId }],
		order: [['created_at', 'DESC']]
	});
	return response.message;
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

