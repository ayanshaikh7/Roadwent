import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ProfessionalReportView from '../Components/ProfessionalReportView';
import { getAllReports, deleteReport as deleteReportApi } from '../services/reportService';

const ReportPage = () => {
  const [reports, setReports] = useState([]);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);
  const [showProfessionalView, setShowProfessionalView] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadReports = async () => {
      try {
        // Try backend first (user-scoped)
        const data = await getAllReports();
        setReports(Array.isArray(data) ? data : []);
      } catch (_) {
        // Fallback to localStorage if backend unavailable or unauthenticated
        try {
          const stored = localStorage.getItem('roadwent_reports');
          const parsed = stored ? JSON.parse(stored) : [];
          setReports(parsed);
        } catch (e) {
          setReports([]);
        }
      }
    };
    loadReports();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        closeAllDropdowns();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDelete = async (report) => {
    // If it's a backend report (has _id), call API first
    if (report && report._id) {
      try {
        await deleteReportApi(report._id);
        // Refresh from backend after delete
        const data = await getAllReports();
        setReports(Array.isArray(data) ? data : []);
        return;
      } catch (e) {
        // If API delete fails, fall back to removing from local if shape matches
      }
    }
    // Local fallback delete by id
    try {
      const id = report?.id;
      const filtered = reports.filter(r => (r.id ?? r._id) !== (id ?? report?._id));
      localStorage.setItem('roadwent_reports', JSON.stringify(filtered));
      setReports(filtered);
    } catch (e) {}
  };

  const handleEdit = (report) => {
    navigate('/estimator', { state: { report } });
  };

  const toggleDropdown = (id) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };


  const closeAllDropdowns = () => {
    setOpenDropdowns({});
  };

  const viewProfessionalReport = (report) => {
    setSelectedReport(report);
    setShowProfessionalView(true);
  };

  const closeProfessionalView = () => {
    setShowProfessionalView(false);
    setSelectedReport(null);
  };

  const printProfessionalReport = () => {
    const container = document.getElementById('professional-report-container');
    if (!container) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this website');
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Professional Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          ${container.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Helper function to convert number to words
  const numberToWords = (num) => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    const convertLessThanThousand = (n) => {
      if (n === 0) return '';
      if (n < 20) return units[n] + ' ';
      const digit = n % 10;
      if (n < 100) return tens[Math.floor(n / 10)] + (digit ? '-' + units[digit] : '') + ' ';
      return units[Math.floor(n / 100)] + ' Hundred ' + convertLessThanThousand(n % 100);
    };
    
    let words = '';
    let chunk = 0;
    const billion = Math.floor(num / 1000000000);
    num -= billion * 1000000000;
    
    const million = Math.floor(num / 1000000);
    num -= million * 1000000;
    
    const thousand = Math.floor(num / 1000);
    num -= thousand * 1000;
    
    if (billion) {
      words += convertLessThanThousand(billion) + 'Billion ';
    }
    
    if (million) {
      words += convertLessThanThousand(million) + 'Million ';
    }
    
    if (thousand) {
      words += convertLessThanThousand(thousand) + 'Thousand ';
    }
    
    words += convertLessThanThousand(num);
    
    return words.trim();
  };

  // Unit information
  const getUnitInfo = (unit) => {
    const units = {
      'm': 'meter',
      'm2': 'square meter',
      'm3': 'cubic meter',
      'km': 'kilometer',
      'cm': 'centimeter',
      'mm': 'millimeter',
      'ft': 'foot',
      'in': 'inch',
      'yd': 'yard',
      'sqft': 'square foot',
      'sqm': 'square meter',
      'ha': 'hectare',
      'acre': 'acre',
      'l': 'liter',
      'gal': 'gallon',
      'kg': 'kilogram',
      'g': 'gram',
      'lb': 'pound',
      'ton': 'ton',
      'pcs': 'pieces',
      'set': 'set',
      'lot': 'lot',
      'unit': 'unit',
      'day': 'day',
      'hr': 'hour',
      'min': 'minute',
      'sec': 'second',
      'job': 'job',
      'trip': 'trip',
      'each': 'each',
    };
    
    return units[unit] || unit;
  };

  // Download as Excel
  const downloadExcel = (report) => {
    try {
      const { projectDetails, clientDetails, items } = report;
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      
      // Project and client details
      const detailsData = [
        ['Project Name', projectDetails?.projectName || 'N/A'],
        ['Project Location', projectDetails?.projectLocation || 'N/A'],
        ['Project Duration', projectDetails?.projectDuration || 'N/A'],
        ['Client Name', clientDetails?.clientName || 'N/A'],
        ['Client Contact', clientDetails?.clientContact || 'N/A'],
        ['Client Email', clientDetails?.clientEmail || 'N/A'],
        ['Date', new Date(report.createdAt).toLocaleDateString()],
        ['', ''],
        ['COST ESTIMATION REPORT', ''],
      ];
      
      // Items data
      const itemsHeader = ['Description', 'Quantity', 'Unit', 'Rate', 'Amount'];
      const itemsData = items.map(item => [
        item.description,
        item.quantity,
        item.unit,
        item.rate,
        item.quantity * item.rate
      ]);
      
      // Calculate total
      const total = items ? items.reduce((sum, item) => sum + (item.quantity * item.rate), 0) : 0;
      itemsData.push(['', '', '', 'TOTAL', total]);
      
      // Combine all data
      const allData = [...detailsData, itemsHeader, ...itemsData];
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(allData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Cost Estimation');
      
      // Generate Excel file
      XLSX.writeFile(wb, `${projectDetails?.projectName || 'Cost_Estimation'}.xlsx`);
      
      closeAllDropdowns();
    } catch (e) {
      console.error('Error generating Excel:', e);
    }
  };

  // Download as PDF
  const downloadPDF = (report) => {
    try {
      const { projectDetails, clientDetails, items } = report;
      
      // Create PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Set font
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      
      // Title
      doc.text('COST ESTIMATION REPORT', pageWidth / 2, 20, { align: 'center' });
      
      // Project details
      doc.setFontSize(12);
      doc.text('Project Details:', 14, 35);
      doc.setFont('helvetica', 'normal');
      doc.text(`Project Name: ${projectDetails?.projectName || 'N/A'}`, 14, 42);
      doc.text(`Location: ${projectDetails?.projectLocation || 'N/A'}`, 14, 49);
      doc.text(`Duration: ${projectDetails?.projectDuration || 'N/A'}`, 14, 56);
      
      // Client details
      doc.setFont('helvetica', 'bold');
      doc.text('Client Details:', pageWidth - 90, 35);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${clientDetails?.clientName || 'N/A'}`, pageWidth - 90, 42);
      doc.text(`Contact: ${clientDetails?.clientContact || 'N/A'}`, pageWidth - 90, 49);
      doc.text(`Email: ${clientDetails?.clientEmail || 'N/A'}`, pageWidth - 90, 56);
      
      // Date
      doc.text(`Date: ${new Date(report.createdAt).toLocaleDateString()}`, pageWidth - 90, 63);
      
      // Table header
      const tableHeaders = [['Description', 'Quantity', 'Unit', 'Rate', 'Amount']];
      
      // Table data
      const tableData = items.map(item => [
        item.description,
        item.quantity.toString(),
        item.unit,
        item.rate.toString(),
        (item.quantity * item.rate).toFixed(2)
      ]);
      
      // Create table
      doc.autoTable({
        startY: 70,
        head: tableHeaders,
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [66, 133, 244], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 20, halign: 'right' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 40, halign: 'right' }
        }
      });
      
      // Calculate total
      const total = items ? items.reduce((sum, item) => sum + (item.quantity * item.rate), 0) : 0;
      
      // Add total
      const finalY = doc.lastAutoTable.finalY;
      doc.setFont('helvetica', 'bold');
      doc.text('Total:', pageWidth - 50, finalY + 10);
      doc.text(`${total.toFixed(2)}`, pageWidth - 14, finalY + 10, { align: 'right' });
      
      // Add total in words
      const yPosition = finalY + 20;
      const grandTotalInWords = numberToWords(Math.round(total)) + ' Only';
      doc.text('Amount in words:', 14, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(`(${grandTotalInWords})`, pageWidth / 2, yPosition, { align: 'center' });
      
      // Save the PDF
      doc.save(`${projectDetails?.projectName || 'Cost_Estimation'}.pdf`);
      closeAllDropdowns();
    } catch (e) {
      console.error('Error generating PDF:', e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {showProfessionalView && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto" id="professional-report-container">
            <div className="p-4 bg-gray-100 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-xl font-bold">Professional Report</h2>
              <div className="flex space-x-2">
                <button
                  onClick={printProfessionalReport}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  🖨️ Print
                </button>
                <button
                  onClick={closeProfessionalView}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                >
                  ✖️ Close
                </button>
              </div>
            </div>
            <ProfessionalReportView report={selectedReport} />
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-6 py-12 md:py-20 text-gray-800">
        
        {/* Header Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            📊 Project Reports
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Manage and access all your construction project estimates. 
            View, edit, or delete your saved reports.
          </p>
        </section>

        {/* Reports Section */}
        <section>
          {reports.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">📝</div>
              <h2 className="text-2xl font-bold mb-4">No Reports Yet</h2>
              <p className="text-gray-600 mb-8">
                You haven't created any project reports yet. Start by creating your first project estimate.
              </p>
              <a 
                href="/project-details" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300"
              >
                Start New Project
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Project Title</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Client</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Duration</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Created</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Format</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Total Cost</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reports.map((report) => {
                      const total = (
                        typeof report.grandTotalCost === 'number' && !Number.isNaN(report.grandTotalCost)
                      ) ? report.grandTotalCost
                        : (report.estimatedCost != null && !Number.isNaN(Number(report.estimatedCost))
                          ? Number(report.estimatedCost)
                          : (Array.isArray(report.items)
                            ? report.items.reduce((sum, item) => {
                                const q = Number(item?.quantity) || 0;
                                const r = Number(item?.rate) || 0;
                                return sum + (q * r);
                              }, 0)
                            : 0)
                        );
                      
                      return (
                        <tr key={(report.id ?? report._id) || Math.random()} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{report.projectDetails?.projectName || report.projectName || report.title || 'Untitled Project'}</div>
                            <div className="text-sm text-gray-500">{report.projectDetails?.projectLocation || ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{report.clientDetails?.clientName || 'No client'}</div>
                            <div className="text-sm text-gray-500">{report.clientDetails?.clientContact || 'No contact'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {report.projectDetails?.projectDuration || 'Not specified'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              PDF/Excel
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{Number(total || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium relative dropdown-container">
                            <button 
                              onClick={() => toggleDropdown(report.id ?? report._id)}
                              className="text-blue-600 hover:text-blue-900 focus:outline-none"
                            >
                              ⋮
                            </button>
                            <div 
                              className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 ${openDropdowns[report.id ?? report._id] ? 'block' : 'hidden'}`}
                            >
                              <div className="py-1" role="menu" aria-orientation="vertical">
                                <button
                                  onClick={() => viewProfessionalReport(report)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  👁️ View Professional Report
                                </button>
                                <button
                                  onClick={() => handleEdit(report)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => downloadPDF(report)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  📄 Download PDF
                                </button>
                                <button
                                  onClick={() => downloadExcel(report)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  📊 Download Excel
                                </button>
                                <button
                                  onClick={() => handleDelete(report)}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* CTA Section */}
        {reports.length > 0 && (
          <section className="mt-16 text-center">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready for Your Next Project?
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Create professional estimates for your construction projects with our advanced platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/project-details" 
                  className="inline-block bg-white text-blue-600 font-bold py-4 px-8 rounded-full text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  🚀 Start New Project
                </a>
                <a 
                  href="/" 
                  className="inline-block border-2 border-white text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105"
                >
                  🏠 Back to Home
                </a>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ReportPage;