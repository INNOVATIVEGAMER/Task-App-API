import { Router } from "express";
import { google } from "googleapis";
import envs from "../../common/envs";
import { UserDefaultBirthdate } from "../../common/constants";
import User from "../../models/user/userModel";

const googleRouter = Router();
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
  envs.googleClientId,
  envs.googleClientSecret,
  envs.googleRedirectURL
);

// Create user in DB using GoogleSignUp
googleRouter.post("/", async (req, res) => {
  try {
    // Access scopes for users personal info, including any personal info you've made publicly available
    const scopes = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/user.birthday.read",
    ];

    // Generate a url that asks permissions for the relevant scopes
    const authorizationUrl = oauth2Client.generateAuthUrl({
      scope: scopes,
      include_granted_scopes: true,
      // 'offline' (gets refresh_token)
      access_type: "offline",
    });

    res.status(200).send({ url: authorizationUrl });
  } catch (error) {
    res.status(400).send(error);
  }
});

googleRouter.get("/re", async (req, res) => {
  try {
    const googleCode = req.query.code;
    if (!googleCode) throw new Error("GoogleCode not recieved");

    let { tokens } = await oauth2Client.getToken(googleCode as string);
    oauth2Client.setCredentials(tokens);

    google.options({ auth: oauth2Client });
    const userRes = await google.oauth2("v2").userinfo.get({});

    // Check if we have a user with same email ID already registered using oauth
    const userEmail = userRes.data.email;
    if (userEmail) {
      const oldUser = await User.findByGoogle(userEmail);
      if (oldUser) {
        const token = await oldUser.generateAuthenticationToken();
        res.redirect(
          `${envs.frontendURL}/signin?token=${encodeURIComponent(token)}`
        );
        return;
      }
    }

    // The google people API is used here to get general info about user
    // API config/console - https://console.cloud.google.com/apis/library/people.googleapis.com
    // API docs - https://developers.google.com/people/api/rest/v1/people/get
    const peopleAPI = google.people("v1");
    const userBDRes = await peopleAPI.people.get({
      resourceName: "people/me",
      personFields: "birthdays",
    });

    if (!userBDRes.data.birthdays)
      throw new Error("user birthdate data not found on google");

    const userBirthYear =
      userBDRes.data.birthdays[0].date?.year ??
      UserDefaultBirthdate.getUTCFullYear();
    const currentYear = new Date().getUTCFullYear();
    const userAge = currentYear - userBirthYear;

    const userData = {
      name: userRes.data.name,
      email: userRes.data.email,
      age: userAge,
      google: true,
    };

    const user = new User(userData);
    await user.save();
    const token = await user.generateAuthenticationToken();

    res.redirect(
      `${envs.frontendURL}/signin?token=${encodeURIComponent(token)}`
    );
  } catch (error) {
    res.status(400).send(error);
  }
});

export default googleRouter;
