import mongoose, { InferSchemaType, model, Schema } from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Task from "../task/taskModel";
import envs from "../../common/envs";
import { IUser, IUserMethods, UserModel, JWTToken } from "./userTypes";

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, default: 0 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.isEmail(value))
          throw new Error("Invalid Email address!!!");
      },
    },
    password: {
      type: String,
      required: true,
      minLength: 7,
      trim: true,
      validate(value: string) {
        if (value.toLowerCase().includes("password"))
          throw new Error("Weak Password!!!");
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  { timestamps: true }
);

userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userObj = user.toObject();

  delete userObj.password;
  delete userObj.tokens;
  delete userObj.avatar;

  return userObj;
};

userSchema.methods.generateAuthenticationToken = async function () {
  const user = this;
  const tokenData: JWTToken = { _id: user._id.toString() };
  const token = jwt.sign(tokenData, envs.jwtSecret);

  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

userSchema.statics.findByCredentials = async (
  email: string,
  password: string
) => {
  if (!email || !password) throw new Error("Invalid Credentials");

  const user = await User.findOne({ email });

  if (!user)
    throw new Error(`There is no account registered with ${email} address`);

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) throw new Error("Invalid Password");

  return user;
};

//Hash the user password before saving in the database.
userSchema.pre("save", async function () {
  const user = this;

  if (user.isModified("password"))
    user.password = await bcrypt.hash(user.password, 8);
});

//Delete all tasks related to a specific user when user gets deleted
userSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function () {
    const user = this;
    await Task.deleteMany({ owner: user._id });
  }
);

const User = model<IUser, UserModel>("User", userSchema);

export default User;
