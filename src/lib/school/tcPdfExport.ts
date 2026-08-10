/**
 * Transfer Certificate (TC) Printable & Downloadable Generator
 */

export function generateTcHtml(exitRecord: any, instituteName: string = 'EDDVA INTERNATIONAL SCHOOL') {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Transfer Certificate - ${exitRecord.studentName}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Georgia', 'Times New Roman', serif; color: #1e293b; margin: 0; padding: 20px; background: #fff; }
        .tc-border { border: 4px double #1e3a8a; padding: 24px; position: relative; }
        .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px; }
        .header h1 { font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px; }
        .header p { font-size: 12px; font-weight: bold; color: #475569; margin: 2px 0; }
        .tc-title { text-align: center; margin: 16px 0; }
        .tc-title span { font-size: 18px; font-weight: bold; background: #1e3a8a; color: #fff; padding: 6px 24px; border-radius: 20px; text-transform: uppercase; letter-spacing: 2px; }
        .meta-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 20px; color: #334155; }
        .tc-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
        .tc-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        .tc-table tr:nth-child(even) { background-color: #f8fafc; }
        .label { font-weight: bold; color: #334155; width: 45%; }
        .value { color: #0f172a; font-weight: bold; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; font-weight: bold; }
        .sig-box { text-align: center; width: 180px; border-top: 1px solid #94a3b8; padding-top: 6px; }
        .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; font-weight: bold; color: rgba(30, 58, 138, 0.04); text-transform: uppercase; pointer-events: none; white-space: nowrap; }
      </style>
    </head>
    <body>
      <div class="tc-border">
        <div class="watermark">TRANSFER CERTIFICATE</div>
        <div class="header">
          <h1>${instituteName}</h1>
          <p>Affiliated to Educational Board • Recognized School</p>
          <p>School Code: EDDVA-SCH • Contact: info@eddva.org</p>
        </div>

        <div class="tc-title">
          <span>Transfer Certificate</span>
        </div>

        <div class="meta-row">
          <div>TC No: <strong style="color: #1e3a8a;">${exitRecord.tcNumber || 'TC/2026/001'}</strong></div>
          <div>Admission / Reg No: <strong>${exitRecord.admissionNo || '—'}</strong></div>
          <div>Date of Issue: <strong>${exitRecord.tcIssueDate ? new Date(exitRecord.tcIssueDate).toLocaleDateString('en-IN') : currentDate}</strong></div>
        </div>

        <table class="tc-table">
          <tr><td class="label">1. Name of Student</td><td class="value">${exitRecord.studentName || '—'}</td></tr>
          <tr><td class="label">2. Academic Session</td><td class="value">${exitRecord.academicSession || '—'}</td></tr>
          <tr><td class="label">3. Date of Admission</td><td class="value">${exitRecord.admissionDate ? new Date(exitRecord.admissionDate).toLocaleDateString('en-IN') : '—'}</td></tr>
          <tr><td class="label">4. Date of Leaving School</td><td class="value">${exitRecord.leavingDate ? new Date(exitRecord.leavingDate).toLocaleDateString('en-IN') : currentDate}</td></tr>
          <tr><td class="label">5. Class & Section Last Attended</td><td class="value">${exitRecord.classAndSection || exitRecord.lastClassAttended || '—'}</td></tr>
          <tr><td class="label">6. Examination / Result Status</td><td class="value">${exitRecord.examResultStatus || 'PASSED'}</td></tr>
          <tr><td class="label">7. Reason for Leaving School</td><td class="value">${exitRecord.reasonForLeaving || 'Parent Request / Transfer'}</td></tr>
          <tr><td class="label">8. Next / Destination School</td><td class="value">${exitRecord.destinationSchool || 'Higher Education / Transfer'}</td></tr>
          <tr><td class="label">9. General Conduct & Character</td><td class="value">${exitRecord.conductRemarks || 'Good'}</td></tr>
          <tr><td class="label">10. School Fee Dues Clearance</td><td class="value" style="color: green;">${exitRecord.feeClearanceStatus || 'CLEARED'}</td></tr>
          <tr><td class="label">11. Library & Laboratory Clearance</td><td class="value" style="color: green;">${exitRecord.libraryClearanceStatus || 'CLEARED'}</td></tr>
          <tr><td class="label">12. Transport / Hostel Clearance</td><td class="value">${exitRecord.transportClearanceStatus || 'NOT_APPLICABLE'}</td></tr>
          <tr><td class="label">13. Documents Issued along with TC</td><td class="value">${Array.isArray(exitRecord.documentsIssued) ? exitRecord.documentsIssued.join(', ') : 'TC, Character Certificate, Report Card'}</td></tr>
        </table>

        <div style="font-size: 11px; margin-bottom: 30px; font-style: italic; color: #64748b;">
          Certified that the above information is in accordance with the official records of the institution.
        </div>

        <div class="footer">
          <div class="sig-box">Prepared / Verified By</div>
          <div class="sig-box">Parent / Guardian Signature</div>
          <div class="sig-box">${exitRecord.authorizedSignatoryName || 'Principal'}<br/><small style="font-weight: normal; font-size: 10px;">(Authorized Seal & Signatory)</small></div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function printTransferCertificate(exitRecord: any, instituteName: string = 'EDDVA INTERNATIONAL SCHOOL') {
  const htmlContent = generateTcHtml(exitRecord, instituteName);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
