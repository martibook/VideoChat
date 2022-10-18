const CREATED = "created";
const JOIN = "join";
const JOINED = "joined";
const FULL = "full";

const READY = "ready";
const CANDIDATE = "candidate";
const OFFER = "offer";
const ANSWER = "answer";

const express = require("express");
const socket = require("socket.io");
const app = express();

let server = app.listen(4000, function(){
    console.log("Server is running");
});

app.use(express.static("public"));

let io = socket(server);

io.on("connection", function(socket){
    console.log(`User ${socket.id} connected.`);

    socket.on(JOIN, function(roomName){
        let rooms = io.sockets.adapter.rooms;
        let room = rooms.get(roomName);
        if (room == undefined) {
            socket.join(roomName);
            socket.emit(CREATED);
        }
        else if (room.size == 1) {
            socket.join(roomName);
            socket.emit(JOINED);
        }
        else {
            socket.emit(FULL);
        }
        console.log(rooms);
    });

    socket.on(READY, (roomName) => {
        console.log(`Room ${roomName}, ${socket.id} is ready`);
        socket.broadcast.to(roomName).emit(READY, roomName);
    });

    socket.on(CANDIDATE, (candidate, roomName) => {
        console.log(`Room ${roomName} ${socket.id} send candidate`);
        console.log(candidate);
        socket.broadcast.to(roomName).emit(CANDIDATE, candidate);
    });

    socket.on(OFFER, (offer, roomName) => {
        console.log(`Room ${roomName} ${socket.id} send offer`);
        console.log(offer);
        socket.broadcast.to(roomName).emit(OFFER, offer);
    });

    socket.on(ANSWER, (answer, roomName) => {
        console.log(`Room ${roomName} ${socket.id} send answer`);
        console.log(answer);
        socket.broadcast.to(roomName).emit(ANSWER, answer);
    });
});