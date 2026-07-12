const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Not authenticated' });
};

// Get all reports for the current user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user._id });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific report by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, user: req.user._id });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new report
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const {
      title,
      description,
      projectName,
      estimatedCost,
      estimatedTime,
      status,
      // full content (optional)
      projectDetails,
      clientDetails,
      items,
      searchResults,
      inputData,
      editableRates,
      rateSelection,
      grandTotalCost,
      grandTotalInWords
    } = req.body;

    const newReport = new Report({
      title,
      description,
      user: req.user._id,
      projectName,
      estimatedCost,
      estimatedTime,
      status: status || 'draft',
      projectDetails,
      clientDetails,
      items,
      searchResults,
      inputData,
      editableRates,
      rateSelection,
      grandTotalCost,
      grandTotalInWords
    });

    await newReport.save();
    res.status(201).json(newReport);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a report
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const {
      title,
      description,
      projectName,
      estimatedCost,
      estimatedTime,
      status,
      projectDetails,
      clientDetails,
      items,
      searchResults,
      inputData,
      editableRates,
      rateSelection,
      grandTotalCost,
      grandTotalInWords
    } = req.body;

    // Find report and check ownership
    const report = await Report.findOne({ _id: req.params.id, user: req.user._id });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Update fields
    report.title = title ?? report.title;
    report.description = description ?? report.description;
    report.projectName = projectName ?? report.projectName;
    report.estimatedCost = typeof estimatedCost === 'number' ? estimatedCost : report.estimatedCost;
    report.estimatedTime = typeof estimatedTime === 'number' ? estimatedTime : report.estimatedTime;
    report.status = status ?? report.status;
    // full content
    report.projectDetails = projectDetails ?? report.projectDetails;
    report.clientDetails = clientDetails ?? report.clientDetails;
    report.items = items ?? report.items;
    report.searchResults = searchResults ?? report.searchResults;
    report.inputData = inputData ?? report.inputData;
    report.editableRates = editableRates ?? report.editableRates;
    report.rateSelection = rateSelection ?? report.rateSelection;
    report.grandTotalCost = typeof grandTotalCost === 'number' ? grandTotalCost : report.grandTotalCost;
    report.grandTotalInWords = grandTotalInWords ?? report.grandTotalInWords;
    report.updatedAt = Date.now();

    await report.save();
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a report
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const report = await Report.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;