const express = require('express');
const Todo = require('../models/Todo');
const router = express.Router();

// Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: 'Unauthorized. Please log in.' });
}

// Fetch all todos for the authenticated user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.id });
    res.json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new todo
router.post('/', isAuthenticated, async (req, res) => {
  const { task } = req.body;

  if (!task) {
    return res.status(400).json({ message: 'Task cannot be empty' });
  }

  try {
    const newTodo = new Todo({
      userId: req.user.id,
      task,
    });

    const savedTodo = await newTodo.save();
    res.json(savedTodo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a todo
router.put('/:id', isAuthenticated, async (req, res) => {
  const { task, completed } = req.body;

  try {
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { task, completed },
      { new: true }
    );

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json(todo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a todo
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;