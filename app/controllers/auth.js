const db = require("../models");
const User = db.user;
const Room = db.room;
const Op = db.Sequelize.Op;
const bcrypt = require('bcrypt');
var passport = require('passport');
var bcryptjs = require('bcryptjs');
var auth = require('../config/passport');
var nodemailer = require('nodemailer');
var appRoot = require('app-root-path');
const config = require("../config/config.js");



// Create and Save a new user
exports.register = (req, res) => {


	var fileName = '';
	if (req.files) {
		const image = req.files.profile
		const path = 'uploads/profile/' + image.name
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
	var salt = 10;
	var passwordHash;
	var userData = {};
	bcrypt.hash(req.body.password, salt, (err, encrypted) => {
		passwordHash = encrypted;
		userData = {
			email: req.body.email,
			password: passwordHash,
			fullname: req.body.fullname,
			profile: fileName,
			role_id: req.body.role_id
		};
		User.findOne({ where: { email: req.body.email } }).then(
			user => {
				if (!user) {
					User.create(userData)
						.then(data => {
							res.send({ 'success': true, 'data': data });
						})
						.catch(err => {
							res.status(500).send({
								'success': false,
								message:
									err.message || "Some error occurred while creating the Tutorial."
							});
						});
				} else {
					res.status(421).send({
						'success': false,
						message: "Email Already exist."

					});
				}
			}

		)

	})

};

exports.updateProfile = async function (req, res, next) {

	console.log(req.files);
	try {
		var fileName;
		if (req.files) {
			const image = req.files.profile
			const path = __dirname + '/images/' + image.name
			await image.mv(path, (error) => {
				if (error) {
					console.error(error)
					res.writeHead(500, {
						'Content-Type': 'application/json'
					})
					res.end(JSON.stringify({ status: 'error', message: error }))
				}
			})
			fileName = image.name;
		}

		if (req.body.type == 'private') {
			var userModel = await User.findOne({ where: { id: req.body.user_id } });
			if (userModel) {
				if (req.body.name) {
					userModel.name = req.body.name;
				}
				if (req.files) {
					userModel.profile = fileName;
				}
				userModel.save();
				res.send({ 'success': true, message: "profile updated successfully.", data: userModel });
			}
			res.send({ 'success': false, message: "record not found.", data: [] });
		} else {
			var roomModel = await Room.findOne({ where: { id: req.body.user_id } });
			if (roomModel) {
				if (req.body.name) {
					roomModel.group_name = req.body.name;
				}
				if (req.files) {
					roomModel.group_image = fileName;
				}
				roomModel.save();
				res.send({ 'success': true, message: "profile updated successfully.", data: roomModel });
			}
			res.send({ 'success': false, message: "record not found.", data: [] });
		}
	} catch (error) {
		res.send({ 'success': false, message: error.message, data: [] });
	}

}

exports.login = async function (req, res, next) {

	try {
		let user = await User.findOne({ where: { email: req.body.email, role_id: req.body.role_id } });
		if(user && user.status == 'inactive'){
		return	res.send({ 'success': false, message: "You account is inactive , Please contact to admin." });
		}
		if (user) {
			await bcrypt.compare(req.body.password, user.password, function (err, isMatch) {
				if (err)
					console.log(err);
				if (isMatch) {
					let token = User.generateToken();
					var obj = Object.assign({}, user.get());
					obj.login_token = token;
					let updateData = {
						login_token: token,
						device_id: req.body.device_id
					}
					User.update(updateData, { where: { email: obj.email } });

					res.send({ 'success': true, 'data': obj });
				} else {
					res.send({ 'success': false, message: "invalid credential" });
				}
			});
		}
		else {
			res.status(200).send({
				'success': false, message: "Invalid credential."
			});
		};
	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}

}

exports.socialLogin = async function (req, res, next) {

	try {

		let token = User.generateToken();
		var user = await User.findOne({ where: { source_id: req.body.source_id } });
		if(user && user.status == 'inactive'){
			return	res.send({ 'success': false, message: "You account is inactive , Please contact to admin." });
		}
		if (user) {
			let updateData = {
				login_token: token
			}
			await User.update(updateData, { where: { id: user.id } })
			user = await User.findOne({ where: { source_id: req.body.source_id } });
		} else {
			let userData = {
				email: req.body.email,
				fullname: req.body.first_name,
				profile: req.body.profile,
				role_id: req.body.role_id,
				type: 'social',
				source_id: req.body.source_id,
				device_id: req.body.device_id,
				social_type: req.body.type,
				login_token: token
			}
			user = await User.create(userData);
		}
		res.send({ success: true, message: '', data: user });
	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}

}

exports.logout = function (req, res, next) {
	console.log(res.body);
	User.findOne({ where: { email: req.body.email } }).then(data => {
		let updateData = {
			login_token: ''
		}
		User.update(updateData, { where: { email: data.email } });
		res.send({ 'success': true, 'message': 'Logout Successfully.' });
	}).catch(err => {
		res.status(500).send({
			message:
				err.message || "Invalid credential."
		});
	});

}

exports.checkToken = async function (req, res, next) {

	try {
		let token = await User.getToken(req);
		let isValidToekn = await validateToekn(token);
		if (isValidToekn) {
			res.send({ 'success': true, 'message': 'Valid' });
		} else {
			res.send({ success: false, message: "Invalid token", data: [] });
		}
	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}
}

exports.userLogOut = async function (req, res, next) {

	try {

		let token = await User.getToken(req);
		let isValidToekn = await validateToekn(token);
		if (isValidToekn) {
			let loginId = await getLoginUserId(token);
			await User.findOne({ where: { id: loginId } });
			let updateData = {
				login_token: ''
			}
			User.update(updateData, { where: { id: loginId } });
			res.send({ 'success': true, 'message': 'Logout Successfully.' });
		} else {
			res.send({ success: false, message: "Invalid token", data: [] });
		}
	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}
}
// Retrieve all Tutorials from the database.
exports.findAll = (req, res) => {
	const title = req.query.title;
	var condition = title ? { title: { [Op.like]: `%${title}%` } } : null;

	Tutorial.findAll({ where: condition })
		.then(data => {
			res.send(data);
		})
		.catch(err => {
			res.status(500).send({
				message:
					err.message || "Some error occurred while retrieving tutorials."
			});
		});
};

// Find a single Tutorial with an id
exports.findOne = (req, res) => {
	const id = req.params.id;

	Tutorial.findByPk(id)
		.then(data => {
			res.send(data);
		})
		.catch(err => {
			res.status(500).send({
				message: "Error retrieving Tutorial with id=" + id
			});
		});
};

// Update a Tutorial by the id in the request
exports.update = (req, res) => {
	const id = req.params.id;

	Tutorial.update(req.body, {
		where: { id: id }
	})
		.then(num => {
			if (num == 1) {
				res.send({
					message: "Tutorial was updated successfully."
				});
			} else {
				res.send({
					message: `Cannot update Tutorial with id=${id}. Maybe Tutorial was not found or req.body is empty!`
				});
			}
		})
		.catch(err => {
			res.status(500).send({
				message: "Error updating Tutorial with id=" + id
			});
		});
};

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

let getUserImage = (userid) => {
	User.findOne({ where: { id: userid } }).then(user => {
		var imagePath = appRoot.path + '/app/controlles/images/' + user.profile;
		return imagePath;
	});
}

// reset password 

exports.forgotPassword = async (req, res) => {
	try {
		let user = await User.findOne({ where: { email: req.body.email, role_id: 2 } });
		if (user) {

			var smtpConfig = {
				service: 'gmail',
				host: 'smtp.gmail.com',
				port: 587,
				secure: false,
				requireTLS: true,
				auth: {
					user: config.EMAIL,
					pass: config.PASS
				}
			};
			var otp = '';
			length = 4;
			chars = "0123456789";
			for (var i = length; i > 0; --i)
				otp += chars[Math.floor(Math.random() * chars.length)];

			var userData = {
				user_otp: otp,
			};

			User.update(userData, { where: { email: req.body.email } });

			var message = '<B>Your OTP is :' + otp + '</b>';
			var transporter = nodemailer.createTransport(smtpConfig);
			var mailOptions = {
				from: config.EMAIL, // sender address
				to: req.body.email, // list of receivers
				subject: "Forgot Password", // Subject line
				text: 'Your OTP', // plaintext body
				html: message // html body
			};

			transporter.sendMail(mailOptions, function (error, info) {
				if (error) {
					return res.send({ success: false, message: error.message, data: [] });
				}
				else {
					res.send({ success: true, message: "OTP has been sent to your email Id successfully.", data: [] });
				}
			});
		} else {
			res.send({ success: false, message: "Sorry, Email Not Found.", data: [] });
		}

	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}
}


//check user opt 

exports.checkOtp = async (req, res) => {
	try {
		if (req.body.email == "" || req.body.email == undefined) {
			res.send({ success: false, message: "Email is required", data: [] });
		} else if (req.body.otp == "" || req.body.otp == undefined) {
			res.send({ success: false, message: "OTP is required", data: [] });
		} else {
			let user = await User.findOne({ where: { email: req.body.email, role_id: 2, user_otp: req.body.otp } });
			if (user) {

				//User.update(userData, { where: { email: req.body.email } });

				res.send({ success: true, message: "OTP is valid", data: [] });

			} else {
				res.send({ success: false, message: "Sorry, Invalid otp.", data: [] });
			}
		}
	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}
}
// update new password
exports.updatePassword = async (req, res) => {
	try {
		if (req.body.email == "" || req.body.email == undefined) {
			res.send({ success: false, message: "Email is required", data: [] });
		} else if (req.body.new_password == "" || req.body.new_password == undefined) {
			res.send({ success: false, message: "New password is required", data: [] });
		} else {
			let user = await User.findOne({ where: { email: req.body.email, role_id: 2 } });
			if (user) {
				var salt = 10;
				var updateData = {};
				bcrypt.hash(req.body.new_password, salt, (err, passwordHash) => {
					updateData = {
						user_otp: "",
						password: passwordHash,
					};
					User.update(updateData, { where: { email: req.body.email } });
				})
				res.send({ success: true, message: "Your Password updated successfully.", data: [] });

			} else {
				res.send({ success: false, message: "Sorry, Email not found.", data: [] });
			}
		}
	} catch (e) {
		res.send({ success: false, message: e.message, data: [] });
	}
}
