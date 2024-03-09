const express = require('express');
const mongoose = require('mongoose');
const app = express();
const dotenv = require('dotenv');
const User = require('./Models/User');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const ws = require('ws');
const Message = require('./Models/Message');

dotenv.config();
const jwtSECRET = process.env.JWT_SECRET;
app.use(express.json());
app.use(cookieParser());
const bcryptSalt = bcrypt.genSaltSync(10);
app.use(cors({
    credentials:true,
    origin: process.env.CLIENT_URL,
}))

mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log("connected to MongoDB");
}).catch(err=>{
    console.error("Error connecting to MongoDB",err);
});

console.log(process.env.MONGO_URL); 

app.get('/test', (req,res)=>{
    res.json('Test Is Good');
});

app.get('/profile',(req,res)=>{
    const token = req.cookies?.token;
    if(token){
        jwt.verify(token,jwtSECRET , {} ,(err,userData)=>{
            if(err) throw err;
            res.json(userData);
        });
    }else{
        res.status(401).json('no token');
    }
});
app.post('/login' , async (req,res)=>{
    const {username , password} = req.body;
    const foundUser = await User.findOne({username});
    if (foundUser) {
        const passOk = bcrypt.compareSync(password , foundUser.password)
        if (passOk){
            jwt.sign({userId: foundUser._id,username}, jwtSECRET,{} , (err,token)=>{
                res.cookie('token' , token,{sameSite:'none',secure:true}).json({
                    id: foundUser._id , 
                });
            });
        }
    }

})
//-----------------------------------------------------Register User

app.post('/register', async(req,res)=>{
    const {username,password} = req.body;
    try{
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
        const createdUser = await User.create({
            username : username,
            password : hashedPassword,
        });
        jwt.sign({userId: createdUser._id,username}, jwtSECRET, {}, (err, token) => {
            if(err) throw err;
            res.cookie('token',token,{sameSite:'none',secure:true}).status(201).json({
                id: createdUser._id,

            });
        });
    
    }catch(err){
        console.error(err);
        res.status(500).json('error');
    }
});


//c6ztyAhU2ePiAvqU

const server = app.listen(4000);

//-----------------------------------Creating Websocket Server-----------------------------

const wss = new ws.WebSocketServer({ server });

wss.on('connection', (connection, req) => {
    const cookies = req.headers.cookie;
    if (cookies) {
        const tokenCookieString = cookies.split(';').find(str => str.trim().startsWith('token='));
        if (tokenCookieString) {
            const token = tokenCookieString.split('=')[1].trim();
            if (token) {
                jwt.verify(token, jwtSECRET, {}, (err, userData) => {
                    if (err) {
                        // Handle token verification error
                        console.error("Token verification error:", err);
                    } else {
                        const { userId, username } = userData;
                        connection.userId = userId;
                        connection.username = username;
                    }
                });
            }
        }
    }

    // Notify all clients about online users
    const onlineUsers = [...wss.clients].map(client => ({ userId: client.userId, username: client.username }));
    broadcastOnlineUsers(onlineUsers);
    connection.on('message', async(message) => {
        const messageData = JSON.parse(message.toString());
        const { recipient, text } = messageData;
        if (recipient && text) {
            const messageDoc = await Message.create({
                sender:connection.userId,
                recipient,
                // id:messageDoc._id,
                text,
            });
            [...wss.clients]
                .filter(c => c.userId === recipient)
                .forEach(c => c.send(JSON.stringify({ text, sender:connection.userId,
                    id:messageDoc._id,
                })));
        }
    });
    
});


function broadcastOnlineUsers(onlineUsers) {
    const onlineUsersMessage = JSON.stringify({ online: onlineUsers });
    wss.clients.forEach(client => {
        client.send(onlineUsersMessage);
    });
}