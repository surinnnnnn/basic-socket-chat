import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cors from "cors";
import * as path from "node:path";
import { timeStamp } from "console";
import { prisma } from "./init/prisma_client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
     cors: {
          origin: "*",
          methods: ["GET", "POST"],
     },
});

const usersInRooms = {};

io.on("connection", (socket) => {
     console.log("사용자가 연결되었습니다", socket.id);

     socket.on("SEND_MESSAGE", async (msg) => {
          const room = usersInRooms[socket.id];

          if (room) {
               const msgObj = {
                    id: socket.id + Math.random(),
                    content: msg.message,
                    sender: socket.id,
                    timestamp: new Date().toLocaleString(),
               };
               io.to(room).emit("SEND_MESSAGE", JSON.stringify(msgObj));
               await prisma.chat.create({
                    data: {
                         socket_id: msgObj.id,
                         chat: msgObj.content,
                         sender: msgObj.sender,
                         timestamp: msgObj.timestamp,
                    },
               });
          } else {
               const msgObj = {
                    id: socket.id + Math.random(),
                    content: msg.message,
                    sender: socket.id,
                    timestamp: new Date().toLocaleString(),
               };
               socket.emit("SEND_MESSAGE", JSON.stringify(msgObj));
          }
     });

     socket.on("JOIN_ROOM", (room) => {
          socket.join(room);
          if (!usersInRooms[socket.id]) {
               const msgObj = {
                    id: socket.id + Math.random(),
                    content: "새로운 사용자가 입장했습니다.",
                    sender: socket.id,
                    timestamp: new Date().toLocaleString(),
               };
               io.to(room).emit("SEND_MESSAGE", JSON.stringify(msgObj));
          }
          // 사용자 입장 메시지 한번만
          usersInRooms[socket.id] = room;
     });

     socket.on("LEAVE_ROOM", (room) => {
          socket.leave(room);
          delete usersInRooms[socket.id];
          const msgObj = {
               id: socket.id + Math.random(),
               content: "사용자가 채팅룸을 떠났습니다.",
               sender: socket.id,
               timestamp: new Date().toLocaleString(),
          };
          io.to(room).emit("SEND_MESSAGE", JSON.stringify(msgObj));
     });

     socket.on("disconnect", () => {
          console.log("사용자가 연결을 끊었습니다");
     });
});

app.use(express.static(path.join(path.resolve(), "public")));
app.get("/", (req, res) => {
     res.sendFile(path.join(path.resolve(), "public", "index.html"));
});

app.get("/messages", async (req, res) => {
     const messages = await prisma.chat.findMany();
     res.status(200).json({ messages });
});

const PORT = 4000;
httpServer.listen(PORT, () => {
     console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
