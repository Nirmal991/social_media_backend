import mongoose from "mongoose";

import { MONGO_URI } from "./constant.lib";

export async function connectToMongo() {
  try {
    await mongoose.set("strictQuery", true).connect(MONGO_URI);
    // mongoose.set('debug', true)
    console.warn("connectToMongo:- ", "MongoDB connected");
  } catch (err) {
    console.error("connectToMongo:- ", err);
    process.exit(1);
  }
}
