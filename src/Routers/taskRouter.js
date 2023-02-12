const express = require("express");
const Task = require("../models/taskModel");
const auth = require("../Middlewares/auth");
const { query } = require("express");

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
  const match = {};
  const options = {};
  const sort = {};
  const sortSeparator = "_";

  //Filtering requested data
  if (req.query.completed) match.completed = req.query.completed === "true";

  //Paginating requested data
  options.limit = parseInt(req.query.limit);
  options.skip = parseInt(req.query.skip);

  //Sorting requested data
  if (req.query.sortBy) {
    const sortTerms = req.query.sortBy.split(sortSeparator);
    sort[sortTerms[0]] = sortTerms[1] === "desc" ? -1 : 1;
    options.sort = sort;
  }

  try {
    await req.user.populate({ path: "tasks", match, options }).execPopulate();
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
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];

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
      task[update] = req.body[update];
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

module.exports = router;
