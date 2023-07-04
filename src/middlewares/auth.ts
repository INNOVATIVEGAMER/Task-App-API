import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import envs from "../common/envs";
import { JWTToken } from "../models/user/userTypes";
import User from "../models/user/userModel";

const auth: RequestHandler = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) throw new Error("Authentication Failed!!! Token is undefined");

    const decoded = jwt.verify(token, envs.jwtSecret) as JWTToken;
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) throw new Error("Authentication Failed!!! User not found");

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error });
  }
};

export default auth;
