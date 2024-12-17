import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    serialNumber: { type: Number, required: true },
    title: { type: String },
    postedOn: { type: String },
    downloadLink: { type: String },
  },
  { timestamps: true }
);

export const Notice = mongoose.model("Notice", noticeSchema);
