import express from "express";
import Task from "../models/task/taskModel";
import auth from "../middlewares/auth";
import { query } from "express";
import { QueryOptions } from "mongoose";
import { TaskDocument } from "../models/task/taskTypes";

const router = express.Router();

//Create task in DB
router.post("/tasks", auth, async (req, res) => {
  try {
    const task = new Task({ ...req.body, owner: req.user._id });
    const taskDoc = await task.save();
    res.status(201).send(taskDoc);
  } catch (error) {
    res.status(400).send(error);
  }
});

//Get all tasks for a authenticated user from DB
router.get("/tasks", auth, async (req, res) => {
  const match: any = {};
  const options: QueryOptions = {};
  const sort: any = {};
  const sortSeparator = "_";

  //Filtering requested data
  if (req.query.completed) match.completed = req.query.completed === "true";

  //Paginating requested data
  const limit = parseInt(req.query.limit as string);
  const skip = parseInt(req.query.skip as string);

  if (!isNaN(limit)) options.limit = limit;
  if (!isNaN(skip)) options.skip = skip;

  //Sorting requested data
  if (req.query.sortBy) {
    const sortTerms = (req.query.sortBy as string).split(sortSeparator);
    if (sortTerms.length === 2) {
      const [sortField, sortOrder] = sortTerms;
      sort[sortField] = sortOrder === "desc" ? -1 : 1;
      options.sort = sort;
    }
  }

  try {
    await req.user.populate({ path: "tasks", match, options });
    const tasks = req.user.tasks;
    if (!tasks) {
      res.status(404).send({ error: "Tasks not found!!!" });
      return;
    }
    res.send(tasks);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Get task by ID for a authenticated user from DB
router.get("/tasks/:id", auth, async (req, res) => {
  try {
    const _id = req.params.id;
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task) {
      res.status(404).send({ error: "Task not found!!!" });
      return;
    }
    res.send(task);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Update task by ID for a authenticated user in DB
router.patch("/tasks/:id", auth, async (req, res) => {
  type updateType = keyof TaskDocument;
  const updates = Object.keys(req.body) as updateType[];
  const allowedUpdates: updateType[] = ["description", "completed"];

  const isValidUpdates = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidUpdates) {
    res.status(400).send({ error: "invalid updates" });
    return;
  }

  try {
    const _id = req.params.id;
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      res.status(404).send({ error: "Task not found!!!" });
      return;
    }

    updates.forEach((update) => {
      task.set(update, req.body[update]);
    });

    const updatedTask = await task.save();

    res.send(updatedTask);
  } catch (error) {
    res.status(400).send(error);
  }
});

//Delete task by ID for a authenticated user in DB
router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const _id = req.params.id;
    const deletedTask = await Task.findOneAndDelete({
      _id,
      owner: req.user._id,
    });
    if (!deletedTask) {
      res.status(404).send({ error: "Task not found!!!" });
      return;
    }

    res.send(deletedTask);
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router;
