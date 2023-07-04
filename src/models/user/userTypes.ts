import { HydratedDocument, Model } from "mongoose";
import { TaskDocument } from "../task/taskTypes";

export interface IUser {
  name: string;
  age: number;
  email: string;
  password: string;
  tokens: {
    token: string;
  }[];
  avatar?: Buffer | undefined;

  tasks?: TaskDocument[];

  createdAt: NativeDate;
  updatedAt: NativeDate;
}

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
