import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    tgId: { type: Number, required: true, unique: true },
    username: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    isBot: { type: Boolean },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
