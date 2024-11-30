const express = require("express");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Price = require("../models/priceModel");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const router = express.Router();
const auth = require("../middlewares/auth");

router.post("/signup", async (req, res) => {
  const { user_name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ error: "Email already registered" });
    }
    const hashedPassword = await argon2.hash(password);
    const user = new User({ user_name, email, password: hashedPassword });
    await user.save();
    res.status(200).send({ message: "User Registered" });
  } catch (error) {
    res.status(500).send({ message: "Server Error" });
  }
});

router.post("/", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ error: "Invalid email or password" });
    }

    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch) {
      return res.status(400).send({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ _id: user._id }, "mySuperSecretKey12345", {
      expiresIn: "24h",
    });

    res.status(200).send({
      message: "Login Successful",
      token: token,
      user: {
        user_id: user._id,
        Name: user.user_name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Server error" });
  }
});

router.get("/home", auth, async (req, res) => {
  try {
    const products = await Product.find();
    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    const price = await Price.findOne();
    const data = products.map((product) => {
      const category = product.Category.toLowerCase();
      const gst = price.GST[category];

      const discount = price.Discount[category];

      const discountedPrice = product.Price - (product.Price * discount) / 100;

      const lastPrice = discountedPrice + (discountedPrice * gst) / 100;
      console.log(lastPrice);

      return {
        _id: product._id,
        Name: product.Product_name,
        Image: product.Product_image,
        Description: product.Description,
        Price: product.Price,
        Discount: discount,
        GST: gst,
        discountedPrice: discountedPrice,
        lastPrice: lastPrice.toFixed(0),
      };
    });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
});

router.post("/home/add", auth, async (req, res) => {
  const productId = new ObjectId(req.body.productId);
  const userId = req.user._id;

  try {
    const product = await Product.findById(productId);
    const user = await User.findById(userId);
    user.orders.push({ product_id: productId });
    await user.save();
    res.status(200).json({ message: "order placed" });
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
});

router.get("/orders", auth, async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const price = await Price.findOne();
    if (!price) {
      return res.status(404).json({ error: "Pricing information not found" });
    }
    const productIds = user.orders.map((order) => order.product_id);
    const products = await Product.find({ _id: { $in: productIds } });
    const data = products.map((product) => {
      const category = product.Category.toLowerCase();
      console.log(category);
      const gst = price.GST[category]
      console.log(gst);
      const discount = price.Discount[category]
      console.log(discount);
      const discountedPrice = product.Price - (product.Price * discount) / 100;
      const lastPrice = discountedPrice + (discountedPrice * gst) / 100;

      return {
        _id: product._id,
        Name: product.Product_name,
        Image: product.Product_image,
        Description: product.Description,
        Price: product.Price,
        Discount: discount,
        GST: gst,
        discountedPrice: discountedPrice.toFixed(2),
        lastPrice: lastPrice.toFixed(2),
      };
    });
    res.json(data);
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});




module.exports = router;
