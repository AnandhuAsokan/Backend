var express = require("express");
var router = express.Router();
var {
  validateEmail,
  validatePassword,
} = require("../middlewares/customValidator");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const argon2 = require("argon2");
const multer = require("multer");
const path = require("path");
const Product = require("../models/productModel");
const Prices = require("../models/priceModel");
const { error } = require("console");
const { monitorEventLoopDelay } = require("perf_hooks");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/images"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const isValid = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (isValid) {
      return cb(null, true);
    } else {
      cb(new Error("invalid File type"));
    }
  },
});

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userEmail) {
    return next();
  }
  res.redirect("/");
};


router.get("/", (req, res) => {
  res.render("login", { error: null });
});

router.post("/", async (req, res) => {
  const { email, password } = req.body;
  const error = [];
  const foundUser = await User.findOne({ email });
  if (!foundUser) {
    error.push({ msg: "invalid email id" });
    return res.render("login", { error: "no user found" });
  }

  if (!foundUser.isAdmin) {
    return res.render("login", {
      error: "Access denied. Admins only."
    });
  }

  const isMatch = await argon2.verify(foundUser.password, password);
  if (!isMatch) {
    error.push({ msg: "Incorrect Password" });
    return res.render("login", { error });
  }
  req.session.userId = foundUser._id;
  req.session.userEmail = foundUser.email;
  res.redirect("/products", 302, { error: null });
});


router.get("/add_product", isAuthenticated, (req, res) => {
  res.render("add_dish", { error: null });
});

router.post(
  "/add_product",
  upload.fields([{ name: "temp" }]),
  async (req, res) => {
    try {
      const { Product_name, Category, Price, Description } = req.body;
      console.log(req.body);
      if (!req.files || !req.files["temp"]) {
        return res.render("add_dish", { error: "Image upload failed." });
      }
      const imgPath = `./images/${req.files["temp"][0].filename}`;

      const product = new Product({
        Product_image: imgPath,
        Product_name,
        Category,
        Price,
        Description,
      });

      const validationError = product.validateSync();
      if (validationError) {
        console.log(error);
        return res.render("add_dish", { error: validationError.errors });
      }
      await product.save();
      return res.render("add_dish", { error: null });
    } catch (error) {
      console.error(error);
      console.error(error);
      return res.status(500).send("Error processing the request.");
    }
  }
);

router.get("/products", isAuthenticated, async (req, res) => {
  try {
    const products = await Product.find();
    res.render("products", { products });
  } catch (error) {
    console.error(error);
  }
});

router.get("/price",isAuthenticated, async (req, res) => {
  try {
    const prices = await Prices.find();
    res.render("price", { prices });
  } catch (error) {
    console.error(error);
  }
});

router.get("/updateData/:id", isAuthenticated, async (req, res) => {
  try {
    const priceId = req.params.id;
    const category = req.query.category;
    const price = await Prices.findById(priceId);
    res.render("edit", {
      price,
      category,
      discount: price.Discount[category],
      gst: price.GST[category],
    });
  } catch (error) {
    console.log("error");
  }
});

router.post("/updateData/:id", async (req, res) => {
  const priceId = req.params.id;
  const category = req.query.category;
  const { Discount, GST } = req.body;

  const validCategories = ["fasions", "medicines", "electronics", "grocery"];
  if (!validCategories.includes(category)) {
    return res.status(400).send("Invalid category.");
  }

  const discountValue = parseFloat(Discount);
  const gstValue = parseFloat(GST);

  if (isNaN(discountValue) || isNaN(gstValue)) {
    return res.status(400).send("Invalid Discount or GST values.");
  }

  try {
    const updateData = {
      [`Discount.${category}`]: discountValue,
      [`GST.${category}`]: gstValue,
    };
    console.log(updateData);

    const updatedPrice = await Prices.findByIdAndUpdate(
      priceId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedPrice) {
      return res.status(404).send("Price record not found.");
    }

    console.log(`Successfully updated ${category}:`, updatedPrice);
    res.redirect("/price");
  } catch (error) {
    console.error("Error updating price:", error);
    res.status(500).send("An error occurred while updating the price.");
  }
});

router.get("/orders",isAuthenticated, async (req, res) => {
  try {
    const users = await User.find();
    const price = await Prices.findOne();
    const productId = [];

    users.forEach((user) => {
      user.orders.forEach((order) => {
        if (order.product_id) {
          productId.push(order.product_id);
        }
      });
    });

    const products = await Product.find({ _id: { $in: productId } });

    const combinedData = [];

    users.forEach((user) => {
      user.orders.forEach((order) => {
        const product = products.find(
          (p) => p._id.toString() === order.product_id.toString()
        );
        if (product) {
          const formattedDate = formatDate(order.date);

          combinedData.push({
            user_name: user.user_name,
            product_name: product.Product_name,
            date: formattedDate,
          });
        }
      });
    });

    res.render("orders", { combinedData });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      res.send("Error");
    } else {
      res.redirect("/");
    }
  });
});


module.exports = router;
