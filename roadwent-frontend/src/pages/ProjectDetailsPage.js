import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProjectDetailsPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        projectName: '',
        projectManager: '',
        startDate: '',
        endDate: '',
        projectDescription: ''
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
        
        if (!formData.projectName.trim()) {
            newErrors.projectName = 'Project title is required';
        }
        
        // Validate dates if both are provided
        if (formData.startDate && formData.endDate) {
            const startDate = new Date(formData.startDate);
            const endDate = new Date(formData.endDate);
            if (startDate >= endDate) {
                newErrors.endDate = 'End date must be after start date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateForm()) {
            navigate('/client-details', { 
                state: { 
                    projectDetails: formData 
                } 
            });
        }
    };

    const handleBack = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="container mx-auto px-6 py-12 md:py-20 text-gray-800">
                
                {/* Header Section */}
                <section className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                        📋 Project Details
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Enter the basic information about your construction project. 
                        This information will be included in your cost estimate reports.
                    </p>
                </section>

                {/* Progress Indicator */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                            <span className="ml-2 text-blue-600 font-semibold">Project Details</span>
                        </div>
                        <div className="w-16 h-1 bg-blue-200"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center font-bold">2</div>
                            <span className="ml-2 text-gray-500">Client Details</span>
                        </div>
                        <div className="w-16 h-1 bg-gray-200"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center font-bold">3</div>
                            <span className="ml-2 text-gray-500">Cost Estimation</span>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <section className="max-w-4xl mx-auto">
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Project Title *
                                </label>
                                <input
                                    type="text"
                                    id="projectName"
                                    name="projectName"
                                    value={formData.projectName}
                                    onChange={handleInputChange}
                                    placeholder="Enter project title (e.g., Highway Construction Phase 1)"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        errors.projectName ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    required
                                />
                                {errors.projectName && (
                                    <p className="text-red-500 text-sm mt-1">{errors.projectName}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="projectManager" className="block text-sm font-medium text-gray-700 mb-2">
                                    Project Manager
                                </label>
                                <input
                                    type="text"
                                    id="projectManager"
                                    name="projectManager"
                                    value={formData.projectManager}
                                    onChange={handleInputChange}
                                    placeholder="Enter project manager name"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    id="startDate"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    id="endDate"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        errors.endDate ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.endDate && (
                                    <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                                )}
                            </div>
                        </div>
                        <div className="mt-6">
                            <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-2">
                                Project Description
                            </label>
                            <textarea
                                id="projectDescription"
                                name="projectDescription"
                                value={formData.projectDescription}
                                onChange={handleInputChange}
                                placeholder="Enter detailed project description..."
                                rows="4"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-4">
                            * Required field. This information will be included in your downloaded reports.
                        </p>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8">
                        <button 
                            onClick={handleBack}
                            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                            ← Back to Home
                        </button>
                        <button 
                            onClick={handleNext}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                            Next: Client Details →
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ProjectDetailsPage;