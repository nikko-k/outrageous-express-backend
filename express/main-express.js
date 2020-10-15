const fs = require("fs");
const helmet = require('helmet');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const express = require('express');
const mongoose = require('mongoose');
const mongooseschemas = require('./mongoose-models');
const jwt = require('jsonwebtoken');
const randomstrings = require('@supercharge/strings')
const nodemailer = require('nodemailer');
const { env } = require("process");
const axios = require('axios');
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
let authorize = (req, res, next) => {

    let token = '';

    if (req.headers.authorization !== null && req.headers.authorization !== undefined) {
        token = req.headers.authorization.split(' ')[1];
    }
    else {
        res
            .status(401)
            .send('Wrong token')
            .end();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            res
                .status(501)
                .send(err)
                .end();
        }
        else {
            req.data = decoded;
            next();
        }
    })
}


app.get('/', (req, res) => res.send("Hello"));

app.use('/gallery', express.static('public/gallery'));

app.post('/upload', authorize, upload.single('picture'), (req, res) => {

    let myPic = new mongooseschemas.galleryPhoto(
        {
            uri: req.protocol + '://' + req.get('host') + '/gallery/' + req.file.filename,
            postedBy: req.username,
            postedDate: Date.now()
        }
    )
    myPic.save();

    res
        .status(200)
        .contentType("text/plain")
        .send("Should be okay, probably isn't ")
        .end();
})

app.post('/signup', (req, res) => {

    newUser = new mongooseschemas.User(
        {
            username: req.body.username,
            password: bcrypt.hashSync(req.body.password, 10),
            email: req.body.email,
            verificationCode: randomstrings.random(20)
        }
    );
    newUser.save()
        .then(value => {
            console.log(value);
            res
                .status(200)
                .send({
                    result: "success",
                    message: "User sucessfully added"
                }
                );
        })
        .catch(err => {
            console.log(err);
            if (err.keyPattern.email == 1) {
                res
                    .status(401)
                    .send({
                        result: "failed",
                        message: "Email in use!"
                    });
            }
            if (err.keyPattern.username == 1) {
                res
                    .status(401)
                    .send({
                        result: "failed",
                        message: "Username in use!"
                    });
            }
        });
});

app.get('/verifyaccount/:verificationcode', (req, res) => {
    mongooseschemas.User.updateOne({ verificationCode: req.params.verificationcode }, { $set: { verified: true } }).exec()
        .then((value) => {
            res.status(200).send();
        },
            (reason) => {
                res.status(501).send();
            });
})

app.post('/signin', (req, res) => {
    mongooseschemas.User.findOne({ username: req.body.username }).exec()
        .then(value => {
            if (value === null || value === undefined) {
                res
                    .status(401)
                    .send({
                        status: "fail",
                        message: "Wrong credentials!",
                    })
                    .end();
            }
            else {
                bcrypt.compare(req.body.password, value.password, (err, same) => {
                    if (same) {
                        res
                            .status(200)
                            .send({
                                status: "Success",
                                token: jwt.sign({ value }, process.env.JWT_SECRET),

                            })
                            .end();
                    }
                    else {
                        res
                            .status(401)
                            .send({
                                status: "fail",
                                message: "Wrong credentials!",
                                error: err
                            })
                            .end();
                    }
                })
            }
        },
            (reason) => {
                res.status(401).send();
            })
})

app.get('/allgalleryposts', (req, res) => {
    mongooseschemas.galleryPhoto.find().sort({ postedDate: 'desc' }).exec()
        .then((value) => {
            setTimeout(() => {
                res
                    .status(200)
                .send(value);
            }, 1000);

        },
            (reason) => {
                res
                    .status(404)
                    .end();
            })
});

app.get('/getgallerypost/:post', (req, res) => {
    mongooseschemas.galleryPhoto.findById(req.params.post).exec()
        .then((value) =>
            res
                .status(200)
                .send(value),
            (reason) => {
                res
                    .status(404)
                    .end();
            })
})

app.get('/getfirstgalleryposts/:nrofposts', (req, res) => {
    mongooseschemas.galleryPhoto
        .find()
        .sort({ postedDate: 'desc' })
        .limit(parseInt(req.params.nrofposts))
        .exec()
        .then((value) => {
            res.send(value);
        },
            (reason) => {
                res.send(reason);
            });
});

app.post('/likegallerypost/:post', authorize, (req, res) => {

    mongooseschemas.galleryPhoto.findById(req.params.post).exec()
        .then((value) => {
            console.log(req.data);
            if (value.likedBy.includes(req.data.value._id)) {
                mongooseschemas.galleryPhoto.updateOne(
                    { _id: req.params.post },
                    { $pull: { likedBy: req.data.value._id} },
                    (err, raw) => { })
                res.send(value);
            }
            else {
                mongooseschemas.galleryPhoto.updateOne(
                    { _id: req.params.post },
                    { $push: { likedBy: req.data.value._id } },
                    (err, raw) => { })
                res.send(value);
            }
        },
            (reason) => {
                res
                    .status(400)
                    .send(reason);
            })
        .catch((reason) => {
            res.send(reason);
        })
})

//Oauth2 stuff (Login with facebook/google)

app.post('/login/facebook/', (req, res) => {

    axios.get(`https://graph.facebook.com/${req.body.userID}`, {
        params: {
            access_token: req.body.fbToken,
            fields: 'email,name'
        }
    })
        .then((returnedValue) => {
            mongooseschemas.fbUser.findOne({'facebookID':returnedValue.data.id}).exec()
            .then((value)=>
            {
                if(value===undefined||value===null)
                {
                    mongooseschemas.fbUser.create(
                        {
                            facebookID:returnedValue.data.id,
                            email:returnedValue.data.email,
                            fullName:returnedValue.data.name,
                        }
                    )
                    .then((value)=>
                    {
                        res.send(
                            {
                                status:'success',
                                message:'Account created and logged in',
                                accountData:jwt.sign({value},process.env.JWT_SECRET),
                            }
                        )
                    },
                    (reason)=>
                    {
                        if(reason.keyPattern.email===1){
                            res.send({
                                status:'failed',
                                message:'Email already in use'
                            });
                        };
                    })
                    .catch((reason)=>
                    {
                        console.log(reason);
                    })
                }
                else{
                    res.send({
                        status:'success',
                        message:'Successfully logged in',
                        accountData:jwt.sign({value},process.env.JWT_SECRET)});
                }
            })
        },
            (reason) => {
                res.send(reason);
            })

})

app.post('/login/google',(req,res)=>
{
    axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?alt=json`,{headers:{'Authorization':`Bearer ${req.body.googleToken}`}})
    .then(value=>{ 
        mongooseschemas.googleUser.findOne({'googleID':value.data.sub}).exec()
        .then(dbResult=>
            {
                if(dbResult===null||dbResult===undefined)
                {
                    mongooseschemas.googleUser.create(
                        {
                            googleID:value.data.sub,
                            fullName:value.data.name,
                            email:value.data.email,
                            nationalityCode:value.data.locale.toUpperCase(),
                        }
                    )
                    .then((value)=>
                    {
                        res.send(
                            {
                                status:'success',
                                message:'Account created and logged in',
                                accountData:jwt.sign({value},process.env.JWT_SECRET),
                            }
                        )
                    },
                    (reason)=>
                    {
                        console.log(reason);
                        if(reason.keyPattern.email===1){
                            res.send({
                                status:'failed',
                                message:'Email already in use'
                            });
                        };
                    })
                }
                else{
                    console.log(dbResult);
                }
            })
    },
    reason=>
    {
    })
})