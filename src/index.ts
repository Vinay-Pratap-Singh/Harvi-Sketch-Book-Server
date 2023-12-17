import { Socket } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    optionsSuccessStatus: 200,
  })
);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  },
});

// Server
const usersInRooms = new Map<string, Set<{ userId: string; name: string }>>();

io.on("connection", (socket: Socket) => {
  // for room creation
  socket.on("createRoom", ({ name }: { name: string }) => {
    const roomId = uuidv4();
    socket.join(roomId);
    usersInRooms.set(roomId, new Set([{ userId: socket.id, name }]));

    // Broadcast room creation event to the user
    socket.emit("roomCreated", { roomId, name });
  });

  // for room joining
  socket.on(
    "joinRoom",
    ({ roomId, name }: { roomId: string; name: string }) => {
      if (usersInRooms.has(roomId)) {
        console.log("inside user in room");
        socket.join(roomId);
        usersInRooms.get(roomId)?.add({ userId: socket.id, name });

        // Broadcast user join event to all users in the room
        io.to(roomId).emit("userJoin", { name, roomId });
      } else {
        console.log("invalid user in room");
        socket.emit("invalidRoom", {
          message: "Please enter a valid room code",
        });
      }
    }
  );

  // for leaving the room
  socket.on(
    "leaveBoard",
    ({ roomId, name }: { roomId: string; name: string }) => {
      console.log("room left");
      const usersInRoom = usersInRooms.get(roomId);

      if (usersInRoom) {
        usersInRoom.delete({ userId: socket.id, name });

        // If the room is now empty, remove it
        if (usersInRoom.size === 0) {
          usersInRooms.delete(roomId);
        }
      }

      // broadcasting user left to all the other users
      io.to(roomId).emit("userLeave", { name });

      // Leave the socket room
      socket.leave(roomId);
    }
  );

  // for deleting the room
  socket.on("deleteRoom", ({ roomId }: { roomId: string }) => {
    io.to(roomId).emit("roomDeleted", {
      message: "Admin has stopped the live collaboration",
    });
    usersInRooms.delete(roomId);
  });

  // for receiving and sending the data
  socket.on(
    "sendSketchBoardData",
    ({
      index,
      data,
      roomId,
    }: {
      index: number;
      data: string[];
      roomId: string;
    }) => {
      console.log("getting data");
      console.log(index, data, roomId, "working");
      io.to(roomId).emit("receiveSketchBoardData", { index, data } as {
        index: number;
        data: string[];
      });
    }
  );

  // when user disconnects
  socket.on("disconnect", () => {
    console.log("inside disconnect");
    let leftRoomId = null;

    // Find the room from which the user is disconnecting
    usersInRooms.forEach((users, roomId) => {
      const userLeaving = Array.from(users).find(
        (user) => user.userId === socket.id
      );
      if (userLeaving) {
        console.log("leaving", userLeaving);
        leftRoomId = roomId;
        users.delete(userLeaving);

        // Broadcast user leave event to all users in the room
        io.to(roomId).emit("userLeave", {
          name: userLeaving.name,
        });
      }
    });

    if (leftRoomId) {
      console.log("room left");
      // If the room is now empty, remove it
      if (usersInRooms.get(leftRoomId)?.size === 0) {
        usersInRooms.delete(leftRoomId);
      }
    }
  });
});

httpServer.listen(process.env.PORT || 5000);
