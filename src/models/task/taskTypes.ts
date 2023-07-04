import { HydratedDocument, Model, ObjectId } from "mongoose";

export interface ITask {
  description: string;
  completed: boolean;
  owner: ObjectId;

  createdAt: NativeDate;
  updatedAt: NativeDate;
}

export type TaskDocument = HydratedDocument<ITask>;

export type TaskModel = Model<ITask>;
