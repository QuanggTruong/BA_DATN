import express from "express";
import {
  getListFromBrand,
  getListFromCategory,
  getOtherProduct,
  getProductDetailBySlug,
  getProductHot,
  getProductNew,
  getProductPageSearch,
  getProductSale,
  getProductSearch,
  getProductSelling,
} from "../controllers/product.controller.js";
import { getAllCategory } from "../controllers/category.controller.js";
import {
  getAccountCustomer,
  loginCustomer,
  registerCustomer,
  resetPassword,
  sendOtp,
  updateAccount,
  verifyOtp,
} from "../controllers/auth.controller.js";
import { authMiddlewareCustomer } from "../middleware/auth.middleware.js";
import {
  createOrderCod,
  createOrderStripe,
  createOrderVnpay,
  getOrderByCustomer,
  orderStripeReturn,
  orderVnpayReturn,
  updateOrder,
} from "../controllers/order.controller.js";
import {
  createReview,
  getReviewByCustomer,
} from "../controllers/review.controller.js";
import { validateMiddleWare } from "../middleware/validate.middleware.js";
import {
  loginCustomerValidate,
  registerCustomerValidate,
  resetPasswordValidate,
  updateAccountValidate,
} from "../validates/auth.validate.js";
import { createOrderValidate } from "../validates/order.validate.js";
import { createReviewValidate } from "../validates/review.validate.js";
import { createContact } from "../controllers/contact.controller.js";
import { getAllBrand } from "../controllers/brand.controller.js";

const router = express.Router();

router.get("/products-by-category/:slug", getListFromCategory);
router.get("/products-by-brand/:slug", getListFromBrand);
router.get("/products-search", getProductSearch);
router.get("/product-detail/:slug", getProductDetailBySlug);
router.get("/products-new", getProductNew);
router.get("/products-hot", getProductHot);
router.get("/products-sale", getProductSale);
router.get("/products-selling", getProductSelling);
router.get("/products-other", getOtherProduct);

router.get("products-search-page", getProductPageSearch);

router.get("/categories", getAllCategory);

router.post("/login", loginCustomerValidate, validateMiddleWare, loginCustomer);
router.post(
  "/register",
  registerCustomerValidate,
  validateMiddleWare,
  registerCustomer
);
router.post("/verify-otp", verifyOtp);
router.post("/send-otp", sendOtp);
router.post(
  "/reset-password",
  resetPasswordValidate,
  validateMiddleWare,
  resetPassword
);
router.put(
  "/account",
  authMiddlewareCustomer,
  updateAccountValidate,
  validateMiddleWare,
  updateAccount
);
router.get("/account", authMiddlewareCustomer, getAccountCustomer);

router.post(
  "/order-cod",
  authMiddlewareCustomer,
  createOrderValidate,
  createOrderCod
);
router.post(
  "/order-vnpay",
  authMiddlewareCustomer,
  createOrderValidate,
  createOrderVnpay
);
router.post(
  "/order-stripe",
  authMiddlewareCustomer,
  createOrderValidate,
  createOrderStripe
);
router.post("/order-vnpay-return", authMiddlewareCustomer, orderVnpayReturn);
router.get("/order-stripe-return", authMiddlewareCustomer, orderStripeReturn);
router.put("/order-status/:id", authMiddlewareCustomer, updateOrder);
router.get("/orders", authMiddlewareCustomer, getOrderByCustomer);

router.post(
  "/reviews",
  authMiddlewareCustomer,
  createReviewValidate,
  validateMiddleWare,
  createReview
);
router.get("/reviews/:productId", getReviewByCustomer);

router.post("/contacts", createContact);
router.get("/brands", getAllBrand);

export default router;
