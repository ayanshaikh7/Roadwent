const express = require('express');
const router = express.Router();
const Estimate = require('../models/Estimate');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Not authenticated' });
};

// @route   POST /api/estimates
// @desc    Create a new estimate
// @access  Private
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { title, projectName, estimatedCost, estimatedTime, details } = req.body;
    
    // Create new estimate
    const newEstimate = new Estimate({
      title,
      user: req.user.id, // user is set by Passport when authenticated
      projectName,
      estimatedCost,
      estimatedTime,
      details,
    });

    const estimate = await newEstimate.save();
    res.status(201).json(estimate);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/estimates
// @desc    Get all estimates for a user
// @access  Private
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const estimates = await Estimate.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(estimates);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/estimates/:id
// @desc    Get estimate by ID
// @access  Private
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const estimate = await Estimate.findById(req.params.id);
    
    if (!estimate) {
      return res.status(404).json({ msg: 'Estimate not found' });
    }

    // Check user owns the estimate
    if (estimate.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    res.json(estimate);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Estimate not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;