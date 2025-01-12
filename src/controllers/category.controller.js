import { buildCategoryTree } from "../helpers/buildCategoryTree.js";
import Category from "../models/category.model.js";

export const getAllCategory = async (req, res) => {
  try {
    const { page, pageSize, name } = req.query;
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(pageSize) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    let filter = {};
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    if (!page && !pageSize && !name) {
      const categories = await Category.find().sort({ level: 1 }).lean().exec();
      const categoryTree = buildCategoryTree(categories);
      return res.status(200).json({
        success: true,
        data: categoryTree,
      });
    } else {
      // Lấy tất cả categories
      const [allCategories, total] = await Promise.all([
        Category.find(filter).sort({ level: 1, name: 1 }).lean().exec(),
        Category.countDocuments(filter),
      ]);

      // Tách ra categories level 0 và level 1
      const level0Categories = allCategories.filter((cat) => cat.level === 0);
      const level1Categories = allCategories.filter((cat) => cat.level === 1);

      // Thêm subcategories vào categories level 0
      const categoriesWithSubcategories = allCategories.map((cat) => {
        if (cat.level === 0) {
          return {
            ...cat,
            subcategories: level1Categories
              .filter(
                (childCat) => childCat.parent?.toString() === cat._id.toString()
              )
              .map((child) => child.name),
          };
        }
        return cat;
      });

      // Áp dụng phân trang cho kết quả cuối cùng
      const paginatedCategories = categoriesWithSubcategories.slice(
        skip,
        skip + limitNumber
      );

      let response = {
        success: true,
        data: paginatedCategories,
        pagination: {
          page: pageNumber,
          totalPage: Math.ceil(total / limitNumber),
          totalItems: total,
          pageSize: limitNumber,
        },
      };

      return res.status(200).json(response);
    }
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

export const createCategory = async (req, res) => {
  try {
    const { name, parent, type } = req.body;

    const existingCategory = await Category.findOne({ name }).lean();
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Danh mục đã tồn tại",
      });
    }

    let level = 0;
    let parentCategory = null;

    if (parent) {
      parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: "Danh mục cha không tồn tại",
        });
      }
      level = parentCategory.level + 1;
    }

    const newCategory = new Category({
      name,
      parent: parent || null,
      level,
      type,
    });

    const savedCategory = await newCategory.save({ validateBeforeSave: false });

    return res.status(201).json({
      success: true,
      message: "Tạo mới danh mục thành công",
      data: savedCategory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo danh mục",
      error: error.message,
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent, type } = req.body;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục cần cập nhật",
      });
    }

    category.name = name !== undefined ? name : category.name;
    category.parent = parent !== undefined ? parent : category.parent;
    category.type = type !== undefined ? type : category.type;

    const updatedCategory = await category.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Cập nhật danh mục thành công",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const removeCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục",
      });
    }

    const hasSubcategories = await Category.exists({ parent: id });
    if (hasSubcategories) {
      return res.status(400).json({
        success: false,
        message:
          "Không thể xóa danh mục này vì còn chứa danh mục con. Vui lòng xóa các danh mục con trước.",
      });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Xóa danh mục thành công",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
