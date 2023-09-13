const mongoose = require('mongoose')
require('dotenv').config()

const url = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PW}@nodeexpressprojects.tn0xb1w.mongodb.net/ChatApp?retryWrites=true&w=majority`

const connect = ()=>{
    try{
    mongoose.connect(url,{
            useNewUrlParser: true,
            useUnifiedTopology: true,
    })
    console.log("Connected")
    }
    catch(e){console.log("error connecting ")}
}


module.exports = connect

