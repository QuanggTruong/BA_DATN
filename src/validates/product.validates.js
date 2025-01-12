import { body } from "express-validator";

export const createProductValidate = [
  body("name")
    .notEmpty()
    .withMessage("Tên sản phẩm không được để trống")
    .isString()
    .withMessage("Tên sản phẩm phải là chuỗi"),
  body("categories")
    .notEmpty()
    .withMessage("Danh mục sản phẩm không được để trống")
    .isMongoId()
    .withMessage("ID danh mục không hợp lệ"),
  body("price")
    .notEmpty()
    .withMessage("Giá sản phẩm không được để trống")
    .isNumeric()
    .withMessage("Giá sản phẩm phải là số")
    .isFloat({ min: 0 })
    .withMessage("Giá sản phẩm không được âm"),
  body("description")
    .notEmpty()
    .withMessage("Mô tả sản phẩm không được để trống")
    .isString()
    .withMessage("Mô tả sản phẩm phải là chuỗi"),
  body("mainImage")
    .notEmpty()
    .withMessage("Ảnh chính của sản phẩm không được để trống")
    .isObject()
    .withMessage("Ảnh chính phải là một đối tượng"),
  body("mainImage.url")
    .notEmpty()
    .withMessage("URL ảnh chính không được để trống")
    .isURL()
    .withMessage("URL ảnh chính không hợp lệ"),
  body("mainImage.publicId")
    .notEmpty()
    .withMessage("Public ID của ảnh chính không được để trống")
    .isString()
    .withMessage("Public ID của ảnh chính phải là chuỗi"),
];

export const updateProductValidate = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Tên sản phẩm không được để trống")
    .isString()
    .withMessage("Tên sản phẩm phải là chuỗi"),
  body("category")
    .optional()
    .isMongoId()
    .withMessage("ID danh mục không hợp lệ"),
  body("price")
    .optional()
    .isNumeric()
    .withMessage("Giá sản phẩm phải là số")
    .isFloat({ min: 0 })
    .withMessage("Giá sản phẩm không được âm"),
  body("description")
    .optional()
    .isString()
    .withMessage("Mô tả sản phẩm phải là chuỗi"),
  body("mainImage")
    .optional()
    .isObject()
    .withMessage("Ảnh chính phải là một đối tượng"),
  body("mainImage.url")
    .optional()
    .isURL()
    .withMessage("URL ảnh chính không hợp lệ"),
  body("mainImage.publicId")
    .optional()
    .isString()
    .withMessage("Public ID của ảnh chính phải là chuỗi"),
  body("enable")
    .optional()
    .isBoolean()
    .withMessage("Trạng thái kích hoạt phải là boolean"),
];
