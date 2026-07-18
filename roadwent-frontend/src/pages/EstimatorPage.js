import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// --- HELPER FUNCTIONS ---
const numberToWords = (amount) => {
    const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

    const toWordsBelowThousand = (n) => {
        let str = '';
        if (n >= 100) {
            str += ones[Math.floor(n/100)] + ' Hundred';
            n = n % 100;
            if (n) str += ' ';
        }
        if (n >= 20) {
            str += tens[Math.floor(n/10)];
            n = n % 10;
            if (n) str += ' ' + ones[n];
        } else if (n > 0) {
            str += ones[n];
        }
        return str.trim();
    };

    const sanitize = Number(amount);
    if (!isFinite(sanitize)) return '';
    if (sanitize === 0) return 'Rupees Zero Only';

    const integerPart = Math.floor(Math.abs(sanitize));
    const decimalPart = Math.round((Math.abs(sanitize) - integerPart) * 100); // paise

    // Indian numbering system groups
    const crore = Math.floor(integerPart / 10000000);
    const lakh = Math.floor((integerPart % 10000000) / 100000);
    const thousand = Math.floor((integerPart % 100000) / 1000);
    const hundred = Math.floor(integerPart % 1000);

    let words = [];
    if (crore) words.push(toWordsBelowThousand(crore) + ' Crore');
    if (lakh) words.push(toWordsBelowThousand(lakh) + ' Lakh');
    if (thousand) words.push(toWordsBelowThousand(thousand) + ' Thousand');
    if (hundred) words.push(toWordsBelowThousand(hundred));

    let result = 'Rupees ' + words.join(' ').trim();
    if (decimalPart) {
        result += ' and ' + toWordsBelowThousand(decimalPart) + ' Paise';
    }
    result += ' Only';
    if (sanitize < 0) result = 'Minus ' + result;
    return result;
};

const s2ab = (s) => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i += 1) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
};

const EstimatorPage = () => {
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
    const [currentReportId, setCurrentReportId] = useState(null); // local id
    const [currentServerReportId, setCurrentServerReportId] = useState(null); // backend _id
    const [projectDetails, setProjectDetails] = useState({});
    const [clientDetails, setClientDetails] = useState({});
    const [isEditingProjectDetails, setIsEditingProjectDetails] = useState(false);
    const [isEditingClientDetails, setIsEditingClientDetails] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
    const [isEditingServerReport, setIsEditingServerReport] = useState(false);
    const toast = (msg) => {
        try { window.dispatchEvent(new CustomEvent('app:toast', { detail: msg })); } catch (_) {}
        try { navigate(location.pathname, { replace: true, state: { toast: msg } }); } catch (_) {}
    };
    
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
        // Handle incoming data from previous steps or existing reports.
        // IMPORTANT: only act on navigation state that actually carries data.
        // The toast() helper re-navigates with state={toast}; if we reacted to
        // that here we would wipe the loaded project/client details back to {}.
        if (!location.state) return;

        if (location.state.report) {
            // Loading existing report for editing
            const incomingReport = location.state.report;
            // Prefer server-stored items, fallback to local shape
            setSearchResults(incomingReport.items || incomingReport.searchResults || []);
            setInputData(incomingReport.inputData || {});
            setEditableRates(incomingReport.editableRates || {});
            setCurrentReportId(incomingReport.id || null);
            setCurrentServerReportId(incomingReport._id || null);
            setProjectDetails(incomingReport.projectDetails || {});
            setClientDetails(incomingReport.clientDetails || {});
            if (typeof incomingReport.grandTotalCost === 'number') setGrandTotalCost(incomingReport.grandTotalCost);
            if (incomingReport.grandTotalInWords) setGrandTotalInWords(incomingReport.grandTotalInWords);
            setMessage({ text: 'Loaded report for editing.', type: 'success' });
            // Ensure edit toggles are off by default when loading from DB
            setIsEditingProjectDetails(false);
            setIsEditingClientDetails(false);
            setIsEditingServerReport(true);
        } else if (location.state.projectDetails || location.state.clientDetails) {
            // Arriving fresh from the Project/Client detail forms
            setProjectDetails(location.state.projectDetails || {});
            setClientDetails(location.state.clientDetails || {});
            setIsEditingServerReport(false);
            // Do NOT create a backend draft here. Creating a report on page entry
            // produced phantom ₹0 records and duplicates (a racy create that ran again
            // on Save). The backend report is now created only when the user saves.
            setCurrentServerReportId(null);
        }
        // Any other state (e.g. a toast-only { toast } payload) is ignored so it
        // does not clobber the project/client details already in component state.
    }, [location.state]);

    // Keyboard shortcuts for undo/redo
    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
                event.preventDefault();
                handleUndo();
            } else if (((event.ctrlKey || event.metaKey) && event.key === 'y') || 
                      ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Z')) {
                event.preventDefault();
                handleRedo();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [historyIndex, history]);

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
        const nos = parseFloat(row.nos) || 1;
        if (unitInfo.type === 'dimensional') {
            if (unitInfo.params.length === 3) return nos * length * breadth * depth;
            if (unitInfo.params.length === 2) return nos * length * breadth;
            if (unitInfo.params.length === 1) return nos * length;
        }
        if (unitInfo.type === 'single') {
            return nos * (parseFloat(row.quantity) || 0);
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

    useEffect(() => {
        const newGrandTotalCost = searchResults.reduce((sum, item) => sum + calculateTotalCostForItem(item), 0);
        setGrandTotalCost(newGrandTotalCost);
        setGrandTotalInWords(numberToWords(newGrandTotalCost));
    }, [searchResults, inputData, editableRates]);

    const addItemToSheet = (itemToAdd) => {
        if (!itemToAdd) return;
        const itemKey = String(itemToAdd['SSR Item No.']).trim();
        
        // Check if item already exists
        if (searchResults.some(item => String(item['SSR Item No.']).trim() === itemKey)) {
            // Create a unique version of the item by adding a suffix
            const timestamp = Date.now();
            const uniqueItemKey = `${itemKey}-${timestamp}`;
            const uniqueItem = {
                ...itemToAdd,
                'SSR Item No.': uniqueItemKey,
                'Original SSR Item No.': itemKey // Store original item number for reference
            };
            
            saveToHistory(); // Save state before adding item
            const unitInfo = getUnitInfo(uniqueItem['Unit']);
            const initialInput = unitInfo.type === 'single'
                ? Array.from({ length: 1 }, () => ({ quantity: '', comment: '', nos: '1' })) 
                : Array.from({ length: 1 }, () => ({ length: '', breadth: '', depth: '', comment: '', nos: '1' }));
            setSearchResults(prevResults => [...prevResults, uniqueItem]);
            setInputData(prevData => ({ ...prevData, [uniqueItemKey]: initialInput }));
            setMessage({ text: 'Duplicate item added with unique identifier.', type: 'success' });
            return;
        }
        
        saveToHistory(); // Save state before adding item
        const unitInfo = getUnitInfo(itemToAdd['Unit']);
        const initialInput = unitInfo.type === 'single'
            ? Array.from({ length: 1 }, () => ({ quantity: '', comment: '', nos: '1' })) 
            : Array.from({ length: 1 }, () => ({ length: '', breadth: '', depth: '', comment: '', nos: '1' }));
        setSearchResults(prevResults => [...prevResults, itemToAdd]);
        setInputData(prevData => ({ ...prevData, [itemKey]: initialInput }));
    };
    
    const handleAddRow = (itemKey) => {
        saveToHistory(); // Save state before adding row
        const unitInfo = getUnitInfo(searchResults.find(item => item['SSR Item No.'] === itemKey)?.['Unit']);
        const newRow = unitInfo.type === 'single' ? { quantity: '', comment: '', nos: '1' } : { length: '', breadth: '', depth: '', comment: '', nos: '1' };
        setInputData(prevData => ({ ...prevData, [itemKey]: [...prevData[itemKey], newRow] }));
    };

    const handleRemoveRow = (itemKey, rowIndex) => {
        if (inputData[itemKey].length <= 1) {
            setMessage({ text: "You cannot remove the last row.", type: 'error' });
            setTimeout(()=> setMessage({ text: '', type: ''}), 3000);
            return;
        }
        saveToHistory(); // Save state before removing row
        setInputData(prevData => ({ ...prevData, [itemKey]: prevData[itemKey].filter((_, index) => index !== rowIndex) }));
    };
    
    const handleRemoveItem = (itemKeyToRemove) => {
        saveToHistory(); // Save state before removing item
        setSearchResults(prev => prev.filter(item => item['SSR Item No.'] !== itemKeyToRemove));
        setInputData(prev => {
            const newInputData = { ...prev };
            delete newInputData[itemKeyToRemove];
            return newInputData;
        });
        setEditableRates(prev => {
            const newRates = { ...prev };
            delete newRates[itemKeyToRemove];
            return newRates;
        });
    };

    const handleAddItemByNumber = () => {
        const foundItem = data.find(item => String(item['SSR Item No.']).trim() === searchQuery.trim());
        if (foundItem) { addItemToSheet(foundItem); setSearchQuery(''); } 
        else { setMessage({ text: 'SSR Item No not found.', type: 'error' }); toast('SSR Item No not found.'); }
    };
    const handleAddItemByDropdown = () => {
        const itemToAdd = groupedData[selectedGroup]?.find(item => String(item['SSR Item No.']).trim() === selectedItemNo);
        if (itemToAdd) { addItemToSheet(itemToAdd); setSelectedGroup(''); setSelectedItemNo(''); }
    };
    
    const handleAddEmptyCard = () => {
        saveToHistory(); // Save state before adding empty card
        // Generate a unique ID with timestamp and random number to ensure uniqueness
        const emptyItemId = `EMPTY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const emptyItem = {
            'SSR Item No.': emptyItemId,
            'Description of the item': 'Custom Item',
            'Unit': 'Cum',
            'Completed Rate for 2022-23 excluding GST In Rs.': '0'
        };
        
        const unitInfo = getUnitInfo(emptyItem['Unit']);
        const initialInput = unitInfo.type === 'single'
            ? Array.from({ length: 1 }, () => ({ quantity: '', comment: '', nos: '1' })) 
            : Array.from({ length: 1 }, () => ({ length: '', breadth: '', depth: '', comment: '', nos: '1' }));
            
        // Directly add to state without going through addItemToSheet to bypass duplicate check
        setSearchResults(prevResults => [...prevResults, emptyItem]);
        setInputData(prevData => ({ ...prevData, [emptyItemId]: initialInput }));
        setMessage({ text: 'Empty card added successfully.', type: 'success' });
        toast('Empty card added successfully.');
    };
    const handleDescriptionChange = (itemKey, newDescription) => {
        saveToHistory(); // Save state before changing description
        setSearchResults(prevResults => 
            prevResults.map(item => 
                item['SSR Item No.'] === itemKey 
                    ? {...item, 'Description of the item': newDescription} 
                    : item
            )
        );
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
        saveToHistory(); // Save state before changing rate
        setEditableRates(prevRates => ({ ...prevRates, [itemKey]: value }));
        // Mark as user-entered rate when user modifies it
        setRateSelection(prevSelection => ({ ...prevSelection, [itemKey]: 'user' }));
    };

    const handleRateSelectionChange = (e, itemKey) => {
        const { value } = e.target;
        saveToHistory(); // Save state before changing rate selection
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
        toast('Sheet has been reset.');
        setCurrentReportId(null);
    };

    const handleProjectDetailsChange = (field, value) => {
        setProjectDetails(prev => ({ ...prev, [field]: value }));
    };

    const handleClientDetailsChange = (field, value) => {
        setClientDetails(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveReport = async () => {
        if (searchResults.length === 0) {
            setMessage({ text: 'Please add at least one item before saving.', type: 'error' });
            return;
        }

        const localReportId = currentReportId || Date.now().toString();
        const reportData = {
            id: localReportId,
            projectDetails,
            clientDetails,
            searchResults,
            inputData,
            editableRates,
            rateSelection,
            grandTotalCost,
            grandTotalInWords,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            // Try to persist to backend (create or update), user-scoped
            try {
                const { createReport, updateReport } = await import('../services/reportService');
                const estimatedTimeNumber = parseInt(projectDetails?.projectDuration, 10);
                const payload = {
                    // summary
                    title: projectDetails?.projectName || 'Untitled Project',
                    description: `Client: ${clientDetails?.clientName || 'N/A'}; Items: ${searchResults.length}`,
                    projectName: projectDetails?.projectName || 'Untitled Project',
                    estimatedCost: Number(grandTotalCost) || 0,
                    estimatedTime: Number.isNaN(estimatedTimeNumber) ? 0 : estimatedTimeNumber,
                    status: 'draft',
                    // full content
                    projectDetails,
                    clientDetails,
                    items: searchResults,
                    searchResults,
                    inputData,
                    editableRates,
                    rateSelection,
                    grandTotalCost: Number(grandTotalCost) || 0,
                    grandTotalInWords: grandTotalInWords || ''
                };
                if (currentServerReportId) {
                    await updateReport(currentServerReportId, payload);
                } else {
                    try {
                        const created = await createReport(payload);
                        if (created && created._id) {
                            setCurrentServerReportId(created._id);
                        }
                    } catch (_) {
                        // ignore backend errors; local save proceeds
                    }
                }
            } catch (_) {
                // ignore backend errors; local save proceeds
            }

            const existingReports = JSON.parse(localStorage.getItem('roadwent_reports') || '[]');
            const alreadyStored = existingReports.some(r => r.id === localReportId);
            const updatedReports = alreadyStored
                ? existingReports.map(r => r.id === localReportId ? reportData : r)
                : [...existingReports, reportData];

            localStorage.setItem('roadwent_reports', JSON.stringify(updatedReports));
            // Remember the id so subsequent saves update this record instead of appending
            setCurrentReportId(localReportId);
            setMessage({ text: 'Report saved successfully!', type: 'success' });
            toast('Report saved successfully!');
            
            // Redirect to report page after a short delay
            setTimeout(() => {
                navigate('/report');
            }, 1500);
        } catch (error) {
            setMessage({ text: 'Error saving report. Please try again.', type: 'error' });
        }
    };

    // History management functions
    const saveToHistory = () => {
        if (isUndoRedoAction) return; // Don't save history during undo/redo operations
        
        const currentState = {
            searchResults: [...searchResults],
            inputData: JSON.parse(JSON.stringify(inputData)),
            editableRates: JSON.parse(JSON.stringify(editableRates)),
            rateSelection: JSON.parse(JSON.stringify(rateSelection)),
            projectDetails: JSON.parse(JSON.stringify(projectDetails)),
            clientDetails: JSON.parse(JSON.stringify(clientDetails))
        };

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(currentState);
        
        // Limit history to 50 states to prevent memory issues
        if (newHistory.length > 50) {
            newHistory.shift();
        } else {
            setHistoryIndex(historyIndex + 1);
        }
        
        setHistory(newHistory);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setIsUndoRedoAction(true);
            const previousState = history[historyIndex - 1];
            
            setSearchResults(previousState.searchResults);
            setInputData(previousState.inputData);
            setEditableRates(previousState.editableRates);
            setRateSelection(previousState.rateSelection);
            setProjectDetails(previousState.projectDetails);
            setClientDetails(previousState.clientDetails);
            
            setHistoryIndex(historyIndex - 1);
            setMessage({ text: 'Undo completed', type: 'success' });
            
            setTimeout(() => {
                setIsUndoRedoAction(false);
                setMessage({ text: '', type: '' });
            }, 1000);
        } else {
            setMessage({ text: 'Nothing to undo', type: 'error' });
            setTimeout(() => setMessage({ text: '', type: '' }), 2000);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setIsUndoRedoAction(true);
            const nextState = history[historyIndex + 1];
            
            setSearchResults(nextState.searchResults);
            setInputData(nextState.inputData);
            setEditableRates(nextState.editableRates);
            setRateSelection(nextState.rateSelection);
            setProjectDetails(nextState.projectDetails);
            setClientDetails(nextState.clientDetails);
            
            setHistoryIndex(historyIndex + 1);
            setMessage({ text: 'Redo completed', type: 'success' });
            
            setTimeout(() => {
                setIsUndoRedoAction(false);
                setMessage({ text: '', type: '' });
            }, 1000);
        } else {
            setMessage({ text: 'Nothing to redo', type: 'error' });
            setTimeout(() => setMessage({ text: '', type: '' }), 2000);
        }
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

    const persistReport = (format) => {
        try {
            const reportsKey = 'roadwent_reports';
            const existingRaw = localStorage.getItem(reportsKey);
            const existing = existingRaw ? JSON.parse(existingRaw) : [];
            const now = new Date();
            const reportId = currentReportId || `rep_${now.getTime()}`;
            
            // Use current project name, fallback to timestamp if empty
            const currentProjectName = projectDetails.projectName?.trim() || `Estimate ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
            const title = currentProjectName;
            
            console.log('Saving report with project name:', currentProjectName);
            
            const reportPayload = {
                id: reportId,
                title,
                projectDetails,
                clientDetails,
                createdAt: now.toISOString(),
                format,
                grandTotalCost,
                searchResults,
                inputData,
                editableRates,
            };
            const updated = (() => {
                const idx = existing.findIndex(r => r.id === reportId);
                if (idx >= 0) { const copy = [...existing]; copy[idx] = reportPayload; return copy; }
                return [reportPayload, ...existing].slice(0, 20);
            })();
            localStorage.setItem(reportsKey, JSON.stringify(updated));
            setCurrentReportId(reportId);
            setMessage({ text: `Report saved as "${currentProjectName}"`, type: 'success' });
        } catch (e) {
            // swallow storage errors
        }
    };

    const buildAllData = () => {
        const allData = [
            // Header section
            ['DETAILED CUM ABSTRACT ESTIMATE', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', ''],
            // Project Details
            ['PROJECT DETAILS', '', '', '', '', '', '', '', '', ''],
            ['Project Title:', projectDetails.projectName || 'Not Specified', '', '', '', '', '', '', '', ''],
            ['Project Manager:', projectDetails.projectManager || 'Not Specified', '', '', '', '', '', '', '', ''],
            ['Start Date:', projectDetails.startDate || 'Not Specified', '', '', '', '', '', '', '', ''],
            ['End Date:', projectDetails.endDate || 'Not Specified', '', '', '', '', '', '', '', ''],
            ['Project Description:', projectDetails.projectDescription || 'Not Specified', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', ''],
            // Client Details
            ['CLIENT DETAILS', '', '', '', '', '', '', '', '', ''],
            ['Client Name:', clientDetails.clientName || 'Not Specified', '', '', '', '', '', '', '', ''],
            ['Company Name:', clientDetails.companyName || 'Not Specified', '', '', '', '', '', '', '', ''],
            ['Address:', clientDetails.address || 'Not Specified', '', '', '', '', '', '', '', ''],
            ['Phone:', clientDetails.phone || 'Not Specified', '', '', '', '', '', '', '', ''],
            ['Email:', clientDetails.email || 'Not Specified', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', ''],
            ['Est. Cost Rs.', grandTotalCost.toFixed(0), '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', ''],
            // Column headers
            ['S.No', 'Description of work', 'No.', 'Length', 'Breadth', 'Depth', 'Qty.', 'Rate', 'Amount', '']
        ];
        
        searchResults.forEach((item, itemIndex) => {
            const itemKey = item['SSR Item No.'];
            const itemInputRows = inputData[itemKey] || [];
            const unitInfo = getUnitInfo(item['Unit']);
            const rate = parseFloat(editableRates[itemKey] ?? item['Completed Rate for 2022-23 excluding GST In Rs.']) || 0;
            
            // Main item row - consolidated format
            const totalQuantity = itemInputRows.reduce((sum, row) => sum + calculateQuantity(row, unitInfo), 0);
            const totalCost = totalQuantity * rate;
            
            // Get dimensions from first row or use defaults
            const firstRow = itemInputRows[0] || {};
            const length = parseFloat(firstRow.length) || 0;
            const breadth = parseFloat(firstRow.breadth) || 0;
            const depth = parseFloat(firstRow.depth) || 0;
            
            // Truncate long descriptions for Excel
            const fullDescription = `SSR no.${itemKey} - ${item['Chapter'] || 'General'}`;
            const maxDescLength = 50;
            const truncatedDescription = fullDescription.length > maxDescLength 
                ? fullDescription.substring(0, maxDescLength) + '...'
                : fullDescription;
            
            allData.push([
                itemIndex + 1, // S.No
                truncatedDescription, // Description of work
                '1', // No.
                length.toFixed(2), // Length
                breadth.toFixed(2), // Breadth
                depth.toFixed(2), // Depth
                totalQuantity.toFixed(2), // Qty.
                rate.toFixed(2), // Rate
                totalCost.toFixed(0) // Amount
            ]);
        });
        
        // Grand total row
        allData.push([
            '', // Empty S.No
            'TOTAL', // Total description
            '', // Empty No.
            '', // Empty Length
            '', // Empty Breadth
            '', // Empty Depth
            '', // Empty Qty.
            '', // Empty Rate
            grandTotalCost.toFixed(0) // Total Amount
        ]);
        
        return allData;
    };

    const handleDownloadExcel = () => {
        setIsProcessing(true);
        setTimeout(() => {
            const allData = buildAllData();
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(allData);
            
            // Apply yellow highlighting to user-modified rate cells
            const headerRowCount = 20; // Number of header rows before data starts
            searchResults.forEach((item, itemIndex) => {
                const itemKey = item['SSR Item No.'];
                const isUserRate = rateSelection[itemKey] === 'user';
                
                if (isUserRate) {
                    const dataRowIndex = headerRowCount + itemIndex;
                    const rateColumnIndex = 7; // Rate column (0-indexed)
                    
                    if (!worksheet['!rows']) worksheet['!rows'] = [];
                    if (!worksheet['!rows'][dataRowIndex]) worksheet['!rows'][dataRowIndex] = {};
                    if (!worksheet['!rows'][dataRowIndex].s) worksheet['!rows'][dataRowIndex].s = {};
                    worksheet['!rows'][dataRowIndex].s.fill = { fgColor: { rgb: 'FFFF00' } }; // Yellow background
                }
            });
            
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Cost_Estimation');
            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
            const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = 'Cost_Estimation.xlsx';
            link.click();
            persistReport('excel');
            setMessage({ text: `Excel downloaded and saved as "${projectDetails.projectName || 'Untitled Project'}"`, type: 'success' });
            setIsProcessing(false);
            setIsDownloadMenuOpen(false);
        }, 100);
    };

    const handleDownloadCSV = () => {
        setIsProcessing(true);
        setTimeout(() => {
            const allData = buildAllData();
            const csv = allData.map(row => row.map(cell => {
                const value = String(cell ?? '');
                if (/[",\n]/.test(value)) return '"' + value.replace(/"/g, '""') + '"';
                return value;
            }).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Cost_Estimation.csv';
            link.click();
            persistReport('csv');
            setMessage({ text: `CSV downloaded and saved as "${projectDetails.projectName || 'Untitled Project'}"`, type: 'success' });
            setIsProcessing(false);
            setIsDownloadMenuOpen(false);
        }, 50);
    };


    const handleDownloadPDFNew = () => {
        setIsProcessing(true);
        setTimeout(() => {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let yPosition = 20;
            
            // Main title
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('DETAILED CUM ABSTRACT ESTIMATE', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 20;
            
            // Project details
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text('PROJECT DETAILS', 20, yPosition);
            yPosition += 10;
            doc.text(`Project Title: ${projectDetails.projectName || 'Not Specified'}`, 20, yPosition);
            yPosition += 10;
            doc.text(`Project Manager: ${projectDetails.projectManager || 'Not Specified'}`, 20, yPosition);
            yPosition += 10;
            doc.text(`Start Date: ${projectDetails.startDate || 'Not Specified'}`, 20, yPosition);
            yPosition += 10;
            doc.text(`End Date: ${projectDetails.endDate || 'Not Specified'}`, 20, yPosition);
            yPosition += 10;
            doc.text(`Project Description: ${projectDetails.projectDescription || 'Not Specified'}`, 20, yPosition);
            yPosition += 15;
            
            // Client details
            doc.text('CLIENT DETAILS', 20, yPosition);
            yPosition += 10;
            doc.text(`Client Name: ${clientDetails.clientName || 'Not Specified'}`, 20, yPosition);
            yPosition += 10;
            doc.text(`Company: ${clientDetails.companyName || 'Not Specified'}`, 20, yPosition);
            yPosition += 10;
            doc.text(`Phone: ${clientDetails.phone || 'Not Specified'}`, 20, yPosition);
            yPosition += 10;
            doc.text(`Email: ${clientDetails.email || 'Not Specified'}`, 20, yPosition);
            yPosition += 10;
            doc.text(`Address: ${clientDetails.address || 'Not Specified'}`, 20, yPosition);
            yPosition += 15;
            
            // Table headers
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            const headers = ['S.No', 'Description of work', 'No.', 'Length', 'Breadth', 'Depth', 'Qty.', 'Rate', 'Amount'];
            const colWidths = [10, 60, 10, 15, 15, 15, 15, 15, 25];
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
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            
            searchResults.forEach((item, itemIndex) => {
                // Skip if item is undefined
                if (!item) return;
                
                const itemKey = item['SSR Item No.'];
                // Skip if SSR Item No. is undefined
                if (!itemKey) return;
                
                const itemInputRows = inputData[itemKey] || [];
                const unitInfo = getUnitInfo(item['Unit'] || '');
                const rate = parseFloat(editableRates[itemKey] ?? item['Completed Rate for 2022-23 excluding GST In Rs.']) || 0;
                
                // Check if we need a new page
                if (yPosition > pageHeight - 40) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                // Main item row - consolidated format
                const totalQuantity = itemInputRows.reduce((sum, row) => sum + calculateQuantity(row, unitInfo), 0);
                const totalCost = totalQuantity * rate;
                
                // Get dimensions from first row or use defaults
                const firstRow = itemInputRows[0] || {};
                const length = parseFloat(firstRow.length) || 0;
                const breadth = parseFloat(firstRow.breadth) || 0;
                const depth = parseFloat(firstRow.depth) || 0;
                
                // Calculate column positions based on widths
                const colPositions = [10, 20, 80, 90, 105, 120, 135, 150, 165];
                
                doc.text(`${itemIndex + 1}`, colPositions[0], yPosition); // S.No
                
                // Use SSR format for description with text wrapping
                const description = `SSR no.${itemKey} - ${item['Chapter'] || 'General'}`;
                
                // Split long descriptions into multiple lines
                const maxWidth = 60;
                const splitText = doc.splitTextToSize(description, maxWidth);
                
                // Draw description (may be multiple lines)
                doc.text(splitText, colPositions[1], yPosition);
                
                // Calculate how much vertical space the description takes
                const lineHeight = 4;
                const descriptionHeight = splitText.length * lineHeight;
                
                // Draw other columns aligned to the first line of description
                doc.text('1', colPositions[2], yPosition); // No.
                doc.text(length.toFixed(2), colPositions[3], yPosition); // Length
                doc.text(breadth.toFixed(2), colPositions[4], yPosition); // Breadth
                doc.text(depth.toFixed(2), colPositions[5], yPosition); // Depth
                doc.text(totalQuantity.toFixed(2), colPositions[6], yPosition); // Quantity
                doc.text(rate.toFixed(2), colPositions[7], yPosition); // Rate
                doc.text(totalCost.toFixed(2), colPositions[8], yPosition); // Amount
                
                // Move to next row based on description height
                yPosition += Math.max(descriptionHeight, 10);
            });
            
            // Grand total
            if (yPosition > pageHeight - 50) {
                doc.addPage();
                yPosition = 20;
            }
            
            // Draw line before grand total
            doc.line(10, yPosition, pageWidth - 10, yPosition);
            yPosition += 10;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('TOTAL', 80, yPosition);
            doc.text(grandTotalCost.toFixed(2), 165, yPosition);
            yPosition += 15;
            
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.text(`(${grandTotalInWords})`, pageWidth / 2, yPosition, { align: 'center' });
            
            // Save the PDF
            doc.save('Cost_Estimation.pdf');
            persistReport('pdf');
            setMessage({ text: `PDF downloaded and saved as "${projectDetails.projectName || 'Untitled Project'}"`, type: 'success' });
            setIsProcessing(false);
            setIsDownloadMenuOpen(false);
        }, 100);
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen font-bold text-xl">Loading SSR Data...</div>;
    if (error) return <div className="flex flex-col justify-center items-center h-screen text-red-600 font-bold text-xl"><p>Error: {error}</p><p className="text-sm text-gray-600 mt-2">Please ensure `ssr_sheet.xlsx` is in the `public/data` folder.</p></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="container p-6 mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Estimate Details</h1>
                <div className="flex items-center space-x-4 relative">
                    {/* Undo/Redo Buttons */}
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={handleUndo} 
                            disabled={historyIndex <= 0}
                            className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-full shadow-lg transition duration-300 flex items-center"
                            title="Undo (Ctrl+Z)"
                        >
                            ↶ Undo
                        </button>
                        <button 
                            onClick={handleRedo} 
                            disabled={historyIndex >= history.length - 1}
                            className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-full shadow-lg transition duration-300 flex items-center"
                            title="Redo (Ctrl+Y)"
                        >
                            ↷ Redo
                        </button>
                    </div>
                    
                    {searchResults.length > 0 && (<>
                        <button onClick={handleReset} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full shadow-lg transition duration-300">Reset All</button>
                        <div className="relative">
                            <button onClick={() => setIsDownloadMenuOpen(prev => !prev)} disabled={isProcessing} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full shadow-lg transition duration-300">{isProcessing ? 'Processing...' : 'Download'}</button>
                            {isDownloadMenuOpen && (
                                <div className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-10">
                                    <button onClick={handleDownloadExcel} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Excel (.xlsx)</button>
                                    <button onClick={handleDownloadCSV} className="block w-full text-left px-4 py-2 hover:bg-gray-100">CSV (.csv)</button>
                                    <button onClick={handleDownloadPDFNew} className="block w-full text-left px-4 py-2 hover:bg-gray-100">PDF (.pdf)</button>
                                </div>
                            )}
                        </div>
                    </>)}
                </div>
            </div>
            
            {/* Project & Client Summary (hidden when editing server report) */}
            {!isEditingServerReport && (
                <div className="mb-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">📋 Project Summary</h2>
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => setIsEditingProjectDetails(!isEditingProjectDetails)}
                                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                >
                                    {isEditingProjectDetails ? 'Done' : 'Edit Project'}
                                </button>
                                <button 
                                    onClick={() => setIsEditingClientDetails(!isEditingClientDetails)}
                                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                >
                                    {isEditingClientDetails ? 'Done' : 'Edit Client'}
                                </button>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">Project Details</h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <strong>Title:</strong> 
                                        {isEditingProjectDetails ? (
                                            <input 
                                                type="text" 
                                                value={projectDetails.projectName || ''} 
                                                onChange={(e) => handleProjectDetailsChange('projectName', e.target.value)}
                                                className="ml-2 px-2 py-1 border rounded w-full max-w-xs"
                                                placeholder="Enter project name"
                                            />
                                        ) : (
                                            <span className="ml-1">{projectDetails.projectName || 'Not Specified'}</span>
                                        )}
                                    </div>
                                    <div>
                                        <strong>Manager:</strong> 
                                        {isEditingProjectDetails ? (
                                            <input 
                                                type="text" 
                                                value={projectDetails.projectManager || ''} 
                                                onChange={(e) => handleProjectDetailsChange('projectManager', e.target.value)}
                                                className="ml-2 px-2 py-1 border rounded w-full max-w-xs"
                                                placeholder="Enter project manager"
                                            />
                                        ) : (
                                            <span className="ml-1">{projectDetails.projectManager || 'Not Specified'}</span>
                                        )}
                                    </div>
                                    <div>
                                        <strong>Start Date:</strong> 
                                        {isEditingProjectDetails ? (
                                            <input 
                                                type="date" 
                                                value={projectDetails.startDate || ''} 
                                                onChange={(e) => handleProjectDetailsChange('startDate', e.target.value)}
                                                className="ml-2 px-2 py-1 border rounded w-full max-w-xs"
                                            />
                                        ) : (
                                            <span className="ml-1">{projectDetails.startDate || 'Not Specified'}</span>
                                        )}
                                    </div>
                                    <div>
                                        <strong>End Date:</strong> 
                                        {isEditingProjectDetails ? (
                                            <input 
                                                type="date" 
                                                value={projectDetails.endDate || ''} 
                                                onChange={(e) => handleProjectDetailsChange('endDate', e.target.value)}
                                                className="ml-2 px-2 py-1 border rounded w-full max-w-xs"
                                            />
                                        ) : (
                                            <span className="ml-1">{projectDetails.endDate || 'Not Specified'}</span>
                                        )}
                                    </div>
                                    <div>
                                        <strong>Description:</strong> 
                                        {isEditingProjectDetails ? (
                                            <textarea 
                                                value={projectDetails.projectDescription || ''} 
                                                onChange={(e) => handleProjectDetailsChange('projectDescription', e.target.value)}
                                                className="ml-2 px-2 py-1 border rounded w-full max-w-xs h-16 resize-none"
                                                placeholder="Enter project description"
                                            />
                                        ) : (
                                            <span className="ml-1">{projectDetails.projectDescription || 'Not Specified'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">Client Details</h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <strong>Name:</strong> 
                                        {isEditingClientDetails ? (
                                            <input 
                                                type="text" 
                                                value={clientDetails.clientName || ''} 
                                                onChange={(e) => handleClientDetailsChange('clientName', e.target.value)}
                                                className="ml-2 px-2 py-1 border rounded w-full max-w-xs"
                                                placeholder="Enter client name"
                                            />
                                        ) : (
                                            <span className="ml-1">{clientDetails.clientName || 'Not Specified'}</span>
                                    )}
                                </div>
                                    <div>
                                        <strong>Company:</strong> 
                                        {isEditingClientDetails ? (
                                            <input 
                                                type="text" 
                                                value={clientDetails.companyName || ''} 
                                                onChange={(e) => handleClientDetailsChange('companyName', e.target.value)}
                                                className="ml-2 px-2 py-1 border rounded w-full max-w-xs"
                                                placeholder="Enter company name"
                                            />
                                        ) : (
                                            <span className="ml-1">{clientDetails.companyName || 'Not Specified'}</span>
                                        )}
                            </div>
                                    <div>
                                        <strong>Phone:</strong> 
                                        {isEditingClientDetails ? (
                                            <input 
                                                type="tel" 
                                                value={clientDetails.phone || ''} 
                                                onChange={(e) => handleClientDetailsChange('phone', e.target.value)}
                                                className="ml-2 px-2 py-1 border rounded w-full max-w-xs"
                                                placeholder="Enter phone number"
                                            />
                                        ) : (
                                            <span className="ml-1">{clientDetails.phone || 'Not Specified'}</span>
                                        )}
                        </div>
                                    <div>
                                        <strong>Email:</strong> 
                                        {isEditingClientDetails ? (
                                            <input 
                                                type="email" 
                                                value={clientDetails.email || ''} 
                                                onChange={(e) => handleClientDetailsChange('email', e.target.value)}
                                                className="ml-2 px-2 py-1 border rounded w-full max-w-xs"
                                                placeholder="Enter email address"
                                            />
                                        ) : (
                                            <span className="ml-1">{clientDetails.email || 'Not Specified'}</span>
                                        )}
                                    </div>
                                    <div>
                                        <strong>Address:</strong> 
                                        {isEditingClientDetails ? (
                                            <textarea 
                                                value={clientDetails.address || ''} 
                                                onChange={(e) => handleClientDetailsChange('address', e.target.value)}
                                                className="ml-2 px-2 py-1 border rounded w-full max-w-xs h-16 resize-none"
                                                placeholder="Enter address"
                                            />
                                        ) : (
                                            <span className="ml-1">{clientDetails.address || 'Not Specified'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {message.text && <div className={`p-4 mb-4 text-sm rounded-lg ${message.type === 'error' ? 'text-red-800 bg-red-50' : 'text-green-800 bg-green-50'}`}>{message.text}</div>}
            
            {searchResults.map((item, index) => {
                const itemKey = item['SSR Item No.'];
                const unitInfo = getUnitInfo(item['Unit']);
                const totalQuantity = calculateTotalCostForItem(item) / (parseFloat(editableRates[itemKey] ?? item['Completed Rate for 2022-23 excluding GST In Rs.']) || 1);

                return (
                    <div key={itemKey} className="relative p-4 my-4 bg-white rounded-lg shadow-md overflow-x-auto">
                        <button 
                            onClick={() => handleRemoveItem(itemKey)}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center font-bold text-lg hover:bg-red-600 transition-colors"
                            aria-label="Remove Item"
                        >
                            &times;
                        </button>
                        <h3 className="text-lg font-semibold mb-2 text-gray-900">
                            ({index + 1}) {itemKey}: {
                                itemKey.startsWith('EMPTY-') ? 
                                <input 
                                    type="text" 
                                    value={item['Description of the item']} 
                                    onChange={(e) => handleDescriptionChange(itemKey, e.target.value)}
                                    className="border-b border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0 w-1/2"
                                /> : 
                                item['Description of the item']
                            }
                        </h3>
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-2 py-2">No</th>
                                    <th className="px-4 py-2">Remarks</th>
                                    <th className="px-4 py-2">Nos</th>
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
                            <tbody className="text-gray-800">
                                {(inputData[itemKey] || []).map((row, rowIndex) => (
                                    <tr key={rowIndex} className="bg-white border-b text-center">
                                        <td className="py-2">{rowIndex + 1}</td>
                                        <td><input type="text" id={`input-${itemKey}-${rowIndex}-comment`} onKeyDown={(e) => handleKeyDown(e, itemKey, rowIndex, 'comment')} value={row.comment} onChange={(e) => handleInputChange(e, itemKey, rowIndex, 'comment')} placeholder="Add a note..." className="w-48 p-1 border rounded text-center" /></td>
                                        <td><input type="number" id={`input-${itemKey}-${rowIndex}-nos`} onKeyDown={(e) => handleKeyDown(e, itemKey, rowIndex, 'nos')} value={row.nos} onChange={(e) => handleInputChange(e, itemKey, rowIndex, 'nos')} className="w-16 p-1 border rounded text-center" /></td>
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
                        {selectedGroup && 
                            <select 
                                size="8" 
                                value={selectedItemNo} 
                                onChange={(e) => setSelectedItemNo(e.target.value)} 
                                className="w-full p-2 border rounded shadow-sm"
                            >
                                {groupedData[selectedGroup].map(item => (
                                    <option 
                                        key={item['SSR Item No.']} 
                                        value={String(item['SSR Item No.']).trim()}
                                        // --- **MODIFIED** The title attribute is added here ---
                                        title={`${item['SSR Item No.']} - ${item['Description of the item']}`}
                                    >
                                        {`${item['SSR Item No.']} - ${item['Description of the item']}`}
                                    </option>
                                ))}
                            </select>
                        }
                        <button onClick={handleAddItemByDropdown} disabled={!selectedItemNo} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-sm disabled:opacity-50">Add Selected Item</button>
                    </div>
                    <div className="flex flex-col justify-center items-center h-full">
                        <div className="flex items-center w-full"><hr className="flex-grow"/><span className="mx-4 text-gray-500">OR</span><hr className="flex-grow"/></div>
                        <div className="w-full mt-4 flex items-center space-x-4">
                            <input type="text" placeholder="Enter SSR Item No." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 p-2 border rounded shadow-sm" />
                            <button onClick={handleAddItemByNumber} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-sm">Add</button>
                        </div>
                        <div className="w-full mt-2 flex justify-center">
                            <button onClick={handleAddEmptyCard} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-sm">Empty Card</button>
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

            {/* Save Report Button */}
            {searchResults.length > 0 && (
                <div className="flex justify-center my-8">
                    <button 
                        onClick={handleSaveReport}
                        disabled={isProcessing}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Saving...' : '💾 Save Report & Go to Reports'}
                    </button>
                </div>
            )}
            </div>
        </div>
    );
};

export default EstimatorPage;