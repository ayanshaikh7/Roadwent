import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ClientDetailsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const projectDetails = location.state?.projectDetails || {};
    
    const [formData, setFormData] = useState({
        clientName: '',
        companyName: '',
        address: '',
        phone: '',
        email: ''
    });
    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.clientName.trim()) {
            newErrors.clientName = 'Client name is required';
        }
        
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateForm()) {
            navigate('/estimator', { 
                state: { 
                    projectDetails,
                    clientDetails: formData
                } 
            });
        }
    };

    const handleBack = () => {
        navigate('/project-details', { 
            state: { 
                projectDetails 
            } 
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="container mx-auto px-6 py-12 md:py-20 text-gray-800">
                
                {/* Header Section */}
                <section className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                        👤 Client Details
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Enter the client information for this project. 
                        This will be included in your professional cost estimate reports.
                    </p>
                </section>

                {/* Progress Indicator */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">✓</div>
                            <span className="ml-2 text-green-600 font-semibold">Project Details</span>
                        </div>
                        <div className="w-16 h-1 bg-green-200"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                            <span className="ml-2 text-blue-600 font-semibold">Client Details</span>
                        </div>
                        <div className="w-16 h-1 bg-blue-200"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center font-bold">3</div>
                            <span className="ml-2 text-gray-500">Cost Estimation</span>
                        </div>
                    </div>
                </div>

                {/* Project Summary */}
                {projectDetails.projectName && (
                    <div className="max-w-4xl mx-auto mb-8">
                        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                            <h3 className="text-lg font-semibold text-blue-800 mb-2">Project Summary</h3>
                            <p className="text-blue-700">
                                <strong>Project:</strong> {projectDetails.projectName}
                                {projectDetails.projectManager && (
                                    <>
                                        {' | '}<strong>Manager:</strong> {projectDetails.projectManager}
                                    </>
                                )}
                                {projectDetails.startDate && (
                                    <>
                                        {' | '}<strong>Start:</strong> {new Date(projectDetails.startDate).toLocaleDateString()}
                                    </>
                                )}
                                {projectDetails.endDate && (
                                    <>
                                        {' | '}<strong>End:</strong> {new Date(projectDetails.endDate).toLocaleDateString()}
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                )}

                {/* Form Section */}
                <section className="max-w-4xl mx-auto">
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Client Name *
                                </label>
                                <input
                                    type="text"
                                    id="clientName"
                                    name="clientName"
                                    value={formData.clientName}
                                    onChange={handleInputChange}
                                    placeholder="Enter client's full name"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        errors.clientName ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    required
                                />
                                {errors.clientName && (
                                    <p className="text-red-500 text-sm mt-1">{errors.clientName}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    id="companyName"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    placeholder="Enter company name (if applicable)"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="Enter phone number"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        errors.phone ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    required
                                />
                                {errors.phone && (
                                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Enter email address"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        errors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    required
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                                )}
                            </div>
                        </div>
                        <div className="mt-6">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                                Address
                            </label>
                            <textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Enter complete address..."
                                rows="3"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-4">
                            * Required fields. This information will be included in your professional reports.
                        </p>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8">
                        <button 
                            onClick={handleBack}
                            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                            ← Back to Project Details
                        </button>
                        <button 
                            onClick={handleNext}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                            Next: Cost Estimation →
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ClientDetailsPage;