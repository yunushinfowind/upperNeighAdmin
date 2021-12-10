const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
var passport   = require('passport');
const fileupload = require('express-fileupload')

const app = express();
const server = require('http').Server(app)


// parse requests of content-type - application/json

require('./app/config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());
app.use(fileupload());
// app.use(cors);

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

 app.use(function (req, res, next) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            res.setHeader('Access-Control-Allow-Headers', '*');
            res.setHeader('Access-Control-Allow-Credentials', true);
            next();
 }); 
const db = require("./app/models");

db.sequelize.sync();

app.use("/swagger", express.static(__dirname + "/swagger"));

require("./app/routes/chat.js")(app);
require("./app/routes/auth.js")(app);
require("./app/routes/user.js")(app);
require("./app/routes/admin.js")(app);
require("./app/routes/user.js")(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
