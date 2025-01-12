import mongoose from "mongoose";
import slugify from "slugify";

export const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
    ],
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    mainImage: {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
      },
    ],
    enable: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: String,
        default: [],
        enum: ["HOT", "NEW", "SALE", "SELLING"],
      },
    ],
    totalQuantity: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

ProductSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true, locale: "vi" });
  next();
});
ProductSchema.index({ slug: 1 }, { unique: true });
const Product = mongoose.model("Product", ProductSchema);

export default Product;
