import { InferSchemaType, model, Schema } from "mongoose";
import { ITask, TaskModel } from "./taskTypes";

const taskSchema = new Schema<ITask, TaskModel>(
  {
    description: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Task = model<ITask, TaskModel>("Task", taskSchema);

export default Task;
