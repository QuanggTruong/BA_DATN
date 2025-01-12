import { sendEmail } from "../config/mail.js";
import Contact from "../models/contact.model.js";

export const getContactList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { name, email } = req.query;

    const skip = (page - 1) * pageSize;
    let filter = {};
    if (name) filter.name = { $regex: name, $options: "i" };
    if (email) filter.email = { $regex: email, $options: "i" };

    const [total, contacts] = await Promise.all([
      Contact.countDocuments(filter),
      Contact.find(filter).skip(skip).limit(pageSize).lean().exec(),
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        page: page,
        totalPage: Math.ceil(total / pageSize),
        pageSize: pageSize,
        totalItems: total,
      },
      data: contacts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: [],
    });
  }
};

export const createContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const newContact = new Contact({
      name,
      email,
      message,
    });

    await newContact.save();
    return res.status(201).json({
      success: true,
      message:
        "Gửi thông tin liên hệ thành công chúng tôi sẽ sớm trả lời bạn !",
      data: newContact,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const replyContact = async (req, res) => {
  try {
    const id = req.params.id;
    const { reply } = req.body;

    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin liên hệ",
      });
    }

    contact.reply = reply;
    const updatedContact = await contact.save();
    if (updatedContact) {
      sendEmail({
        name: contact.name,
        email: contact.email,
        content: reply,
        subject: "Phản hồi liên hệ",
        template: "reply-contact",
        type: "replyContact",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Gửi phản hồi liên hệ thành công",
      data: updatedContact,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeContact = async (req, res) => {
  try {
    const id = req.params.id;

    const contact = await Contact.findByIdAndDelete(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin liên hệ",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xóa liên hệ thành công",
      data: contact,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
