const router = require('express').Router()

const User = require('../Models/User')

router.post('/',async(req,res)=>{
    try{
        const {name,email,password,picture} = req.body
        console.log(req.body)
        const user = await User.create({name,email,password,picture})
        res.status(201).json(user);
    }catch(e){
        let msg;
        if(e.code==11000){
            msg="User already exists"
        }else {
            msg=e.message;
        }
        res.status(400).json(e.message)
    }
})

// login user

router.post("/login",async(req,res)=>{
    try {
        const {email,password} = req.body
        const user = await User.findByCredentials(email,password);
        user.status = 'online'
        await user.save()
        res.status(200).json(user)
    }catch(error) {
        // console.log(error)
        // error messages are thrown by findByCredentials function in the User model
        res.status(400).json(error.message)
    }
})

module.exports = router