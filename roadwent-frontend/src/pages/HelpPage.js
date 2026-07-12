import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Accordion Item Component for the FAQ Section
const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
      <button
        className="flex justify-between items-center w-full text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-xl font-bold text-gray-900">{question}</h3>
        <span className="text-2xl text-blue-500 transform transition-transform duration-300">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      {isOpen && (
        <p className="text-gray-600 mt-4 pt-4 border-t border-gray-200">
          {answer}
        </p>
      )}
    </div>
  );
};


const HelpPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-6 py-12 md:py-20 text-gray-800">
        
        {/* Header Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Help & Support Center
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to your questions, tutorials, and guides to get the most out of the SSR Estimator.
          </p>
        </section>

        {/* Topic Cards */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-6xl mb-6 text-center">🚀</div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 text-center">Getting Started</h3>
            <p className="text-gray-600 text-center">
              Learn how to set up your project and add your first estimate item in just a few clicks.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-6xl mb-6 text-center">🧮</div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 text-center">Using the Estimator</h3>
            <p className="text-gray-600 text-center">
              A detailed guide on adding/removing rows, editing rates, and using keyboard shortcuts.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 md:col-span-2 lg:col-span-1">
            <div className="text-6xl mb-6 text-center">📊</div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 text-center">Exporting Reports</h3>
            <p className="text-gray-600 text-center">
              Everything you need to know about downloading your final estimate as a professional Excel file.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-10">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-6 max-w-4xl mx-auto">
            <FaqItem
              question="How do I add an item to my estimate?"
              answer="You can add an item in two ways: either select a Chapter and then choose an item from the dropdown list, or type the SSR Item Number directly into the search box and press Enter or click 'Add'."
            />
            <FaqItem
              question="Can I change the rate for an item?"
              answer="Yes. Each item table has an editable 'Rate' field in the 'Item Totals' row. Simply click on the number and type in your new rate. The total cost will update automatically."
            />
            <FaqItem
              question="How can I add more input rows for an item?"
              answer="At the bottom of each item table, there is an '+ Add Row' button. Click it to add a new line for entering more dimensions or quantities."
            />
            <FaqItem
              question="Where does the SSR data come from?"
              answer="The application automatically loads data from the 'ssr_sheet.xlsx' file located in the 'public/data' folder of the project. To update the data, an administrator must replace this file."
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Still Can't Find an Answer?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Our support team is ready to help you with any questions or issues you might have.
            </p>
            <Link 
              to="/contact" 
              className="inline-block bg-white text-blue-600 font-bold py-4 px-8 rounded-full text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              💬 Contact Support
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
};

export default HelpPage;