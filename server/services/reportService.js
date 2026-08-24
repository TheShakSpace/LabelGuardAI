const PDFDocument = require('pdfkit');

function generateInspectionPDF(inspection, stream) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Pipe the doc to the provided stream (can be response or file stream)
  doc.pipe(stream);

  // Header / Title
  doc
    .fillColor('#0f172a')
    .fontSize(24)
    .text('LABELGUARD AI', { align: 'center', bold: true });
  
  doc
    .fontSize(12)
    .fillColor('#475569')
    .text('Legal Metrology Inspection & Enforcement Platform', { align: 'center' })
    .moveDown(1.5);

  // Subtitle banner
  doc
    .rect(50, doc.y, 495, 3)
    .fill('#1e3a8a')
    .moveDown(1);

  doc
    .fillColor('#1e293b')
    .fontSize(16)
    .text('LEGAL METROLOGY INSPECTION REPORT', { bold: true })
    .moveDown(0.5);

  // Metadata Table Info
  doc.fontSize(10).fillColor('#334155');
  const metadataY = doc.y;
  doc.text(`Inspection ID: ${inspection.inspectionId}`, 50, metadataY, { bold: true });
  doc.text(`Date / Time: ${new Date(inspection.createdAt).toLocaleString()}`, 300, metadataY);
  doc.text(`Inspector Name: ${inspection.inspector}`, 50, metadataY + 15);
  doc.text(`Status: ${inspection.status}`, 300, metadataY + 15, { bold: true });
  doc.text(`Compliance Score: ${inspection.score}/100`, 50, metadataY + 30, { bold: true });
  doc.text(`Product Category: ${inspection.category}`, 300, metadataY + 30);
  
  doc.moveDown(4);

  // Product & Company Information
  doc
    .fontSize(12)
    .fillColor('#1e3a8a')
    .text('Product & Manufacturer Information', { bold: true })
    .moveDown(0.5);

  doc.fontSize(10).fillColor('#334155');
  doc.text(`Product Name: ${inspection.product}`);
  doc.text(`Brand Name: ${inspection.declarations?.productName?.value || 'N/A'}`);
  doc.text(`Company / Manufacturer Name: ${inspection.company}`);
  doc.text(`Manufacturer Address: ${inspection.declarations?.manufacturerAddress?.value || 'N/A'}`);
  doc.moveDown(1.5);

  // Compliance Checks
  doc
    .fontSize(12)
    .fillColor('#1e3a8a')
    .text('Compliance Verification Details', { bold: true })
    .moveDown(0.5);

  if (inspection.checks && inspection.checks.length > 0) {
    inspection.checks.forEach(check => {
      const fieldTitle = check.field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      const statusColor = check.status === 'PASS' ? '#16a34a' : (check.status === 'WARNING' ? '#d97706' : '#dc2626');
      
      doc.fillColor('#1e293b').fontSize(10).text(`${fieldTitle}: `, { bold: true, continued: true });
      doc.fillColor(statusColor).text(`${check.status} `, { bold: true, continued: true });
      doc.fillColor('#64748b').fontSize(9).text(`(${check.ruleId})`);
      doc.fillColor('#475569').fontSize(9.5).text(`Reason: ${check.reason}`).moveDown(0.3);
    });
  } else {
    doc.text('No checks executed.');
  }

  doc.moveDown(1);

  // Violations Summary
  if (inspection.violations && inspection.violations.length > 0) {
    doc
      .fontSize(12)
      .fillColor('#dc2626')
      .text('Detected Violations', { bold: true })
      .moveDown(0.5);

    inspection.violations.forEach((v, index) => {
      doc
        .fontSize(9.5)
        .fillColor('#7f1d1d')
        .text(`${index + 1}. [Rule: ${v.ruleId}] In ${v.field}: ${v.reason}`)
        .moveDown(0.2);
    });
  } else {
    doc
      .fontSize(12)
      .fillColor('#16a34a')
      .text('Violations: No violations detected.', { bold: true })
      .moveDown(0.5);
  }

  doc.moveDown(1.5);

  // Notes
  if (inspection.notes) {
    doc
      .fontSize(12)
      .fillColor('#1e3a8a')
      .text('Inspector Notes', { bold: true })
      .moveDown(0.5);
    doc.fontSize(10).fillColor('#334155').text(inspection.notes).moveDown(1.5);
  }

  // Footer Disclaimer
  doc
    .rect(50, 720, 495, 1)
    .fill('#cbd5e1');

  doc
    .fontSize(8.5)
    .fillColor('#64748b')
    .text(
      'Disclaimer: This report is an AI-assisted inspection aid. Final enforcement decisions remain with the authorized authority under Legal Metrology Rules, 2011.',
      50,
      730,
      { align: 'center', width: 495 }
    );

  doc.end();
}

module.exports = { generateInspectionPDF };
