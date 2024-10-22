import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cors from "cors";
import * as path from "node:path";
import { timeStamp } from "console";

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

io.on("connection", (socket) => {
     console.log("사용자가 연결되었습니다", socket.id);
     socket.broadcast.emit("SEND_MESSAGE", {
          socketId: socket.id + Math.random(),
          content: "새로운 사용자가 입장했습니다.",
          sender: socket.id,
          timeStamp: new Date(),
     });
     socket.on("SEND_MESSAGE", (msg) => {
          //메세지 객체 처리

          const msgObj = {
               socketId: socket.id + Math.random(),
               content: msg,
               sender: socket.id,
               timeStamp: new Date(),
          };

          console.log(msgObj);

          //브로드 캐스트
          io.emit("SEND_MESSAGE", msgObj);
     });

     socket.on("disconnect", () => {
          console.log("사용자가 연결을 끊었습니다");
     });
});

app.use(express.static(path.join(path.resolve(), "public")));
app.get("/*", (req, res) => {
     res.sendFile(path.join(path.resolve(), "public", "index.html"));
});

const PORT = 4000;
httpServer.listen(PORT, () => {
     console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
