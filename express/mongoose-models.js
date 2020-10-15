const strings = require('@supercharge/strings/dist');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    fullName:{type:String},
    nationalityCode:{type:String},
    email:{type:String,required:true,unique:true},
    dateCreated:{type:Date,default:Date.now},
    verified:{type:Boolean,default:false},
    verificationCode:{type:String},
    googleID:{type:String},
    facebookID:{type:String}
});

const fbUserSchema = new mongoose.Schema({
    
    username:{type:String},
    password:{type:String},
    fullName:{type:String},
    nationalityCode:{type:String},
    email:{type:String,required:true,unique:true},
    dateCreated:{type:Date,default:Date.now},
    verified:{type:Boolean,default:false},
    verificationCode:{type:String},
    googleID:{type:String},
    facebookID:{type:String,required:true,unique:true}
})

const googleUserSchema = new mongoose.Schema({
    username:{type:String},
    password:{type:String},
    fullName:{type:String},
    nationalityCode:{type:String},
    email:{type:String,required:true,unique:true},
    dateCreated:{type:Date,default:Date.now},
    verified:{type:Boolean,default:false},
    verificationCode:{type:String},
    googleID:{type:String,required:true,unique:true},
    facebookID:{type:String}
})

const galleryPhotoSchema = new mongoose.Schema(
    {
        uri:{type:String,required:true,unique:true},
        likedBy:[String],
        postedBy:{type:String},
        postedDate:{type:Date}
    }
)

const userModel = mongoose.model('user',userSchema,'users');
const galleryPhotoModel = mongoose.model('galleryPhoto',galleryPhotoSchema,'gallery-photos');
const googleUserModel = mongoose.model('googleUser',googleUserSchema,'users');
const fbUserModel = mongoose.model('fbUser',fbUserSchema,'users');



exports.User = userModel;
exports.galleryPhoto = galleryPhotoModel;
exports.googleUser = googleUserModel;
exports.fbUser = fbUserModel;