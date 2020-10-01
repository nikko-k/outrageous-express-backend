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


var port = process.env.PORT || 1300;
var dbString = process.env.MONGOCONSTRING;
mongoose.connect(dbString, { useNewUrlParser: true, useUnifiedTopology: true })
    .catch((reason) => {
        console.error(reason);
    });
var db = mongoose.connection;
var galleryDb = mongoose.connection

db.useDb("outrageous-login");



app.listen(port, () => console.log("Listening on port " + port)); //Starting the HTTP listen server
app.use(helmet()); // Adding Helmet middleware (security)
app.use(express.json()); //Adding json handling

// Add headers (allows non https connections)
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

//Picture uploads handling
const DiskStorage = multer.diskStorage({
    destination: './public/gallery/',
    filename: (req, file, cb) => {
        cb(null, Date.now().toString() + "-" + file.originalname);
    }
})
const upload = multer({ storage: DiskStorage });

//Authorization middleware
authorize = (req,res,next)=>{
if(req.headers.Authorization!==undefined)
{
    token = req.headers.Authorization.split(' ')[1];
    jwt.verify(token,process.env.JWT_SECRET)
    .then((value)=>
    {
        req.username=value.username;
    },
    (reason)=>
    {
        res
        .status(401)
        .send(reason);
    });
}
else{
    res.status(401);
}
}


app.get('/', (req, res) => res.send("Hello"));

app.use('/gallery',express.static('public/gallery'));

app.post('/upload',authorize ,upload.single('picture'), (req, res) => {

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
                            token: jwt.sign({ value }, process.env.JWT_SECRET),
                            username: req.body.username,

                        })
                        .end();
                }
                else {
                    res
                        .status(401)
                        .send({
                            status: "fail",
                            message: "Wrong password!",
                            error: err
                        })
                        .end();
                }
            })
        })
})

app.get('/checktoken/:token', (req, res) => {
    res
        .status(200)
        .send(jwt.verify(req.params.token, process.env.JWT_SECRET))
}
)

app.get('/allusers', (req, res) => {
    mongooseschemas.User.find().exec()
        .then((value) => {
            res
            .status(200)
            .send(value);
        })
    });