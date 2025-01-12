import mongoose from "mongoose";

export const ContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    reply: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Contact = mongoose.model("Contact", ContactSchema);

export default Contact;
