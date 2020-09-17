require('dotenv').config();
const fs = require("fs");
const helmet = require ('helmet');
const multer = require('multer');
const path = require('path');

const express = require('express');
const app = express();


var port = process.env.PORT || 1300;

app.listen(port,()=> console.log("Listening on port "+port)); //Starting the HTTP listen server
app.use(helmet()); // Adding Helmet middleware (security)

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


const DiskStorage = multer.diskStorage({
    destination:'./public/images/',
    filename: (req,file,cb)=>
    {
        cb(null,Date.now().toString()+"-"+file.originalname);
    }
})

const upload = multer({storage:DiskStorage});

app.get('/',(req,res)=> res.send("Hello"));

app.get('/uploads',(res,req)=>{
    var images = fs.readdir('.public/images/')
})

app.post('/upload',upload.single('picture'),(req,res)=>{
    res
    .status(200)
    .contentType("text/plain")
    .send("Should be okay, probably isn't")
    .end();
})