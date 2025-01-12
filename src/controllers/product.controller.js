import mongoose from "mongoose";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import slugify from "slugify";
import Brand from "../models/brand.model.js";

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      categories,
      images,
      price,
      description,
      mainImage,
      totalQuantity,
      tags,
      brand,
    } = req.body;
    const existProduct = await Product.exists({
      name,
    });
    if (existProduct) {
      return res.status(400).json({
        success: false,
        message: "Sản phẩm đã tồn tại vui lòng thử lại",
      });
    }
    const newProduct = await Product.create({
      name,
      categories,
      price,
      images,
      description,
      mainImage,
      totalQuantity,
      tags,
      images,
      brand,
    });
    return res.status(201).json({
      success: true,
      message: "Tạo mới sản phẩm thành công",
      data: newProduct,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi thêm sản phẩm",
      error: error.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = req.body;

    if (updateData.name) {
      const newSlug = slugify(updateData.name, { lower: true, locale: "vi" });
      updateData.slug = newSlug;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      data: updatedProduct,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const removeProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Xóa sản phẩm thành công",
      data: deletedProduct,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getListFromCategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 12;
    const { slug } = req.params;
    const categoryIds = req.query.categories
      ? JSON.parse(req.query.categories)
      : [];

    const baseQuery = { enable: true };
    let name = "";
    if (slug) {
      const category = await Category.findOne({ slug });
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
          data: [],
        });
      }
      name = category.name;
      baseQuery.categories = category._id;
    }

    if (categoryIds.length > 0) {
      baseQuery.categories = {
        $in: categoryIds.map((id) => new mongoose.Types.ObjectId(`${id}`)),
      };
    }

    const priceRangeData = await Product.aggregate([
      { $match: { enable: true } },
      {
        $group: {
          _id: null,
          min: { $min: "$price" },
          max: { $max: "$price" },
        },
      },
    ]);

    const priceRange = priceRangeData[0] || { min: 0, max: 0 };
    const allTags = await Product.distinct("tags", { enable: true });

    const createPriceRanges = (min, max) => {
      const roundedMin = Math.floor(min / 100000) * 100000;
      const roundedMax = Math.ceil(max / 100000) * 100000;
      const range = roundedMax - roundedMin;
      const step = Math.ceil(range / 4 / 100000) * 100000;

      return [
        {
          label: `Dưới ${Intl.NumberFormat("vi-VN").format(
            roundedMin + step
          )}đ`,
          min: 0,
          max: roundedMin + step,
          value: [0, roundedMin + step],
        },
        {
          label: `Từ ${Intl.NumberFormat("vi-VN").format(
            roundedMin + step
          )}đ - ${Intl.NumberFormat("vi-VN").format(roundedMin + 2 * step)}đ`,
          min: roundedMin + step,
          max: roundedMin + 2 * step,
          value: [roundedMin + step, roundedMin + 2 * step],
        },
        {
          label: `Từ ${Intl.NumberFormat("vi-VN").format(
            roundedMin + 2 * step
          )}đ - ${Intl.NumberFormat("vi-VN").format(roundedMin + 3 * step)}đ`,
          min: roundedMin + 2 * step,
          max: roundedMin + 3 * step,
          value: [roundedMin + 2 * step, roundedMin + 3 * step],
        },
        {
          label: `Trên ${Intl.NumberFormat("vi-VN").format(
            roundedMin + 3 * step
          )}đ`,
          min: roundedMin + 3 * step,
          max: Infinity,
          value: [roundedMin + 3 * step, roundedMax],
        },
      ];
    };

    if (req.query.price) {
      const [minPrice, maxPrice] = JSON.parse(req.query.price);
      if (minPrice !== undefined) {
        baseQuery.price = { $gte: parseFloat(minPrice) };
      }
      if (maxPrice !== undefined && maxPrice !== Infinity) {
        baseQuery.price = { ...baseQuery.price, $lte: parseFloat(maxPrice) };
      }
    }

    if (req.query.tags) {
      const tags = Array.isArray(req.query.tags)
        ? req.query.tags
        : [req.query.tags];
      baseQuery.tags = { $in: tags };
    }

    let sortQuery = {};
    if (req.query.sort) {
      switch (req.query.sort) {
        case "price_asc":
          sortQuery = { price: 1 };
          break;
        case "price_desc":
          sortQuery = { price: -1 };
          break;
        case "newest":
          sortQuery = { createdAt: -1 };
          break;
        case "oldest":
          sortQuery = { createdAt: 1 };
          break;
        default:
          sortQuery = { createdAt: -1 };
      }
    }

    const skip = (page - 1) * pageSize;

    const [total, products] = await Promise.all([
      Product.countDocuments(baseQuery),
      Product.find(baseQuery)
        .sort(sortQuery)
        .skip(skip)
        .limit(pageSize)
        .populate([
          {
            path: "categories",
            select: "name slug",
          },
        ])
        .lean()
        .exec(),
    ]);

    const priceRanges = createPriceRanges(priceRange.min, priceRange.max);

    return res.status(200).json({
      success: true,
      name,
      pagination: {
        page,
        totalPage: Math.ceil(total / pageSize),
        totalItems: total,
        pageSize,
      },
      filters: {
        priceRange: {
          min: Math.floor(priceRange.min),
          max: Math.ceil(priceRange.max),
          ranges: priceRanges,
        },
        availableTags: allTags,
        sortOptions: [
          { label: "Mới nhất", value: "newest" },
          { label: "Cũ nhất", value: "oldest" },
          { label: "Giá tăng dần", value: "price_asc" },
          { label: "Giá giảm dần", value: "price_desc" },
        ],
      },
      data: products,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: [],
      error: error.message,
    });
  }
};

export const getProductNew = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 8;
    const skip = (page - 1) * pageSize;

    const products = await Product.find({
      enable: true,
      tags: "NEW",
    })
      .populate("categories")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Product.countDocuments({
      enable: true,
      tags: "NEW",
    });

    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          pageSize,
          totalPage: Math.ceil(total / pageSize),
          totalItems: total,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: [],
      error: error.message,
    });
  }
};

export const getProductHot = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 8;
    const skip = (page - 1) * pageSize;

    const products = await Product.find({
      enable: true,
      tags: "HOT",
    })
      .populate("categories")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Product.countDocuments({
      enable: true,
      tags: "HOT",
    });

    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          pageSize,
          totalPage: Math.ceil(total / pageSize),
          totalItems: total,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: [],
      error: error.message,
    });
  }
};

export const getProductSale = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 8;
    const skip = (page - 1) * pageSize;

    const products = await Product.find({
      enable: true,
      tags: "SALE",
    })
      .populate("categories")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Product.countDocuments({
      enable: true,
      tags: "SALE",
    });

    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          pageSize,
          totalPage: Math.ceil(total / pageSize),
          totalItems: total,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: [],
      error: error.message,
    });
  }
};

export const getProductSelling = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 8;
    const skip = (page - 1) * pageSize;

    const products = await Product.find({
      enable: true,
      tags: "SALE",
    })
      .populate("categories")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Product.countDocuments({
      enable: true,
      tags: "SALE",
    });

    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          pageSize,
          totalPage: Math.ceil(total / pageSize),
          totalItems: total,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: [],
      error: error.message,
    });
  }
};

export const getAllProduct = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 12;
    const { name, category, tag, sort } = req.query;
    const skip = (page - 1) * pageSize;

    let filter = {};
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }
    if (category) {
      filter.categories = category;
    }
    if (tag) {
      filter.tags = tag;
    }

    let sortOption = {};
    if (sort === "asc") {
      sortOption = { price: 1 };
    } else if (sort === "desc") {
      sortOption = { price: -1 };
    }

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate("categories")
        .sort(sortOption)
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec(),
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        page: page,
        totalPage: Math.ceil(total / pageSize),
        pageSize: pageSize,
        totalItems: total,
      },
      data: products,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: [],
      error: error.message,
    });
  }
};

export const getProductSearch = async (req, res) => {
  try {
    const { search } = req.query;
    const products = await Product.find({
      name: {
        $regex: search,
        $options: "i",
      },
    });
    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: [],
      error: error.message,
    });
  }
};

export const getProductPageSearch = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 12;
    const { search } = req.query;
    const skip = (page - 1) * pageSize;
    let filter = {};
    if (search) {
      filter = Object.assign(filter, {
        name: {
          $regex: search,
          $options: "i",
        },
      });
    }
    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate({ path: "category", select: "name" })
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec(),
    ]);
    return res.status(200).json({
      success: true,
      pagination: {
        page: page,
        totalPage: Math.ceil(total / pageSize),
        pageSize: pageSize,
        totalItems: total,
      },
      data: products,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: [],
      error: error.message,
    });
  }
};

export const getProductDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    return res.status(500).json({
      success: true,
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: {},
      error: error.message,
    });
  }
};

export const getProductDetailBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({
      slug,
    }).populate({ path: "categories", select: "name slug" });
    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: {},
      error: error.message,
    });
  }
};

export const getListFromBrand = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 12;
    const { slug } = req.params;
    const brandIds = req.query.brands ? JSON.parse(req.query.brands) : [];

    const baseQuery = { enable: true };
    let name = "";

    if (slug) {
      const brand = await Brand.findOne({ slug });
      if (!brand) {
        return res.status(404).json({
          success: false,
          message: "Brand not found",
          data: [],
        });
      }
      name = brand.name;
      baseQuery.brand = brand._id;
    }

    if (brandIds.length > 0) {
      baseQuery.brand = {
        $in: brandIds.map((id) => new mongoose.Types.ObjectId(`${id}`)),
      };
    }

    const priceRangeData = await Product.aggregate([
      { $match: { enable: true } },
      {
        $group: {
          _id: null,
          min: { $min: "$price" },
          max: { $max: "$price" },
        },
      },
    ]);

    const priceRange = priceRangeData[0] || { min: 0, max: 0 };
    const allTags = await Product.distinct("tags", { enable: true });

    const createPriceRanges = (min, max) => {
      const roundedMin = Math.floor(min / 100000) * 100000;
      const roundedMax = Math.ceil(max / 100000) * 100000;
      const range = roundedMax - roundedMin;
      const step = Math.ceil(range / 4 / 100000) * 100000;

      return [
        {
          label: `Dưới ${Intl.NumberFormat("vi-VN").format(
            roundedMin + step
          )}đ`,
          min: 0,
          max: roundedMin + step,
          value: [0, roundedMin + step],
        },
        {
          label: `Từ ${Intl.NumberFormat("vi-VN").format(
            roundedMin + step
          )}đ - ${Intl.NumberFormat("vi-VN").format(roundedMin + 2 * step)}đ`,
          min: roundedMin + step,
          max: roundedMin + 2 * step,
          value: [roundedMin + step, roundedMin + 2 * step],
        },
        {
          label: `Từ ${Intl.NumberFormat("vi-VN").format(
            roundedMin + 2 * step
          )}đ - ${Intl.NumberFormat("vi-VN").format(roundedMin + 3 * step)}đ`,
          min: roundedMin + 2 * step,
          max: roundedMin + 3 * step,
          value: [roundedMin + 2 * step, roundedMin + 3 * step],
        },
        {
          label: `Trên ${Intl.NumberFormat("vi-VN").format(
            roundedMin + 3 * step
          )}đ`,
          min: roundedMin + 3 * step,
          max: Infinity,
          value: [roundedMin + 3 * step, roundedMax],
        },
      ];
    };

    if (req.query.price) {
      const [minPrice, maxPrice] = JSON.parse(req.query.price);
      if (minPrice !== undefined) {
        baseQuery.price = { $gte: parseFloat(minPrice) };
      }
      if (maxPrice !== undefined && maxPrice !== Infinity) {
        baseQuery.price = { ...baseQuery.price, $lte: parseFloat(maxPrice) };
      }
    }

    if (req.query.tags) {
      const tags = Array.isArray(req.query.tags)
        ? req.query.tags
        : [req.query.tags];
      baseQuery.tags = { $in: tags };
    }

    let sortQuery = {};
    if (req.query.sort) {
      switch (req.query.sort) {
        case "price_asc":
          sortQuery = { price: 1 };
          break;
        case "price_desc":
          sortQuery = { price: -1 };
          break;
        case "newest":
          sortQuery = { createdAt: -1 };
          break;
        case "oldest":
          sortQuery = { createdAt: 1 };
          break;
        default:
          sortQuery = { createdAt: -1 };
      }
    }

    const skip = (page - 1) * pageSize;

    const [total, products] = await Promise.all([
      Product.countDocuments(baseQuery),
      Product.find(baseQuery)
        .sort(sortQuery)
        .skip(skip)
        .limit(pageSize)
        .populate([
          {
            path: "brand",
            select: "name slug",
          },
        ])
        .lean()
        .exec(),
    ]);

    const priceRanges = createPriceRanges(priceRange.min, priceRange.max);

    return res.status(200).json({
      success: true,
      name,
      pagination: {
        page,
        totalPage: Math.ceil(total / pageSize),
        totalItems: total,
        pageSize,
      },
      filters: {
        priceRange: {
          min: Math.floor(priceRange.min),
          max: Math.ceil(priceRange.max),
          ranges: priceRanges,
        },
        availableTags: allTags,
        sortOptions: [
          { label: "Mới nhất", value: "newest" },
          { label: "Cũ nhất", value: "oldest" },
          { label: "Giá tăng dần", value: "price_asc" },
          { label: "Giá giảm dần", value: "price_desc" },
        ],
      },
      data: products,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: [],
      error: error.message,
    });
  }
};

export const getOtherProduct = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 8;
    const skip = (page - 1) * pageSize;

    const products = await Product.find()
      .populate("categories")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Product.countDocuments({
      enable: true,
    });

    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          pageSize,
          totalPage: Math.ceil(total / pageSize),
          totalItems: total,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: [],
      error: error.message,
    });
  }
};
