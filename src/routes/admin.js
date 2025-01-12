import express from "express";
import {
  createCategory,
  getAllCategory,
  removeCategory,
  updateCategory,
} from "../controllers/category.controller.js";
import {
  createProduct,
  getAllProduct,
  getProductDetail,
  removeProduct,
  updateProduct,
} from "../controllers/product.controller.js";
import { getAccountAdmin, loginAdmin } from "../controllers/auth.controller.js";
import { authMiddlewareAdmin } from "../middleware/auth.middleware.js";
import {
  getOrderByAdmin,
  getOrderDetails,
  removeOrder,
  updateOrder,
} from "../controllers/order.controller.js";
import {
  getReviewByAdmin,
  removeReview,
  updateReview,
} from "../controllers/review.controller.js";
import { getAllUser, updateUser } from "../controllers/user.controller.js";
import { validateMiddleWare } from "../middleware/validate.middleware.js";
import { loginAdminValidate } from "../validates/auth.validate.js";
import { statisticalDashboard } from "../services/statistical.js";
import {
  getContactList,
  removeContact,
  replyContact,
} from "../controllers/contact.controller.js";
import {
  getSetting,
  updateSetting,
} from "../controllers/setting.controller.js";
import {
  createBrand,
  deleteBrand,
  getAllBrand,
  updateBrand,
} from "../controllers/brand.controller.js";

const router = express.Router();

router.post("/login", loginAdminValidate, validateMiddleWare, loginAdmin);
router.get("/account", authMiddlewareAdmin, getAccountAdmin);

router.post("/categories", authMiddlewareAdmin, createCategory);
router.get("/categories", authMiddlewareAdmin, getAllCategory);
router.put("/categories/:id", authMiddlewareAdmin, updateCategory);
router.delete("/categories/:id", authMiddlewareAdmin, removeCategory);

router.get("/products", authMiddlewareAdmin, getAllProduct);
router.get("/products/:id", authMiddlewareAdmin, getProductDetail);
router.post("/products", authMiddlewareAdmin, createProduct);
router.put("/products/:id", authMiddlewareAdmin, updateProduct);
router.delete("/products/:id", authMiddlewareAdmin, removeProduct);

router.get("/orders", authMiddlewareAdmin, getOrderByAdmin);
router.put("/orders/:id", authMiddlewareAdmin, updateOrder);
router.delete("/orders/:id", authMiddlewareAdmin, removeOrder);
router.get("/orders/:id", authMiddlewareAdmin, getOrderDetails);

router.get("/reviews", authMiddlewareAdmin, getReviewByAdmin);
router.put("/reviews/:id", authMiddlewareAdmin, updateReview);
router.delete("/reviews/:id", authMiddlewareAdmin, removeReview);

router.get("/users", authMiddlewareAdmin, getAllUser);
router.put("/users/:id", authMiddlewareAdmin, updateUser);

router.get("/statistical", authMiddlewareAdmin, statisticalDashboard);

router.get("/contacts", authMiddlewareAdmin, getContactList);
router.put("/contacts/reply/:id", authMiddlewareAdmin, replyContact);
router.delete("/contacts/:id", authMiddlewareAdmin, removeContact);

router.get("/settings", getSetting);
router.put("/settings", authMiddlewareAdmin, updateSetting);

router.get("/brands", authMiddlewareAdmin, getAllBrand);
router.post("/brands", authMiddlewareAdmin, createBrand);
router.put("/brands/:id", authMiddlewareAdmin, updateBrand);
router.delete("/brands/:id", authMiddlewareAdmin, deleteBrand);

export default router;
