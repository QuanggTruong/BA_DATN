import Setting from "../models/setting.model.js";

export const getSetting = async (req, res) => {
  try {
    const setting = await Setting.find().limit(1);
    if (!setting)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin cài đặt",
        data: {},
      });
    return res.status(200).json({
      success: true,
      data: setting,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: [],
    });
  }
};

export const updateSetting = async (req, res) => {
  try {
    let setting;

    if (req.query.id !== "") {
      setting = await Setting.findByIdAndUpdate(
        req.query.id,
        { $set: req.body },
        { new: true }
      );

      if (!setting) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông tin cài đặt",
        });
      }
    } else {
      setting = new Setting(req.body);
      await setting.save();
    }

    return res.status(200).json({
      success: true,
      message: req.params.id
        ? "Cập nhật thông tin cài đặt thành công"
        : "Tạo mới thông tin cài đặt thành công",
      data: setting,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
