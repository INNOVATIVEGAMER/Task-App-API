const express = require("express");
const multer = require("multer");
const User = require("../models/userModel");
const auth = require("../Middlewares/auth");
const sharp = require("sharp");

const router = express.Router();

//Create user in DB
router.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);
    const userDoc = await user.save();
    const token = await user.generateAuthenticationToken();
    // sendWelcomeMail(user.name, user.email);
    res.status(201).send({ userDoc, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

//LogIn user
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );

    const token = await user.generateAuthenticationToken();

    res.send({ user, token });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

//LogOut user from one session
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );

    await req.user.save();

    res.status(200).send("Successfully logged out :)");
  } catch (error) {
    res.status(500).send({ error: "Error logging out!!!" });
  }
});

//LogOut user from all sessions
router.post("/users/logoutall", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();

    res.status(200).send("Successfully logged out from all sessions :)");
  } catch (error) {
    res.status(500).send({ error: "Error logging out!!!" });
  }
});

//Get all users in DB
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({});
    if (!users) {
      res.status(404).send({ error: "Users not found!!!" });
      return;
    }

    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Get current authenticated user
router.get("/users/me", auth, (req, res) => {
  res.send(req.user);
});

//Get user by ID from DB
router.get("/users/:id", auth, async (req, res) => {
  try {
    const _id = req.params.id;
    const user = await User.findById(_id);

    if (!user) {
      res.status(404).send({ error: "User not found!!!" });
      return;
    }
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Update current authenticated user in DB
router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];

  const isValidUpdates = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidUpdates) {
    res.status(400).send({ error: "invalid updates" });
    return;
  }

  try {
    const user = req.user;

    updates.forEach((update) => {
      user[update] = req.body[update];
    });

    const updatedUser = await user.save();

    res.send(updatedUser);
  } catch (error) {
    res.status(400).send(error);
  }
});

//Delete current authenticated user from DB
router.delete("/users/me", auth, async (req, res) => {
  try {
    const _id = req.user._id;
    const user = await User.findById(_id);
    if (!user) {
      res.status(404).send({ error: "User not found!!!" });
      return;
    }

    const deletedUser = await user.remove();
    // sendAccountDeleteMail(deletedUser.name, deletedUser.email);
    res.send(deletedUser);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Set user profile avatar
const maxFileSize = 1000000;
const avatar = multer({
  limits: { fileSize: maxFileSize },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(new Error("Please upload a image!!!"));
      return;
    }

    //successfull validation
    cb(undefined, true);
  },
});

router.post(
  "/users/me/avatar",
  auth,
  avatar.single("avatar_image"),
  async (req, res) => {
    try {
      const imageBuffer = await sharp(req.file.buffer)
        .resize({ width: 250, height: 250 })
        .png()
        .toBuffer();
      req.user.avatar = imageBuffer;
      await req.user.save();
      res.send("Avatar added successfully");
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  },
  (err, req, res, next) => {
    res.status(400).send({ error: err.message });
  }
);

//Remove user profile avatar
router.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.send("Avatar removed successfully");
  } catch (error) {
    res.status(500).send({ error: "Something went wrong" });
  }
});

//Get user profile avatar by ID
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) throw new Error();

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (error) {
    res.status(404).send();
  }
});

module.exports = router;
