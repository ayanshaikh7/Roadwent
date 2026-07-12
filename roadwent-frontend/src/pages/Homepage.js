import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-6 py-12 md:py-20 text-gray-800">

        {/* --- Hero Section --- */}
        <section className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Text Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Professional Road Construction Estimation
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Accurate, professional estimates for road and infrastructure projects. 
              Smart calculations, real-time updates, and comprehensive reporting.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link 
                to="/project-details" 
                className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                🚧 Start New Project
              </Link>
              <Link 
                to="/report" 
                className="inline-block bg-white hover:bg-gray-50 text-gray-800 font-bold py-4 px-8 rounded-full text-lg border-2 border-gray-300 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                📋 Existing Projects
              </Link>
            </div>
          </div>
          
          {/* Image Content */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              {/* Main Construction Image */}
              <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="text-6xl mb-4">🛣️</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Road Construction</h3>
                  <p className="text-gray-600">Professional road building and maintenance projects</p>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full p-4 shadow-lg animate-bounce">
                <div className="text-3xl">🏗️</div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-4 shadow-lg animate-pulse">
                <div className="text-3xl">🚧</div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Features Section --- */}
        <section className="text-center mt-24 md:mt-32">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Built for Construction Professionals
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto mb-16">
            Our comprehensive estimation platform is designed specifically for road construction, 
            infrastructure projects, and civil engineering professionals.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-6xl mb-6">⚙️</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Real-Time Calculations</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Instantly see your total cost update as you add items, change quantities, or adjust rates. 
                Perfect for dynamic project planning.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-6xl mb-6">📏</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Smart Unit Handling</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Automatically provides correct input fields (Length, Breadth, Depth, Mass) 
                based on SSR item units. No guesswork required.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-6xl mb-6">📄</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Professional Reports</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Export detailed estimates in Excel, PDF, or CSV formats. 
                Perfect for client presentations and project documentation.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-6xl mb-6">💾</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Project Management</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Save and manage multiple projects. Access your previous estimates 
                and continue working on ongoing projects anytime.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-6xl mb-6">🎯</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">SSR Integration</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Seamlessly work with Standard Schedule of Rates (SSR) data. 
                Import and process SSR sheets with ease.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-6xl mb-6">📱</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Mobile Responsive</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Work from anywhere with our fully responsive design. 
                Perfect for site visits and on-the-go estimations.
              </p>
            </div>
          </div>
        </section>

        {/* --- Construction Types Section --- */}
        <section className="mt-24 md:mt-32">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 dark:text-white mb-6">
            Project Types We Support
          </h2>
          <p className="text-xl text-center text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-16">
            From highways to bridges, our platform handles all types of infrastructure projects
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Road Construction */}
            <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-6 text-white text-center hover:scale-105 transition-transform duration-300">
              <div className="text-5xl mb-4">🛣️</div>
              <h3 className="text-xl font-bold mb-2">Road Construction</h3>
              <p className="text-sm opacity-90">Highways, streets, and roadways</p>
            </div>
            
            {/* Bridge Construction */}
            <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl p-6 text-white text-center hover:scale-105 transition-transform duration-300">
              <div className="text-5xl mb-4">🌉</div>
              <h3 className="text-xl font-bold mb-2">Bridge Construction</h3>
              <p className="text-sm opacity-90">Bridges and overpasses</p>
            </div>
            
            {/* Infrastructure */}
            <div className="bg-gradient-to-br from-green-400 to-teal-500 rounded-2xl p-6 text-white text-center hover:scale-105 transition-transform duration-300">
              <div className="text-5xl mb-4">🏗️</div>
              <h3 className="text-xl font-bold mb-2">Infrastructure</h3>
              <p className="text-sm opacity-90">Public works and utilities</p>
            </div>
            
            {/* Maintenance */}
            <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl p-6 text-white text-center hover:scale-105 transition-transform duration-300">
              <div className="text-5xl mb-4">🔧</div>
              <h3 className="text-xl font-bold mb-2">Maintenance</h3>
              <p className="text-sm opacity-90">Repair and upkeep projects</p>
            </div>
          </div>
        </section>

        {/* --- CTA Section --- */}
        <section className="mt-24 md:mt-32 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Your Next Project?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of construction professionals who trust our platform 
              for accurate, professional project estimations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/estimator" 
                className="inline-block bg-white text-blue-600 font-bold py-4 px-8 rounded-full text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                🚀 Start New Project
              </Link>
              <Link 
                to="/report" 
                className="inline-block border-2 border-white text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105"
              >
                📊 View Reports
              </Link>
            </div>
          </div>
        </section>
      
      </div>
    </div>
  );
};

export default HomePage;