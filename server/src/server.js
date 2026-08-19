import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";

const port = Number(process.env.PORT || 5050);

async function start() {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");
  } else {
    console.log("Running with the seeded in-memory demo store");
  }
  app.listen(port, () => console.log(`AutoServe API listening on http://localhost:${port}`));
}

start().catch((error) => {
  console.error("Unable to start AutoServe API", error);
  process.exitCode = 1;
});
