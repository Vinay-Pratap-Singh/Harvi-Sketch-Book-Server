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
  socket.on("createRoom", ({ name }: { name: string }) => {
    const roomId = uuidv4();
    socket.join(roomId);
    usersInRooms.set(roomId, new Set([{ userId: socket.id, name }]));

    // Broadcast room creation event to the user
    socket.emit("roomCreated", { roomId });

    // Broadcast user join event to all users in the room
    io.to(roomId).emit("userJoin", { name });
  });

  socket.on(
    "joinRoom",
    ({ roomId, name }: { roomId: string; name: string }) => {
      if (usersInRooms.has(roomId)) {
        socket.join(roomId);
        usersInRooms.get(roomId)?.add({ userId: socket.id, name });

        // Broadcast user join event to all users in the room
        io.to(roomId).emit("userJoin", { name });
      } else {
        socket.emit("invalidRoom", {
          message: "Please enter a valid room code",
        });
      }
    }
  );

  socket.on(
    "leaveBoard",
    ({ roomId, name }: { roomId: string; name: string }) => {
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

  socket.on("disconnect", () => {
    let leftRoomId = null;

    // Find the room from which the user is disconnecting
    usersInRooms.forEach((users, roomId) => {
      const userLeaving = Array.from(users).find(
        (user) => user.userId === socket.id
      );
      if (userLeaving) {
        leftRoomId = roomId;
        users.delete(userLeaving);

        // Broadcast user leave event to all users in the room
        io.to(roomId).emit("userLeave", {
          name: userLeaving.name,
        });
      }
    });

    if (leftRoomId) {
      // If the room is now empty, remove it
      if (usersInRooms.get(leftRoomId)?.size === 0) {
        usersInRooms.delete(leftRoomId);
      }
    }
  });
});

httpServer.listen(process.env.PORT || 5000);
