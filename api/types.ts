import { UserDocument } from "./../src/models/user/userTypes";
export {};

declare global {
  namespace Express {
    interface Request {
      token: string;
      user: UserDocument;
    }
  }
}
