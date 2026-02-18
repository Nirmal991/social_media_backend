import path from "node:path";
import process from "node:process";

import "dotenv/config";
import e, { json, static as serve } from "express";
import cors from "cors";
import helmet from "helmet";
import http from 'http';
import { Server } from 'socket.io';

import { CORS_ORIGIN, HOST, PORT, connectToMongo } from "./lib";
import routes from "./routes";

const api = e();
api.disable("etag");
api.use(cors({origin: CORS_ORIGIN, credentials: true}));
api.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

api.use(json({ limit: "5mb" }));
api.use(serve(path.join(process.cwd(), "public")));

api.use(routes);

const server = http.createServer(api); //create server

export const io = new Server(server, {  // attach socket.io
  cors: {
    origin: CORS_ORIGIN,
    credentials: true
  }
})

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  const userId = socket.handshake.query.userId as string;

  if(userId) {
    socket.join(userId);
    console.log("User joined personal room:", userId);
  }

  socket.on("join_conversation", (conversationId) => {
    socket.join(conversationId)
    console.log(`User joined conversation: ${conversationId}`);
  })

  socket.on("leave_conversation", (conversationId: string) => {
    socket.leave(conversationId);
    console.log(`Left room: ${conversationId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
})

connectToMongo().then(() => {
  server.listen(PORT, HOST, () => console.log(`API listing on port:- ${PORT}`));
});

module.exports = api;
