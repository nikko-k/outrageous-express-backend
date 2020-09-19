const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    dateCreated:{type:Date,default:Date.now},
    verified:{type:Boolean,default:false}
});

const userModel = mongoose.model('user',userSchema);

exports.User = userModel;