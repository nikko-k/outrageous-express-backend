const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    dateCreated:{type:Date,default:Date.now},
    verified:{type:Boolean,default:false}
});

const userModel = mongoose.model('user',userSchema,'users');

const galleryPhotoSchema = new mongoose.Schema(
    {
        uri:{type:String,required:true,unique:true},
        likedBy:{type:mongoose.Types.Array[string]},
        postedBy:{type:String},
        postedDate:{type:Date}
    }
)
const galleryPhotoModel = mongoose.model('galleryPhoto',galleryPhotoSchema,'gallery-photos');

exports.User = userModel;
exports.galleryPhoto = galleryPhotoModel;