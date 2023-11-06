import { HydratedDocument, Model } from "mongoose";
import { TaskDocument } from "../task/taskTypes";
import { IPassword } from "./regular/password";
import { IGoogle } from "./oauth/google/google";

export interface IBaseUser {
  name: string;
  age: number;
  email: string;
  tokens: {
    token: string;
  }[];
  avatar?: Buffer | undefined;

  tasks?: TaskDocument[];

  createdAt: NativeDate;
  updatedAt: NativeDate;
}

// Add the fieldtypes of your addons here
export type IUser = IBaseUser & IPassword & IGoogle;

export interface IUserMethods {
  generateAuthenticationToken: () => Promise<string>;
}

export type UserDocument = HydratedDocument<IUser, IUserMethods>;

export interface UserModel extends Model<IUser, {}, IUserMethods> {
  findByCredentials: (email: string, password: string) => Promise<UserDocument>;
}

export type JWTToken = {
  _id: string;
};
