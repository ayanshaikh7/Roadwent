import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ProfessionalReportView = ({ report }) => {
  if (!report) return null;

  // Helpers adapted to estimator logic
  const getUnitInfo = (unit) => {
    const u = (unit || '').toString().trim().toLowerCase();
    if (['cubic', 'cum'].some(kw => u.includes(kw))) return { type: 'dimensional', params: ['Length', 'Breadth', 'Depth'] };
    if (['square', 'sqm', 'acre'].some(kw => u.includes(kw))) return { type: 'dimensional', params: ['Length', 'Breadth'] };
    if (['kilometre', 'kilometer', 'running', 'metre', 'meter', 'span'].some(kw => u.includes(kw))) {
      if (!u.includes('square') && !u.includes('cubic')) return { type: 'dimensional', params: ['Length'] };
    }
    if (['tonne', 'kilogram', 'kg'].some(kw => u.includes(kw))) return { type: 'single', param: 'Mass' };
    if (['litre', 'liter'].some(kw => u.includes(kw))) return { type: 'single', param: 'Volume' };
    if (['number', 'no', 'pouch', 'bearing'].some(kw => u.includes(kw))) return { type: 'single', param: 'Count' };
    if (['day', 'test', 'shift', 'hour'].some(kw => u.includes(kw))) return { type: 'single', param: 'Time/Frequency' };
    if (['site', 'report'].some(kw => u.includes(kw))) return { type: 'single', param: 'Reference' };
    return { type: 'single', param: 'Quantity' };
  };

  const computeTotalsFromEstimator = () => {
    const items = report.items || report.searchResults || [];
    const inputData = report.inputData || {};
    const editableRates = report.editableRates || {};
    const rows = [];
    let sum = 0;
    items.forEach((it, idx) => {
      const itemKey = String(it['SSR Item No.'] ?? it.itemKey ?? idx).trim();
      const unitInfo = getUnitInfo(it['Unit']);
      const rate = parseFloat(editableRates[itemKey] ?? it['Completed Rate for 2022-23 excluding GST In Rs.'] ?? it.rate ?? 0) || 0;
      const itemInputRows = inputData[itemKey] || [];
      const totalQuantity = itemInputRows.reduce((acc, row) => {
        const length = parseFloat(row.length) || 0;
        const breadth = parseFloat(row.breadth) || 0;
        const depth = parseFloat(row.depth) || 0;
        const nos = parseFloat(row.nos) || 1;
        if (unitInfo.type === 'dimensional') {
          if (unitInfo.params.length === 3) return acc + (nos * length * breadth * depth);
          if (unitInfo.params.length === 2) return acc + (nos * length * breadth);
          if (unitInfo.params.length === 1) return acc + (nos * length);
        }
        const qty = parseFloat(row.quantity) || 0;
        return acc + (nos * qty);
      }, 0);
      const amount = totalQuantity * rate;
      sum += amount;
      rows.push({
        idx: idx + 1,
        description: it.description || it['Description of the item'] || 'Item',
        qty: totalQuantity,
        unit: it.unit || it['Unit'] || '',
        rate,
        amount
      });
    });
    return { rows, sum };
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Cost Estimation Report', 105, 15, { align: 'center' });
    
    // Add report info (using the canonical field names from the entry forms)
    const p = report.projectDetails || {};
    const c = report.clientDetails || {};
    const projName = p.projectName || report.projectName || report.title || 'Untitled Project';
    const created = report.createdAt ? new Date(report.createdAt) : new Date();
    const fmt = (d) => {
      if (!d) return 'Not specified';
      const dt = new Date(d);
      return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString();
    };

    doc.setFontSize(10);
    // Project column (left)
    doc.setFont('helvetica', 'bold');
    doc.text('Project Details', 20, 28);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${projName}`, 20, 35);
    doc.text(`Manager: ${p.projectManager || 'Not specified'}`, 20, 41);
    doc.text(`Start: ${fmt(p.startDate)}`, 20, 47);
    doc.text(`End: ${fmt(p.endDate)}`, 20, 53);
    doc.text(`Date: ${created.toLocaleDateString()}`, 20, 59);
    // Client column (right)
    doc.setFont('helvetica', 'bold');
    doc.text('Client Details', 120, 28);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${c.clientName || 'Not specified'}`, 120, 35);
    doc.text(`Company: ${c.companyName || 'Not specified'}`, 120, 41);
    doc.text(`Phone: ${c.phone || 'Not specified'}`, 120, 47);
    doc.text(`Email: ${c.email || 'Not specified'}`, 120, 53);
    doc.text(doc.splitTextToSize(`Address: ${c.address || 'Not specified'}`, 75), 120, 59);

    // Add summary data
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Cost Summary', 20, 72);
    doc.setFont('helvetica', 'normal');

    const tableData = [];
    // Prefer estimator-derived totals when inputData present
    const estimatorCalc = report.inputData ? computeTotalsFromEstimator() : { rows: [], sum: 0 };
    const computedTotal = estimatorCalc.sum || (
      Array.isArray(report.items)
        ? report.items.reduce((sum, item) => (sum + ((Number(item?.quantity)||0) * (Number(item?.rate)||0))), 0)
        : 0
    );
    const totalCost = (typeof report.grandTotalCost === 'number' && !Number.isNaN(report.grandTotalCost))
      ? report.grandTotalCost
      : (report.estimatedCost != null && !Number.isNaN(Number(report.estimatedCost))
        ? Number(report.estimatedCost)
        : computedTotal);
    tableData.push(['Items Count', Array.isArray(report.items) ? String(report.items.length) : '0']);
    
    // NOTE: jsPDF's standard font can't render the ₹ glyph (it corrupts the whole
    // string), so use an ASCII "Rs." prefix in the PDF. en-IN gives ASCII grouping.
    tableData.push(['Total Estimated Cost', `Rs. ${Number(totalCost || 0).toLocaleString('en-IN')}`]);
    
    // Generate table
    autoTable(doc, {
      startY: 78,
      head: [['Metric', 'Value']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [66, 66, 66] }
    });
    
    // Add items table if available
    let yPos = doc.lastAutoTable.finalY + 20;
    const itemsForView = report.inputData ? estimatorCalc.rows : (Array.isArray(report.items) ? report.items.map((it, idx) => ({
      idx: idx + 1,
      description: it.description || it['Description of the item'] || 'Item',
      qty: Number(it.quantity || 0),
      unit: it.unit || '',
      rate: Number(it.rate || 0),
      amount: Number(it.quantity || 0) * Number(it.rate || 0)
    })) : []);
    if (itemsForView.length > 0) {
      doc.setFontSize(14);
      doc.text('Items', 20, yPos);
      yPos += 5;
      const itemsBody = itemsForView.map(it => [
        it.idx,
        it.description,
        String(Number(it.qty || 0).toFixed(2)),
        String(it.unit || ''),
        String(Number(it.rate || 0).toFixed(2)),
        String(Number(it.amount || 0).toFixed(2))
      ]);
      autoTable(doc, {
        startY: yPos + 5,
        head: [['#', 'Description', 'Qty', 'Unit', 'Rate', 'Amount']],
        body: itemsBody,
        foot: [['', 'TOTAL', '', '', '', `Rs. ${Number(totalCost || 0).toLocaleString('en-IN')}`]],
        theme: 'grid',
        headStyles: { fillColor: [66, 133, 244] },
        footStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: 'bold' }
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }
    
    // Add notes if available
    if (report.notes) {
      doc.setFontSize(14);
      doc.text('Notes', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      const splitNotes = doc.splitTextToSize(report.notes, 170);
      doc.text(splitNotes, 20, yPos);
    }
    
    // Save the PDF with robust fallback
    const safeProj = String(projName || 'estimate').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 100).trim() || 'estimate';
    const filename = `${safeProj}-report.pdf`;
    try {
      const maybePromise = doc.save(filename, { returnPromise: true });
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.catch(() => {
          const blob = doc.output('blob');
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          // Safari fallback: open in new tab if download attr is ignored
          const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          if (isSafari) {
            window.open(url, '_blank');
          }
          URL.revokeObjectURL(url);
        });
      }
    } catch (e) {
      try {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        if (isSafari) {
          window.open(url, '_blank');
        }
        URL.revokeObjectURL(url);
      } catch (_) {
        try { window.dispatchEvent(new CustomEvent('app:toast', { detail: 'Failed to generate PDF' })); } catch {}
      }
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-4xl mx-auto my-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {report.projectDetails?.projectName || report.projectName || report.title || 'Untitled Project'}
        </h1>
        <button
          type="button"
          onClick={generatePDF}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Download PDF
        </button>
      </div>
      
      <div className="mb-6">
        <p className="text-gray-600">
          <span className="font-semibold">Date:</span> {(report.createdAt ? new Date(report.createdAt) : new Date()).toLocaleDateString()}
        </p>
        {(report.projectDetails?.projectLocation || report.location) && (
          <p className="text-gray-600">
            <span className="font-semibold">Location:</span> {report.projectDetails?.projectLocation || report.location}
          </p>
        )}
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Cost Summary</h2>
        <div className="space-y-2">
          <div className="border-t pt-2 mt-2 flex justify-between font-bold">
            <span>Total Estimated Cost</span>
            <span>₹{(() => {
              const computed = Array.isArray(report.items)
                ? report.items.reduce((sum, it) => (sum + (Number(it?.quantity||0) * Number(it?.rate||0))), 0)
                : 0;
              const val = (typeof report.grandTotalCost === 'number' && !Number.isNaN(report.grandTotalCost))
                ? report.grandTotalCost
                : (report.estimatedCost != null && !Number.isNaN(Number(report.estimatedCost)) ? Number(report.estimatedCost) : computed);
              return Number(val || 0).toLocaleString();
            })()}</span>
          </div>
        </div>
      </div>
      {(() => {
        const itemsForView = report.inputData ? computeTotalsFromEstimator().rows : (Array.isArray(report.items) ? report.items.map((it, idx) => ({
          idx: idx + 1,
          description: it.description || it['Description of the item'] || 'Item',
          qty: Number(it.quantity || 0),
          unit: it.unit || '',
          rate: Number(it.rate || 0),
          amount: Number(it.quantity || 0) * Number(it.rate || 0)
        })) : []);
        return itemsForView.length > 0 ? (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-left">Unit</th>
                  <th className="px-3 py-2 text-right">Rate</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {itemsForView.map((it) => (
                  <tr key={it.idx} className="border-b">
                    <td className="px-3 py-2">{it.idx}</td>
                    <td className="px-3 py-2">{it.description}</td>
                    <td className="px-3 py-2 text-right">{Number(it.qty || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-left">{it.unit || ''}</td>
                    <td className="px-3 py-2 text-right">{Number(it.rate || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{Number(it.amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        ) : null;
      })()}
      
      {report.notes && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Notes</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="whitespace-pre-wrap">{report.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalReportView;