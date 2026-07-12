const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Estimator = require('./models/Estimator');
const Report = require('./models/Report');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected for test data'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Function to create test data
async function createTestData() {
  try {
    // Find a user to associate with test data
    const user = await User.findOne();
    
    if (!user) {
      console.log('No users found. Please create a user first.');
      process.exit(1);
    }
    
    console.log(`Found user: ${user.email}`);
    
    // Create test estimator data
    const estimatorData = {
      user: user._id,
      projectName: 'Test Highway Project',
      clientName: 'Test Client',
      roadType: 'Highway',
      roadLength: 10,
      roadWidth: 15,
      materials: [
        { name: 'Asphalt', quantity: 1500, unitCost: 120 },
        { name: 'Gravel', quantity: 800, unitCost: 50 }
      ],
      laborCost: 25000,
      equipmentCost: 15000,
      totalCost: 235000,
      estimatedTime: 90,
      notes: 'This is a test estimator entry',
      createdAt: new Date()
    };
    
    const estimator = await Estimator.create(estimatorData);
    console.log('Test estimator data created:', estimator._id);
    
    // Create test report data
    const reportData = {
      title: 'Test Project Report',
      description: 'This is a test report for the highway project',
      user: user._id,
      projectName: 'Test Highway Project',
      estimatedCost: 235000,
      estimatedTime: 90,
      status: 'draft',
      createdAt: new Date()
    };
    
    const report = await Report.create(reportData);
    console.log('Test report data created:', report._id);
    
    console.log('Test data creation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

// Run the function
createTestData();