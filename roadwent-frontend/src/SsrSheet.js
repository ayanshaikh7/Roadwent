import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'tailwindcss/tailwind.css';
import { saveEstimator } from './services/estimatorService';

// --- HELPER FUNCTIONS (Unchanged) ---
const numberToWords = (num) => {
    if (num === 0) return 'Zero Rupees Only';
    const numString = num.toFixed(2);
    const [rupees, paise] = numString.split('.');
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const convert = (n) => {
        let s = '';
        n = parseInt(n, 10);
        if (n > 99) {
            s += a[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
        }
        if (n > 19) {
            s += b[Math.floor(n / 10)] + ' ' + a[n % 10];
        } else if (n > 0) {
            s += a[n];
        }
        return s.trim();
    };
    const inWords = (n) => {
        let s = String(n).replace(/[\, ]/g, '');
        if (s !== parseFloat(s).toString()) return 'not a number';
        if (s > 999999999999999) return 'too big'; 
        let parts = [];
        let number = parseInt(s, 10);
        if (number === 0) {
            parts.push("Zero");
        } else {
            let crore = Math.floor(number / 10000000);
            number %= 10000000;
            if (crore > 0) parts.push(convert(crore) + ' Crore');
            let lakh = Math.floor(number / 100000);
            number %= 100000;
            if (lakh > 0) parts.push(convert(lakh) + ' Lakh');
            let thousand = Math.floor(number / 1000);
            number %= 1000;
            if (thousand > 0) parts.push(convert(thousand) + ' Thousand');
            if (number > 0) parts.push(convert(number));
        }
        return parts.join(' ').trim();
    };
    const finalRupees = inWords(parseInt(rupees, 10));
    let finalPaise = '';
    if (paise && parseInt(paise, 10) > 0) {
        finalPaise = ` and ${inWords(parseInt(paise, 10))} Paisa`;
    }
    return `${finalRupees} Rupees${finalPaise} Only`.replace(/\s+/g, ' ').trim();
};
const s2ab = (s) => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
};

// --- COMPONENT 1: Navbar (Unchanged) ---
const Navbar = () => {
    return (
        <nav className="bg-white text-gray-800 p-4 shadow-lg sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-2xl font-bold tracking-wider text-blue-600 flex items-center space-x-2">
                    <img src="/roadwent.ico.png" alt="RoadWent Logo" className="w-8 h-8" />
                    <span>SSR Estimator</span>
                </div>
                <div className="hidden md:flex items-center space-x-6 font-medium">
                    <a href="#" className="hover:text-blue-600 transition duration-300">Home</a>
                    <a href="#" className="bg-blue-100 text-blue-700 px-3 py-2 rounded-md">Estimator</a>
                    <a href="#" className="hover:text-blue-600 transition duration-300">Report</a>
                    <a href="#" className="hover:text-blue-600 transition duration-300">Help</a>
                    <a href="#" className="hover:text-blue-600 transition duration-300">Contact</a>
                </div>
                <div>
                    <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105">Login</button>
                </div>
            </div>
        </nav>
    );
};


// --- COMPONENT 2: Main Application Logic ---
const SsrSheet = () => {
    const [data, setData] = useState([]);
    const [groupedData, setGroupedData] = useState({});
    const [searchResults, setSearchResults] = useState([]);
    const [inputData, setInputData] = useState({});
    const [editableRates, setEditableRates] = useState({});
    const [rateSelection, setRateSelection] = useState({}); // Track if user selected original or custom rate
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedItemNo, setSelectedItemNo] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isProcessing, setIsProcessing] = useState(false);
    const [grandTotalCost, setGrandTotalCost] = useState(0);
    const [grandTotalInWords, setGrandTotalInWords] = useState('');
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/data/ssr_sheet.xlsx');
                if (!response.ok) {
                    throw new Error('Could not fetch the SSR Excel file. Make sure it is in the public/data/ directory.');
                }
                const arrayBuffer = await response.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                const grouped = jsonData.reduce((acc, item) => {
                    const chapter = item['Chapter'];
                    if (chapter) {
                        if (!acc[chapter]) acc[chapter] = [];
                        acc[chapter].push(item);
                    }
                    return acc;
                }, {});
                setData(jsonData);
                setGroupedData(grouped);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const newGrandTotalCost = searchResults.reduce((sum, item) => sum + calculateTotalCostForItem(item), 0);
        setGrandTotalCost(newGrandTotalCost);
        setGrandTotalInWords(numberToWords(newGrandTotalCost));
    }, [searchResults, inputData, editableRates]);

    const getUnitInfo = (unit) => {
        const lowerUnit = unit ? unit.trim().toLowerCase() : '';
        if (['cubic', 'cum'].some(kw => lowerUnit.includes(kw))) return { type: 'dimensional', params: ['Length', 'Breadth', 'Depth'] };
        if (['square', 'sqm', 'acre'].some(kw => lowerUnit.includes(kw))) return { type: 'dimensional', params: ['Length', 'Breadth'] };
        if (['kilometre', 'kilometer', 'running', 'metre', 'meter', 'span'].some(kw => lowerUnit.includes(kw))) {
            if (!lowerUnit.includes('square') && !lowerUnit.includes('cubic')) {
                return { type: 'dimensional', params: ['Length'] };
            }
        }
        if (['tonne', 'kilogram', 'kg'].some(kw => lowerUnit.includes(kw))) return { type: 'single', param: 'Mass' };
        if (['litre'].some(kw => lowerUnit.includes(kw))) return { type: 'single', param: 'Volume' };
        if (['number', 'no', 'pouch', 'bearing'].some(kw => lowerUnit.includes(kw))) return { type: 'single', param: 'Count' };
        if (['day', 'test', 'shift', 'hour'].some(kw => lowerUnit.includes(kw))) return { type: 'single', param: 'Time/Frequency' };
        if (['site', 'report'].some(kw => lowerUnit.includes(kw))) return { type: 'single', param: 'Reference' };
        return { type: 'single', param: 'Quantity' };
    };
    
    const calculateQuantity = (row, unitInfo) => {
        const length = parseFloat(row.length) || 0;
        const breadth = parseFloat(row.breadth) || 0;
        const depth = parseFloat(row.depth) || 0;
        if (unitInfo.type === 'dimensional') {
            if (unitInfo.params.length === 3) return length * breadth * depth;
            if (unitInfo.params.length === 2) return length * breadth;
            if (unitInfo.params.length === 1) return length;
        }
        if (unitInfo.type === 'single') {
            return parseFloat(row.quantity) || 0;
        }
        return 0;
    };
    
    const calculateTotalCostForItem = (item) => {
        const itemKey = item['SSR Item No.'];
        const itemInputRows = inputData[itemKey] || [];
        const unitInfo = getUnitInfo(item['Unit']);
        const totalQuantity = itemInputRows.reduce((sum, row) => sum + calculateQuantity(row, unitInfo), 0);
        const rate = parseFloat(editableRates[itemKey] ?? item['Completed Rate for 2022-23 excluding GST In Rs.']) || 0;
        return totalQuantity * rate;
    };

    const addItemToSheet = (itemToAdd) => {
        if (!itemToAdd) return;
        const itemKey = String(itemToAdd['SSR Item No.']).trim();
        if (searchResults.some(item => String(item['SSR Item No.']).trim() === itemKey)) {
            setMessage({ text: 'This item has already been added.', type: 'error' });
            return;
        }
        const unitInfo = getUnitInfo(itemToAdd['Unit']);
        const initialInput = unitInfo.type === 'single'
            ? Array.from({ length: 1 }, () => ({ quantity: '', comment: '' })) 
            : Array.from({ length: 1 }, () => ({ length: '', breadth: '', depth: '', comment: '' }));
        setSearchResults(prevResults => [...prevResults, itemToAdd]);
        setInputData(prevData => ({ ...prevData, [itemKey]: initialInput }));
    };
    
    const handleAddRow = (itemKey) => {
        const unitInfo = getUnitInfo(searchResults.find(item => item['SSR Item No.'] === itemKey)?.['Unit']);
        const newRow = unitInfo.type === 'single' ? { quantity: '', comment: '' } : { length: '', breadth: '', depth: '', comment: '' };
        setInputData(prevData => ({ ...prevData, [itemKey]: [...prevData[itemKey], newRow] }));
    };

    const handleRemoveRow = (itemKey, rowIndex) => {
        if (inputData[itemKey].length <= 1) {
            setMessage({ text: "You cannot remove the last row.", type: 'error' });
            setTimeout(()=> setMessage({ text: '', type: ''}), 3000);
            return;
        }
        setInputData(prevData => ({ ...prevData, [itemKey]: prevData[itemKey].filter((_, index) => index !== rowIndex) }));
    };

    const handleAddItemByNumber = () => {
        const foundItem = data.find(item => String(item['SSR Item No.']).trim() === searchQuery.trim());
        if (foundItem) { addItemToSheet(foundItem); setSearchQuery(''); } 
        else { setMessage({ text: 'SSR Item No not found.', type: 'error' }); }
    };
    const handleAddItemByDropdown = () => {
        const itemToAdd = groupedData[selectedGroup]?.find(item => String(item['SSR Item No.']).trim() === selectedItemNo);
        if (itemToAdd) { addItemToSheet(itemToAdd); setSelectedGroup(''); setSelectedItemNo(''); }
    };
    const handleInputChange = (e, itemKey, index, paramName) => {
        const { value } = e.target;
        const newItemsData = { ...inputData };
        const newRows = [...newItemsData[itemKey]];
        newRows[index][paramName] = value;
        newItemsData[itemKey] = newRows;
        setInputData(newItemsData);
    };
    const handleRateChange = (e, itemKey) => {
        const { value } = e.target;
        setEditableRates(prevRates => ({ ...prevRates, [itemKey]: value }));
        // Mark as user-entered rate when user modifies it
        setRateSelection(prevSelection => ({ ...prevSelection, [itemKey]: 'user' }));
    };

    const handleRateSelectionChange = (e, itemKey) => {
        const { value } = e.target;
        setRateSelection(prevSelection => ({ ...prevSelection, [itemKey]: value }));
        
        if (value === 'original') {
            // Reset to original rate
            setEditableRates(prevRates => {
                const newRates = { ...prevRates };
                delete newRates[itemKey];
                return newRates;
            });
        }
    };
    const handleReset = () => {
        setSearchResults([]); setInputData({}); setEditableRates({}); setRateSelection({}); setSearchQuery(''); setSelectedGroup(''); setSelectedItemNo('');
        setMessage({ text: 'Sheet has been reset.', type: 'success' });
    };
    
    const handleKeyDown = (event, itemKey, rowIndex, currentParam) => {
        const { key } = event;
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;

        event.preventDefault();

        const unitInfo = getUnitInfo(searchResults.find(i => i['SSR Item No.'] === itemKey)?.Unit);
        
        let paramOrder = [];
        if (unitInfo.type === 'dimensional') {
            paramOrder = ['comment', ...unitInfo.params.map(p => p.toLowerCase())];
        } else {
            paramOrder = ['comment', 'quantity'];
        }

        let nextRow = rowIndex;
        let nextParam = currentParam;
        const currentParamIndex = paramOrder.indexOf(currentParam);

        if (key === 'ArrowUp') nextRow = rowIndex - 1;
        if (key === 'ArrowDown') nextRow = rowIndex + 1;
        if (key === 'ArrowLeft' && currentParamIndex > 0) nextParam = paramOrder[currentParamIndex - 1];
        if (key === 'ArrowRight' && currentParamIndex < paramOrder.length - 1) nextParam = paramOrder[currentParamIndex + 1];

        const targetId = `input-${itemKey}-${nextRow}-${nextParam}`;
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            targetElement.focus();
            targetElement.select();
        }
    };

    const handleDownload = () => {
        setIsProcessing(true);
        setTimeout(() => {
            const allData = [['Sr No', 'SSR Item No', 'Description of Item', 'No', 'Remarks', 'Length', 'Breadth', 'Depth/Height', 'Quantity', 'Unit', 'Rate', 'Rate Type']];
            const rateHighlightCells = []; // Track cells that need yellow highlighting
            
            searchResults.forEach((item, itemIndex) => {
                const itemKey = item['SSR Item No.'];
                const itemInputRows = inputData[itemKey] || [];
                const unitInfo = getUnitInfo(item['Unit']);
                const rate = parseFloat(editableRates[itemKey] ?? item['Completed Rate for 2022-23 excluding GST In Rs.']) || 0;
                const rateType = rateSelection[itemKey] || 'original';
                const isUserRate = rateSelection[itemKey] === 'user';
                
                // Header row for this item
                const headerRowIndex = allData.length;
                allData.push([item['Sr. No.'], itemKey, item['Description of the item'], '', '', '', '', '', '', item['Unit'], rate, rateType]);
                
                // Track rate cell for highlighting if it's a user rate
                if (isUserRate) {
                    rateHighlightCells.push({ row: headerRowIndex, col: 10 }); // Rate column
                }
                
                itemInputRows.forEach((row, index) => {
                    const rowData = ['', '', '', index + 1, row.comment || '', row.length || '', row.breadth || '', row.depth || '', calculateQuantity(row, unitInfo).toFixed(2), '', ''];
                    allData.push(rowData);
                });
                const totalQuantity = itemInputRows.reduce((sum, row) => sum + calculateQuantity(row, unitInfo), 0);
                const totalCost = totalQuantity * rate;
                allData.push(['', '', '', '', '', '', '', 'Total Quantity:', totalQuantity.toFixed(2), '', '']);
                allData.push(['', '', '', '', '', '', '', 'Total Cost:', totalCost.toFixed(2), '', '']);
                allData.push([]);
            });
            allData.push(['', '', '', '', '', '', '', '', 'Grand Total Cost:', grandTotalCost.toFixed(2)]);
            
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(allData);
            
            // Apply yellow highlighting to user-modified rate cells
            rateHighlightCells.forEach(cell => {
                const cellRef = XLSX.utils.encode_cell({ r: cell.row, c: cell.col });
                if (!worksheet['!rows']) worksheet['!rows'] = [];
                if (!worksheet['!rows'][cell.row]) worksheet['!rows'][cell.row] = {};
                if (!worksheet['!rows'][cell.row].s) worksheet['!rows'][cell.row].s = {};
                worksheet['!rows'][cell.row].s.fill = { fgColor: { rgb: 'FFFF00' } }; // Yellow background
            });
            
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Cost_Estimation');
            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
            const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = 'Cost_Estimation.xlsx';
            link.click();
            setIsProcessing(false);
        }, 100);
    };

    const handleSaveToDatabase = async () => {
        setIsProcessing(true);
        try {
            // Prepare data for saving
            const estimatorData = {
                projectName: "SSR Estimation Project",
                items: searchResults.map(item => {
                    const itemKey = item['SSR Item No.'];
                    const unitInfo = getUnitInfo(item['Unit']);
                    const rate = parseFloat(editableRates[itemKey] ?? item['Completed Rate for 2022-23 excluding GST In Rs.']) || 0;
                    const totalQuantity = calculateTotalQuantity(itemKey, unitInfo);
                    const totalCost = totalQuantity * rate;
                    
                    return {
                        ssrItemNo: itemKey,
                        description: item['Description of the item'],
                        unit: item['Unit'],
                        rate: rate,
                        quantity: totalQuantity,
                        totalCost: totalCost,
                        measurements: inputData[itemKey] || []
                    };
                }),
                totalCost: grandTotalCost
            };
            
            // Save to database
            const savedData = await saveEstimator(estimatorData);
            setMessage({ 
                text: `Estimator data saved successfully with ID: ${savedData._id}`, 
                type: 'success' 
            });
        } catch (error) {
            setMessage({ 
                text: `Error saving to database: ${error.message}`, 
                type: 'error' 
            });
            console.error('Error saving estimator data:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadPDF = () => {
        setIsProcessing(true);
        setTimeout(() => {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let yPosition = 20;
            
            // Main title
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('SSR ESTIMATE DETAILS', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 20;
            
            // Table headers
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            const headers = ['Sr No', 'SSR Item No', 'Description', 'No', 'Remarks', 'Length', 'Breadth', 'Depth', 'Quantity', 'Unit', 'Rate', 'Rate Type'];
            const colWidths = [10, 15, 40, 8, 20, 12, 12, 12, 12, 10, 12, 15];
            let xPos = 10;
            
            headers.forEach((header, index) => {
                doc.text(header, xPos, yPosition);
                xPos += colWidths[index];
            });
            yPosition += 10;
            
            // Draw line under headers
            doc.line(10, yPosition - 2, pageWidth - 10, yPosition - 2);
            yPosition += 10;
            
            // Items data
            doc.setFontSize(7);
            doc.setFont(undefined, 'normal');
            
            searchResults.forEach((item, itemIndex) => {
                const itemKey = item['SSR Item No.'];
                const itemInputRows = inputData[itemKey] || [];
                const unitInfo = getUnitInfo(item['Unit']);
                const rate = parseFloat(editableRates[itemKey] ?? item['Completed Rate for 2022-23 excluding GST In Rs.']) || 0;
                const rateType = rateSelection[itemKey] || 'original';
                const isUserRate = rateSelection[itemKey] === 'user';
                
                // Check if we need a new page
                if (yPosition > pageHeight - 40) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                // Header row for this item
                doc.text(item['Sr. No.'], 10, yPosition);
                doc.text(itemKey, 20, yPosition);
                
                // Split long descriptions
                const description = item['Description of the item'];
                const maxWidth = 40;
                const splitText = doc.splitTextToSize(description, maxWidth);
                doc.text(splitText, 35, yPosition);
                
                const lineHeight = 3;
                const descriptionHeight = splitText.length * lineHeight;
                
                doc.text('', 75, yPosition); // No
                doc.text('', 83, yPosition); // Remarks
                doc.text('', 103, yPosition); // Length
                doc.text('', 115, yPosition); // Breadth
                doc.text('', 127, yPosition); // Depth
                doc.text('', 139, yPosition); // Quantity
                doc.text(item['Unit'], 151, yPosition); // Unit
                
                // Add yellow background for user-modified rates
                if (isUserRate) {
                    const rateColWidth = 12;
                    const rateColHeight = Math.max(descriptionHeight, 8);
                    doc.setFillColor(255, 255, 0); // Yellow background
                    doc.rect(161, yPosition - 2, rateColWidth, rateColHeight, 'F');
                }
                
                doc.text(rate.toFixed(2), 161, yPosition); // Rate
                doc.text(rateType, 173, yPosition); // Rate Type
                
                yPosition += Math.max(descriptionHeight, 8);
                
                // Individual rows for this item
                itemInputRows.forEach((row, index) => {
                    if (yPosition > pageHeight - 40) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    
                    doc.text('', 10, yPosition); // Sr No
                    doc.text('', 20, yPosition); // SSR Item No
                    doc.text('', 35, yPosition); // Description
                    doc.text((index + 1).toString(), 75, yPosition); // No
                    doc.text(row.comment || '', 83, yPosition); // Remarks
                    doc.text(row.length || '', 103, yPosition); // Length
                    doc.text(row.breadth || '', 115, yPosition); // Breadth
                    doc.text(row.depth || '', 127, yPosition); // Depth
                    doc.text(calculateQuantity(row, unitInfo).toFixed(2), 139, yPosition); // Quantity
                    doc.text('', 151, yPosition); // Unit
                    doc.text('', 161, yPosition); // Rate
                    doc.text('', 173, yPosition); // Rate Type
                    
                    yPosition += 6;
                });
                
                // Total rows
                const totalQuantity = itemInputRows.reduce((sum, row) => sum + calculateQuantity(row, unitInfo), 0);
                const totalCost = totalQuantity * rate;
                
                if (yPosition > pageHeight - 40) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                doc.text('', 10, yPosition);
                doc.text('', 20, yPosition);
                doc.text('Total Quantity:', 35, yPosition);
                doc.text('', 75, yPosition);
                doc.text('', 83, yPosition);
                doc.text('', 103, yPosition);
                doc.text('', 115, yPosition);
                doc.text('', 127, yPosition);
                doc.text(totalQuantity.toFixed(2), 139, yPosition);
                doc.text('', 151, yPosition);
                doc.text('', 161, yPosition);
                doc.text('', 173, yPosition);
                yPosition += 6;
                
                if (yPosition > pageHeight - 40) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                doc.text('', 10, yPosition);
                doc.text('', 20, yPosition);
                doc.text('Total Cost:', 35, yPosition);
                doc.text('', 75, yPosition);
                doc.text('', 83, yPosition);
                doc.text('', 103, yPosition);
                doc.text('', 115, yPosition);
                doc.text('', 127, yPosition);
                doc.text('', 139, yPosition);
                doc.text('', 151, yPosition);
                doc.text('', 161, yPosition);
                doc.text('', 173, yPosition);
                doc.text(totalCost.toFixed(2), 188, yPosition);
                yPosition += 10;
            });
            
            // Grand total
            if (yPosition > pageHeight - 50) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('Grand Total Cost:', 35, yPosition);
            doc.text(grandTotalCost.toFixed(2), 188, yPosition);
            yPosition += 15;
            
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.text(`(${grandTotalInWords})`, pageWidth / 2, yPosition, { align: 'center' });
            
            // Save the PDF
            doc.save('SSR_Estimate_Details.pdf');
            setIsProcessing(false);
        }, 100);
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen font-bold text-xl">Loading SSR Data...</div>;
    if (error) return <div className="flex flex-col justify-center items-center h-screen text-red-600 font-bold text-xl"><p>Error: {error}</p><p className="text-sm text-gray-600 mt-2">Please ensure `ssr_sheet.xlsx` is in the `public/data` folder.</p></div>;

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <Navbar />
            <main className="container p-6 mx-auto max-w-7xl">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Estimate Details</h1>
                    <div className="flex items-center space-x-4">
                        {searchResults.length > 0 && (<>
                            <button onClick={handleReset} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full shadow-lg transition duration-300">Reset All</button>
                            <button onClick={handleSaveToDatabase} disabled={isProcessing} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-full shadow-lg transition duration-300">{isProcessing ? 'Saving...' : 'Save to Database'}</button>
                            <button onClick={handleDownload} disabled={isProcessing} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full shadow-lg transition duration-300">{isProcessing ? 'Processing...' : 'Download Excel'}</button>
                            <button onClick={handleDownloadPDF} disabled={isProcessing} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full shadow-lg transition duration-300">{isProcessing ? 'Processing...' : 'Download PDF'}</button>
                        </>)}
                    </div>
                </div>
                
                {message.text && <div className={`p-4 mb-4 text-sm rounded-lg ${message.type === 'error' ? 'text-red-800 bg-red-50' : 'text-green-800 bg-green-50'}`}>{message.text}</div>}
                
                {searchResults.map((item, index) => {
                    const itemKey = item['SSR Item No.'];
                    const unitInfo = getUnitInfo(item['Unit']);
                    const totalQuantity = calculateTotalCostForItem(item) / (parseFloat(editableRates[itemKey] ?? item['Completed Rate for 2022-23 excluding GST In Rs.']) || 1);

                    return (
                        <div key={itemKey} className="p-4 my-4 bg-white rounded-lg shadow-md overflow-x-auto">
                            {/* --- **MODIFIED** Item title now includes a serial number --- */}
                            <h3 className="text-lg font-semibold mb-2">
                                ({index + 1}) {itemKey}: {item['Description of the item']}
                            </h3>
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-2 py-2">No</th>
                                        <th className="px-4 py-2">Remarks</th>
                                        {unitInfo.type === 'dimensional' ? (<>
                                            <th className="px-4 py-2 text-center">{unitInfo.params[0]}</th>
                                            {unitInfo.params.length > 1 && <th className="px-1 py-2 font-normal text-gray-400">x</th>}
                                            <th className="px-4 py-2 text-center">{unitInfo.params[1]}</th>
                                            {unitInfo.params.length > 2 && <th className="px-1 py-2 font-normal text-gray-400">x</th>}
                                            <th className="px-4 py-2 text-center">{unitInfo.params[2]}</th>
                                        </>) : (<th colSpan="5" className="px-4 py-2 text-center">{unitInfo.param}</th>)}
                                        <th className="px-4 py-2">Quantity</th><th className="px-4 py-2">Unit</th><th className="px-4 py-2">Rate</th><th className="px-4 py-2">Rate Type</th><th className="px-4 py-2">Total Cost</th><th className="px-2 py-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(inputData[itemKey] || []).map((row, rowIndex) => (
                                        <tr key={rowIndex} className="bg-white border-b text-center">
                                            <td className="py-2">{rowIndex + 1}</td>
                                            <td><input type="text" id={`input-${itemKey}-${rowIndex}-comment`} onKeyDown={(e) => handleKeyDown(e, itemKey, rowIndex, 'comment')} value={row.comment} onChange={(e) => handleInputChange(e, itemKey, rowIndex, 'comment')} placeholder="Add a note..." className="w-48 p-1 border rounded text-center" /></td>
                                            {unitInfo.type === 'dimensional' ? (<>
                                                <td><input type="number" id={`input-${itemKey}-${rowIndex}-length`} onKeyDown={(e) => handleKeyDown(e, itemKey, rowIndex, 'length')} value={row.length} onChange={(e) => handleInputChange(e, itemKey, rowIndex, 'length')} className="w-24 p-1 border rounded text-center" /></td>
                                                <td className="text-center text-gray-400">{unitInfo.params.length > 1 ? 'x' : ''}</td>
                                                <td>{unitInfo.params.length > 1 && <input type="number" id={`input-${itemKey}-${rowIndex}-breadth`} onKeyDown={(e) => handleKeyDown(e, itemKey, rowIndex, 'breadth')} value={row.breadth} onChange={(e) => handleInputChange(e, itemKey, rowIndex, 'breadth')} className="w-24 p-1 border rounded text-center" />}</td>
                                                <td className="text-center text-gray-400">{unitInfo.params.length > 2 ? 'x' : ''}</td>
                                                <td>{unitInfo.params.length > 2 && <input type="number" id={`input-${itemKey}-${rowIndex}-depth`} onKeyDown={(e) => handleKeyDown(e, itemKey, rowIndex, 'depth')} value={row.depth} onChange={(e) => handleInputChange(e, itemKey, rowIndex, 'depth')} className="w-24 p-1 border rounded text-center" />}</td>
                                            </>) : (<td colSpan="5"><input type="number" id={`input-${itemKey}-${rowIndex}-quantity`} onKeyDown={(e) => handleKeyDown(e, itemKey, rowIndex, 'quantity')} value={row.quantity} onChange={(e) => handleInputChange(e, itemKey, rowIndex, 'quantity')} className="w-24 p-1 border rounded text-center" /></td>)}
                                            <td className="py-2 font-medium">{calculateQuantity(row, unitInfo).toFixed(2)}</td>
                                            <td colSpan="4"></td>
                                            <td><button onClick={() => handleRemoveRow(itemKey, rowIndex)} className="text-red-500 hover:text-red-700 font-semibold">Remove</button></td>
                                        </tr>
                                    ))}
                                    <tr className="bg-white">
                                        <td colSpan="12" className="pt-2 text-left">
                                            <button onClick={() => handleAddRow(itemKey)} className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm font-bold py-1 px-3 rounded-full">+ Add Row</button>
                                        </td>
                                    </tr>
                                    <tr className="bg-gray-100 font-semibold text-right">
                                        <td colSpan="7" className="px-4 py-2">Item Totals:</td>
                                        <td className="px-4 py-2 text-center font-bold">{totalQuantity.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-center">{item['Unit']}</td>
                                        <td className="px-4 py-2 text-center">
                                            <input 
                                                type="number" 
                                                value={editableRates[itemKey] ?? item['Completed Rate for 2022-23 excluding GST In Rs.']} 
                                                onChange={(e) => handleRateChange(e, itemKey)} 
                                                className="w-28 p-1 border rounded text-right" 
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <select 
                                                value={rateSelection[itemKey] || 'original'} 
                                                onChange={(e) => handleRateSelectionChange(e, itemKey)}
                                                className="w-24 p-1 border rounded text-center text-xs"
                                            >
                                                <option value="original">Original</option>
                                                <option value="user">User Rate</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-2 font-bold">{calculateTotalCostForItem(item).toFixed(2)}</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    );
                })}
                
                <hr className="my-6 border-t border-gray-300" />
                
                <div className="p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Add Item to Estimate</h2>
                    <div className="grid md:grid-cols-2 gap-6 items-start">
                        <div className="flex flex-col space-y-4">
                            <select value={selectedGroup} onChange={(e) => {setSelectedGroup(e.target.value); setSelectedItemNo('');}} className="w-full p-2 border rounded shadow-sm">
                                <option value="">Select Chapter</option>
                                {Object.keys(groupedData).map(group => <option key={group} value={group}>{group}</option>)}
                            </select>
                            {selectedGroup && <select size="8" value={selectedItemNo} onChange={(e) => setSelectedItemNo(e.target.value)} className="w-full p-2 border rounded shadow-sm">
                                {groupedData[selectedGroup].map(item => <option key={item['SSR Item No.']} value={String(item['SSR Item No.']).trim()}>{`${item['SSR Item No.']} - ${item['Description of the item']}`}</option>)}
                            </select>}
                            <button onClick={handleAddItemByDropdown} disabled={!selectedItemNo} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow-sm disabled:opacity-50">Add Selected Item</button>
                        </div>
                        <div className="flex flex-col justify-center items-center h-full">
                            <div className="flex items-center w-full"><hr className="flex-grow"/><span className="mx-4 text-gray-500">OR</span><hr className="flex-grow"/></div>
                            <div className="w-full mt-4 flex items-center space-x-4">
                                <input type="text" placeholder="Enter SSR Item No." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 p-2 border rounded shadow-sm" />
                                <button onClick={handleAddItemByNumber} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow-sm">Add</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {searchResults.length > 0 && (
                    <div className="p-6 my-6 bg-white rounded-lg shadow-md text-right">
                        <hr className="my-4"/>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Grand Total Cost: <span className="text-green-600">₹{grandTotalCost.toFixed(2)}</span></h2>
                        <p className="font-semibold text-gray-600 italic">({grandTotalInWords})</p>
                    </div>
                )}
            </main>
        </div>
    );
};

// --- COMPONENT 3: App Wrapper ---
const App = () => <SsrSheet />;
export default App;