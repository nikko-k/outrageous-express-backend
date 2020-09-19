require('dotenv').config();
const fs = require("fs");
const helmet = require('helmet');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const express = require('express');
const mongoose = require('mongoose');
const mongooseschemas = require('./mongoose-models');
const jwt = require('jsonwebtoken');
const { application } = require('express');

const app = express();


var port = process.env.PORT;
var dbString = process.env.MONGOCONSTRING;
mongoose.connect(dbString, { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;

db.useDb("outrageous-login");



app.listen(port, () => console.log("Listening on port " + port)); //Starting the HTTP listen server
app.use(helmet()); // Adding Helmet middleware (security)
app.use(express.json());

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


const DiskStorage = multer.diskStorage({
    destination: './public/images/',
    filename: (req, file, cb) => {
        cb(null, Date.now().toString() + "-" + file.originalname);
    }
})

const upload = multer({ storage: DiskStorage });

app.get('/', (req, res) => res.send("Hello"));

app.get('/uploadsfilenames', (res, req) => {
    console.log(fs.readdir('.public/images/'));
})

app.post('/upload', upload.single('picture'), (req, res) => {
    res
        .status(200)
        .contentType("text/plain")
        .send("Should be okay, probably isn't")
        .end();
})

app.post('/signup', (req, res) => {


    newUser = new mongooseschemas.User(
        {
            username: req.body.username,
            password: bcrypt.hashSync(req.body.password, 10),
            email: req.body.email

        }
    );
    newUser.save()
        .then(value => {
            res
                .status(200)
                .send({
                    result: "success",
                    message: "user sucessfully added"
                }
                );
        })
        .catch(err => {
            if (err.keyPattern.email == 1) {
                res
                    .status(200)
                    .send({
                        result: "failed",
                        message: "Email in use!"
                    });
            }
            if (err.keyPattern.username == 1) {
                res
                    .status(200)
                    .send({
                        result: "failed",
                        message: "Username in use!"
                    });
            }
        });
});



app.post('/signin', (req, res) => {
    mongooseschemas.User.findOne({ username: req.body.username }).exec()
        .then(value => {

            bcrypt.compare(req.body.password, value.password, (err, same) => {
                if (same) {
                    res
                        .status(200)
                        .send({
                            status: "Success",
                        token: jwt.sign({value}, process.env.JWT_SECRET)
                        })
                }
                else {
                    res
                        .send({
                            status: "fail",
                            message: "Wrong password!",
                            error: err
                        })
                }
            })
        })
})

app.get('/checktoken/:token',(req,res)=>{
    res
    .status(200)
    .send(jwt.verify(req.params.token,process.env.JWT_SECRET))
}
)