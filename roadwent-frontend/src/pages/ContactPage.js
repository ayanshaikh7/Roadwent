import React from 'react';

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-6 py-12 md:py-20 text-gray-800">
        
        {/* Header Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get in touch with our team for support, questions, or to learn more about our 
            professional road construction estimation platform.
          </p>
        </section>

        {/* Contact Cards */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Email Card */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-6xl mb-6 text-center">📧</div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 text-center">Email Support</h3>
            <p className="text-gray-600 text-center mb-4">
              Send us your questions and we'll get back to you within 24 hours.
            </p>
            <div className="text-center">
              <a 
                href="mailto:support@roadwent.com" 
                className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                📧 Email Us
              </a>
            </div>
          </div>

          {/* Phone Card */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-6xl mb-6 text-center">📞</div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 text-center">Phone Support</h3>
            <p className="text-gray-600 text-center mb-4">
              Call us for immediate assistance with your projects.
            </p>
            <div className="text-center">
              <a 
                href="tel:+1234567890" 
                className="inline-block bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                📞 Call Now
              </a>
            </div>
          </div>

          {/* Live Chat Card */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 md:col-span-2 lg:col-span-1">
            <div className="text-6xl mb-6 text-center">💬</div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 text-center">Live Chat</h3>
            <p className="text-gray-600 text-center mb-4">
              Chat with our support team in real-time for instant help.
            </p>
            <div className="text-center">
              <button className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                💬 Start Chat
              </button>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
              <h3 className="text-xl font-bold mb-3 text-gray-900">Can I save multiple projects?</h3>
              <p className="text-gray-600">
                Yes! All your projects are automatically saved and can be accessed 
                through the Reports page for future editing and reference.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
              <h3 className="text-xl font-bold mb-3 text-gray-900">What file formats are supported?</h3>
              <p className="text-gray-600">
                We support Excel (.xlsx), PDF, and CSV exports. You can also import 
                Excel files containing SSR data for processing.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
              <h3 className="text-xl font-bold mb-3 text-gray-900">Is there a mobile version?</h3>
              <p className="text-gray-600">
                Our platform is fully responsive and works perfectly on mobile devices, 
                tablets, and desktop computers.
              </p>
              
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of construction professionals who trust our platform 
              for accurate project estimations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/project-details" 
                className="inline-block bg-white text-blue-600 font-bold py-4 px-8 rounded-full text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                🚀 Start New Project
              </a>
              <a 
                href="/report" 
                className="inline-block border-2 border-white text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105"
              >
                📊 View Reports
              </a>
            </div>
          </div>
        </section>

      </div>
  </div>
);
};

export default ContactPage;