import slugify from "slugify";
import Brand from "../models/brand.model.js";
import Product from "../models/product.model.js";

export const createBrand = async (req, res) => {
  try {
    const { name, image } = req.body;

    const existingBrand = await Brand.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingBrand) {
      return res.status(400).json({
        success: false,
        message: "Thương hiệu đã tồn tại",
      });
    }

    const newBrand = new Brand({
      name,
      image,
    });

    const savedBrand = await newBrand.save();

    return res.status(201).json({
      success: true,
      message: "Tạo mới thương hiệu thành công",
      data: savedBrand,
    });
  } catch (error) {
    console.error("Error in createBrand:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tạo thương hiệu",
      error: error.message,
    });
  }
};

export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image } = req.body;

    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thương hiệu",
      });
    }

    if (name && name !== brand.name) {
      const existingBrand = await Brand.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        _id: { $ne: id },
      });

      if (existingBrand) {
        return res.status(400).json({
          success: false,
          message: "Tên thương hiệu đã tồn tại",
        });
      }

      brand.name = name;
      brand.slug = slugify(name, { lower: true, locale: "vi" });
    }

    if (image) {
      brand.image = image;
    }

    const updatedBrand = await brand.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật thương hiệu thành công",
      data: updatedBrand,
    });
  } catch (error) {
    console.error("Error in updateBrand:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi cập nhật thương hiệu",
      error: error.message,
    });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thương hiệu",
      });
    }

    await Brand.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Xóa thương hiệu thành công",
    });
  } catch (error) {
    console.error("Error in deleteBrand:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi xóa thương hiệu",
      error: error.message,
    });
  }
};

export const getAllBrand = async (req, res) => {
  try {
    const { page, pageSize, name } = req.query;

    if (!page && !pageSize && !name) {
      const brands = await Brand.find().lean().exec();

      const productCounts = await Product.aggregate([
        { $group: { _id: "$brand", count: { $sum: 1 } } },
      ]);

      const productCountMap = productCounts.reduce((acc, item) => {
        acc[item._id.toString()] = item.count;
        return acc;
      }, {});

      const brandsWithCount = brands.map((brand) => ({
        ...brand,
        productCount: productCountMap[brand._id.toString()] || 0,
      }));

      return res.status(200).json({
        success: true,
        data: brandsWithCount,
      });
    }

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(pageSize) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filter = name ? { name: { $regex: name, $options: "i" } } : {};

    const [brands, total] = await Promise.all([
      Brand.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean()
        .exec(),
      Brand.countDocuments(filter),
    ]);

    const brandIds = brands.map((brand) => brand._id);
    const productCounts = await Product.aggregate([
      { $match: { brand: { $in: brandIds } } },
      { $group: { _id: "$brand", count: { $sum: 1 } } },
    ]);

    const productCountMap = productCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    const brandsWithCount = brands.map((brand) => ({
      ...brand,
      productCount: productCountMap[brand._id.toString()] || 0,
    }));

    let response = {
      success: true,
      data: brandsWithCount,
    };

    if (pageSize) {
      response.pagination = {
        page: pageNumber,
        totalPage: Math.ceil(total / limitNumber),
        totalItems: total,
        pageSize: limitNumber,
      };
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in getAllBrand:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách thương hiệu",
      data: [],
      error: error.message,
    });
  }
};
