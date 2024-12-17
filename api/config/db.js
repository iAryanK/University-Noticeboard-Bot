import mongoose from "mongoose";

export default () => {
  if (!process.env.MONGODB_URI) return console.log("🔴 [Missing MONGODB_URI]");

  try {
    return mongoose.connect(process.env.MONGODB_URI,
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
  } catch (error) {
    console.log("🔴 [DB CONNECTION FAILED]", error);
  }
};
