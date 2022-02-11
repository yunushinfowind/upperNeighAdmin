const validator = require('../helpers/validate');
const db = require("../models");
const User = db.user;
const checkAccountStatus =async (req, res, next) => {

    let token = await User.getToken(req);
        let userObj = await User.findOne({ where: { login_token: token , status:'inactive'} });
        if(userObj){
           return res
                .send({
                    success: false,
                    message: 'Sorry , your account in inactivate , please contact to admin.',
                    data: []
                });
        } else {
            next();
        }
}


module.exports = {
    checkAccountStatus
}