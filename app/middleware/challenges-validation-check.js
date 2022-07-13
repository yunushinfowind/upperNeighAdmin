const validator = require('../helpers/validate');


const video = (req, res, next) => {
    const validationRule = {
        "videos": "required",
       
    }
    validator(req.files, validationRule, {}, (err, status) => {
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

const like = (req, res, next) => {
    const validationRule = {
        "challenge_id": "required",
        "type": "required"
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

const comment = (req, res, next) => {
    const validationRule = {
        "challenge_id": "required",
        "comment":"required"
       
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


const reply = (req, res, next) => {
    const validationRule = {
        "comment_id": "required",
        "type": "required"
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

const share = (req, res, next) => {
    const validationRule = {
        "challenge_id": "required"
       
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

const add = (req, res, next) => {
    const validationRule = {
          "practice_name": "required",
          "focus" : "required",
          "duration": "required",
          "mood": "required",
          "productivity": "required"
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if(!status) {
            var errorResponse = [];
            for(const [key, value] of Object.entries(err['errors'])) {
                errorResponse.push(value[0])
            }
            res.status(422)
            .send({
                success: false,
                message: errorResponse[0],
                data: []
            });
            }else {
                next();
            } 
        
    });
}

const practicelike = (req, res, next) => {
    const validationRule = {
        "practice_id": "required",
        "type": "required"
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

const practicecomment = (req, res, next) => {
    const validationRule = {
        "practice_id": "required",
        "comment":"required"
       
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

const practiceshare = (req, res, next) => {
    const validationRule = {
        "challenge_id": "required"
       
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
const practicereply = (req, res, next) => {
    const validationRule = {
        "practice_comment_id": "required",
        "type": "required"
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

module.exports = {reply, video, like, comment, share, add, practicelike, practicecomment, practiceshare, practicereply}