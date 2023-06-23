const express = require("express");
const multer = require("multer");
const User = require("../models/userModel");
const auth = require("../Middlewares/auth");
const sharp = require("sharp");
const { google } = require("googleapis");

const router = express.Router();
/**
 * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI
 * from the client_secret.json file. To get these credentials for your application, visit
 * https://console.cloud.google.com/apis/credentials.
 *
 * For detail explanation of how this google ouath2.0 works -
 * https://developers.google.com/identity/protocols/oauth2 (Overall Idea of oauth2.0)
 * https://developers.google.com/identity/protocols/oauth2/web-server#node.js (Implementation in nodejs web server)
 */
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

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

// Create user in DB using GoogleSignUp
router.post("/users/google", async (req, res) => {
  try {
    // Access scopes for users personal info, including any personal info you've made publicly available
    const scopes = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/user.birthday.read",
    ];

    // Generate a url that asks permissions for the Drive activity scope
    const authorizationUrl = oauth2Client.generateAuthUrl({
      // Pass in the scopes array defined above.
      scope: scopes,
      // Enable incremental authorization. Recommended as a best practice.
      include_granted_scopes: true,
      // 'offline' (gets refresh_token)
      access_type: "offline",
    });

    res.status(200).send({ url: authorizationUrl });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get("/users/auth/google", async (req, res) => {
  try {
    const googleCode = req.query.code;
    let { tokens } = await oauth2Client.getToken(googleCode);
    oauth2Client.setCredentials(tokens);

    google.options({ auth: oauth2Client });
    const userRes = await google.oauth2("v2").userinfo.get({});
    // The google people API is used here to get general info about user
    // API config/console - https://console.cloud.google.com/apis/library/people.googleapis.com
    // API docs - https://developers.google.com/people/api/rest/v1/people/get
    const peopleAPI = google.people("v1");
    const userBDRes = await peopleAPI.people.get({
      resourceName: "people/me",
      personFields: "birthdays",
    });

    const userBirthYear = userBDRes.data.birthdays[0].date.year;
    const currentYear = new Date().getFullYear();
    const userAge = currentYear - userBirthYear;

    const userDoc = {
      name: userRes.data.name,
      email: userRes.data.email,
      age: userAge,
    };

    console.log(userDoc);
    res.status(200).send({ msg: "User created using Google OAuth2" });
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
