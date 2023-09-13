const express = require('express')
const app = express();
const userRoutes = require('./Routes/userRoutes')
const rooms =['general','tech','finance','crypto'];
const cors = require('cors')
const connect = require('./connect')
const User = require('./Models/User')
const Message = require('./Models/Message')
app.use(express.urlencoded({extended:true}));
app.use(express.json())
app.use(cors())
// actual route
app.use('/users',userRoutes)

const server = require('http').createServer(app);
const PORT = 5001

// WEB SOCKETS
const io  = require('socket.io') (server,{
    cors:{
        origin:'http://localhost:3000',
        methods:['GET','POST']
    }
})

app.get('/rooms',(req,res)=>{
    // rooms are defined above
    res.json(rooms)
})

// function to get all the last messages from room
const getLastMessagesFromRoom = async(room)=>{
     let roomMessages = await Message.aggregate([
        {$match:{to:room}},
        {$group:{_id: '$date' ,messagesByDate : {$push: '$$ROOT'}}}
     ])
     return roomMessages;
}

// sorting messages by date
const sortMessagesByDate = async(messages)=>{
    return messages.sort(function(a,b){
        let date1 = a._id.split('/')  //_id is date
        let date2 = b._id.split('/')  //_id is date

        // year+day+month
        date1 = date1[2] + date1[0] +date1[1]
        date2 = date2[2] + date2[0] +date2[1]
        
        return date1<date2 ? -1 : 1;
    })
}


// socket connection
// socket comes from front end 
// each user will have its own socket
io.on('connection',(socket)=>{
    // new-user is an event and we send the event in front-end
   socket.on('new-user',async()=>{
    const members = await User.find();
    // io.emit specifies to all the users that we have a new user
    // socket.emit is for that specific user
    io.emit('new-user',members)
   })

    // join-room is an event and we send the event in front-end
    // once we join new room we must leave the previous room
    socket.on('join-room',async(newRoom,previousRoom)=>{
        socket.join(newRoom)
        socket.leave(previousRoom)
        let roomMessages = await getLastMessagesFromRoom(newRoom)
        roomMessages = await sortMessagesByDate(roomMessages)
        console.log(roomMessages)
        // emit is an event and we send the event in front-end
        socket.emit('room-messages',roomMessages)
    })

    socket.on('message-room', async(room,content,sender,time,date)=>{
        const newMessage = await Message.create({content,from:sender,time,date,to:room})
        let roomMessages = await getLastMessagesFromRoom(room)
        roomMessages = await sortMessagesByDate(roomMessages)
        // sending messages to the room
        io.to(room).emit('room-messages',roomMessages)

        // notifications to all the members except one sending the message
        socket.broadcast.emit('notifications',room)
    })

    // logout user
    // it is l=kept inside io.on("connection")
    app.delete('/logout',async(req,res)=>{
        try{
            const {_id,newMessages} =  req.body
            const user = await User.findById(_id);
            user.status = 'offline'
            //newMessages will be updfated in the front-end therfore we have to save those messages
            user.newMessages = newMessages
            await user.save()
            const members = await User.find()
            // This line broadcasts a "new-user" event to all connected sockets except the one that triggered the event through the socket object
            socket.broadcast.emit(('new-user'),members)
            res.status(200).send();
        }catch(e){
            console.log(e)
            res.status(400).send({error:"Some error Occured"})
        }
    })
})




// db connect
connect();
server.listen(PORT,()=>{
    console.log("Listening to port ",PORT);
})
