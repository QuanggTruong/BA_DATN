import mongoose from "mongoose";

export const SettingSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      default: "",
    },
    aboutUs: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Setting = mongoose.model("Setting", SettingSchema);

export default Setting;
