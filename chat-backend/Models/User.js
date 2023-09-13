const mongoose = require('mongoose')

const {isEmail} = require('validator')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Name can't be blank"]
    },
    email:{
        type:String,
        lowercase:true,
        unique:true,
        required:[true," Email can't be blank"],
        index:true,
        validate:[isEmail,"Invalid email"]
    },
    password:{
        type:String,
        required:[true,"Password can't be blank"]
    },
    picture:{
        type:String,

    },
    newMessages:{
        type:Object,
        default:{}
    },
    status:{
        type:String,
        default:'online'
    },
},
// minimize is set to false to prevent removal of default empty members by mongoose
{minimize:false})



// hash Password before saving to database
userSchema.pre('save',function(next){
    const user = this;
    // 
    if(!user.isModified('password')) return next();
    bcrypt.genSalt(10,function(err,salt){
        if(err) return next(err);
        bcrypt.hash(user.password,salt,function(err,hash){
            if(err) return next(err)
            user.password = hash
            next();
        })
    })
})


// when we have to send back the user we delete the password
userSchema.methods.toJSON = function(){
    const user = this;
    const userObj = user.toObject()
    delete userObj.password;
    return userObj
}



// creating findByCredentials function here
userSchema.statics.findByCredentials = async(email,password)=>{
    const user = await User.findOne({email})
    if(!user){
        throw new Error("User not found")
    }
    const isMatch = await bcrypt.compare(password,user.password)
    if(!isMatch){
        throw new Error("Invalid Email or Password")
    }
    return user
}
    
const User = mongoose.model('User',userSchema)

module.exports = User