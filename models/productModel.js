const mongoose = require("mongoose");
const productSchema = new mongoose.Schema({
  Product_image: {
    type: String,
    required: true,
  },
  Product_name: {
    type: String,
    required: true,
  },
  Category: {
    type: String,
    required: true,
  },
  Price: {
    type: Number,
  },
  Description: {
    type: String,
    required: true,
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
