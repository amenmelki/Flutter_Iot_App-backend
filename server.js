const express = require('express')
require("dotenv").config()
const app = express()
app.use(express.json())
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const connectDB = require("./config/connectDB")
connectDB();
const message=[]


// Server-side event handlers


io.on('connection', (socket) => {
  console.log("socket server started")
  console.log(`Client connected: ${socket.id}`);
  const socketID = socket.id;
  console.log(socketID)
  socket.emit('get_id', {'id': socketID}, socketID);

  socket.on('serverToserver', (body, ack) => {
    console.log("fl serverJS", body)
    ack('Event received');
   /*const phoneID = body.socketID.notif_id;
    console.log("Phone ID: ", phoneID)*/
    io.emit('serverTophone', {"data": body.data});
  });
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  
});

app.use(express.json());
app.use('/api', require("./routers/user"));

const port = process.env.PORT;

// Start the server
server.listen(port, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Server is running on PORT ${port}`);
  }
});

module.exports.io = { io };
