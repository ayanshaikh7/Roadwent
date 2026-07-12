const express = require('express');
const router = express.Router();
const Estimator = require('../models/Estimator');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Not authenticated' });
};

// Get all estimator data for the current user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const estimators = await Estimator.find({ user: req.user._id });
    res.json(estimators);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific estimator by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const estimator = await Estimator.findOne({ _id: req.params.id, user: req.user._id });
    if (!estimator) {
      return res.status(404).json({ message: 'Estimator data not found' });
    }
    res.json(estimator);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new estimator data
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { 
      projectName, 
      clientName, 
      roadType, 
      roadLength, 
      roadWidth, 
      materials, 
      laborCost, 
      equipmentCost, 
      totalCost, 
      estimatedTime, 
      notes 
    } = req.body;
    
    const newEstimator = new Estimator({
      user: req.user._id,
      projectName,
      clientName,
      roadType,
      roadLength,
      roadWidth,
      materials,
      laborCost,
      equipmentCost,
      totalCost,
      estimatedTime,
      notes
    });
    
    await newEstimator.save();
    res.status(201).json(newEstimator);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update estimator data
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { 
      projectName, 
      clientName, 
      roadType, 
      roadLength, 
      roadWidth, 
      materials, 
      laborCost, 
      equipmentCost, 
      totalCost, 
      estimatedTime, 
      notes 
    } = req.body;
    
    // Find estimator and check ownership
    const estimator = await Estimator.findOne({ _id: req.params.id, user: req.user._id });
    if (!estimator) {
      return res.status(404).json({ message: 'Estimator data not found' });
    }
    
    // Update fields
    if (projectName) estimator.projectName = projectName;
    if (clientName) estimator.clientName = clientName;
    if (roadType) estimator.roadType = roadType;
    if (roadLength) estimator.roadLength = roadLength;
    if (roadWidth) estimator.roadWidth = roadWidth;
    if (materials) estimator.materials = materials;
    if (laborCost) estimator.laborCost = laborCost;
    if (equipmentCost) estimator.equipmentCost = equipmentCost;
    if (totalCost) estimator.totalCost = totalCost;
    if (estimatedTime) estimator.estimatedTime = estimatedTime;
    if (notes) estimator.notes = notes;
    estimator.updatedAt = Date.now();
    
    await estimator.save();
    res.json(estimator);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete estimator data
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const estimator = await Estimator.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!estimator) {
      return res.status(404).json({ message: 'Estimator data not found' });
    }
    res.json({ message: 'Estimator data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;