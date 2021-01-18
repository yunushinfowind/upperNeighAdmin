const validator = require('../helpers/validate');

const signup = (req, res, next) => {
    const validationRule = {
        "email": "required|email",
        "fullname": "required|string",
        "password": "required|string|min:6",
        "role_id": "required|string",
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            var errorResponse = [];
            for (const [key, value] of Object.entries(err['errors'])) {
                errorResponse.push(value[0])
            }
            res.status(422)
                .send({
                    success: false,
                    message: errorResponse[0],
                    data: []
                });
        } else {
            next();
        }
    });
}
const login = (req, res, next) => {
    const validationRule = {
        "email": "required|email",
        "password": "required|string|min:6"
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            var errorResponse = [];
            for (const [key, value] of Object.entries(err['errors'])) {
                errorResponse.push(value[0])
            }
            res.status(422)
                .send({
                    success: false,
                    message: errorResponse[0],
                    data: []
                });
        } else {
            next();
        }
    });
}
const logout = (req, res, next) => {
    const validationRule = {
        "email": "required|email",
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            var errorResponse = [];
            for (const [key, value] of Object.entries(err['errors'])) {
                errorResponse.push(value[0])
            }
            res.status(422)
                .send({
                    success: false,
                    message: errorResponse[0],
                    data: []
                });
        } else {
            next();
        }
    });
}
const userMessage = (req, res, next) => {
    console.log(req.query)
    const validationRule = {
        "user_id": "required",
        "room_id": "required|integer",
        "page": "required|integer",
    }
    validator(req.query, validationRule, {}, (err, status) => {
        if (!status) {
            var errorResponse = [];
            for (const [key, value] of Object.entries(err['errors'])) {
                errorResponse.push(value[0])
            }
            res.status(422)
                .send({
                    success: false,
                    message: errorResponse[0],
                    data: []
                });
        } else {
            next();
        }
    });
}

const createRoom = (req, res, next) => {

    const validationRule = {
        "userId": "required",
        "type": "required",
    }

    const message = {
        "user_id": "UserId array is required."
    }

    validator(req.body, validationRule, message, (err, status) => {
        if (!status) {
            var errorResponse = [];
            for (const [key, value] of Object.entries(err['errors'])) {
                errorResponse.push(value[0])
            }
            res.status(422)
                .send({
                    success: false,
                    message: errorResponse[0],
                    data: []
                });
        } else {
            next();
        }
    });
}

const joinGroup = (req, res, next) => {

    const validationRule = {
        "room_id": "required|string",
        "users": "required|string"
    }

    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            var errorResponse = [];
            for (const [key, value] of Object.entries(err['errors'])) {
                errorResponse.push(value[0])
            }
            res.status(422)
                .send({
                    success: false,
                    message: errorResponse[0],
                    data: []
                });
        } else {
            next();
        }
    });
}

const sendMessage = (req, res, next) => {

    const validationRule = {
        "from_user": "required",
        "to_user": "required",
        "room_id": "required"
    }

    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            var errorResponse = [];
            for (const [key, value] of Object.entries(err['errors'])) {
                errorResponse.push(value[0])
            }
            res.status(422)
                .send({
                    success: false,
                    message: errorResponse[0],
                    data: []
                });
        } else {
            next();
        }
    });
}
const socialLogin = (req, res, next) => {

    const validationRule = {
        "type": "required",
        "first_name": "required",
        // "last_name": "required",
        "email": "required",
        "profile": "required",
        "role_id": "required",
        "source_id": "required",
        "device_id": "required"
    }

    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            var errorResponse = [];
            for (const [key, value] of Object.entries(err['errors'])) {
                errorResponse.push(value[0])
            }
            res.status(422)
                .send({
                    success: false,
                    message: errorResponse[0],
                    data: []
                });
        } else {
            next();
        }
    });
}

const userIdValidation = (req, res, next) => {

    const validationRule = {
        "user_id": "required"
    }
    validator(req.query, validationRule, {}, (err, status) => {
        if (!status) {
            var errorResponse = [];
            for (const [key, value] of Object.entries(err['errors'])) {
                errorResponse.push(value[0])
            }
            res.status(422)
                .send({
                    success: false,
                    message: errorResponse[0],
                    data: []
                });
        } else {
            next();
        }
    });
}

const changePassword = (req, res, next) => {

    const validationRule = {
        "current_password": "required",
        "new_password": "required",
        "confirm_password": "required"
    }
    validator(req.query, validationRule, {}, (err, status) => {
        if (!status) {
            var errorResponse = [];
            for (const [key, value] of Object.entries(err['errors'])) {
                errorResponse.push(value[0])
            }
            res.status(422)
                .send({
                    success: false,
                    message: errorResponse[0],
                    data: []
                });
        } else {
            next();
        }
    });
}

const addBlog = (req, res, next) => {

    const validationRule = {
        "title": "required",
        "description": "required"
    }
    validator(req.query, validationRule, {}, (err, status) => {
        if (!status) {
            var errorResponse = [];
            for (const [key, value] of Object.entries(err['errors'])) {
                errorResponse.push(value[0])
            }
            res.status(422)
                .send({
                    success: false,
                    message: errorResponse[0],
                    data: []
                });
        } else {
            next();
        }
    });
}

module.exports = {
    signup, userMessage, createRoom, joinGroup, sendMessage, userIdValidation, login, logout,
    socialLogin, changePassword, addBlog
}