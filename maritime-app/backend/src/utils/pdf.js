const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * Generate a styled PDF payment receipt.
 * Returns a Buffer containing the PDF bytes.
 */
const generateReceipt = async ({ studentName, email, paymentLabel, amount, txRef, flwRef, date }) => {
  const pdfDoc = await PDFDocument.create();
  const page   = pdfDoc.addPage([595, 460]); // A4-ish landscape-ish
  const { width, height } = page.getSize();

  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // ── Blue header band ────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 85, width, height: 85, color: rgb(0.114, 0.306, 0.847) });

  page.drawText('DEPARTMENT OF MARITIME TRANSPORT & LOGISTICS', {
    x: 40, y: height - 38, size: 12, font: bold, color: rgb(1, 1, 1),
  });
  page.drawText('OFFICIAL PAYMENT RECEIPT', {
    x: 40, y: height - 58, size: 9, font: regular, color: rgb(0.8, 0.9, 1),
  });
  page.drawText(`Date: ${new Date(date).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}`, {
    x: width - 200, y: height - 58, size: 9, font: regular, color: rgb(0.8, 0.9, 1),
  });

  // ── Receipt rows ────────────────────────────────────────────────────────────
  const rows = [
    ['Student Name',    studentName],
    ['Email Address',   email],
    ['Payment Type',    paymentLabel],
    ['Amount Paid',     `NGN ${Number(amount).toLocaleString()}.00`],
    ['Transaction Ref', txRef],
    ['Flutterwave Ref', flwRef || 'N/A'],
    ['Status',          'SUCCESSFUL'],
  ];

  rows.forEach(([label, value], i) => {
    const y = height - 130 - i * 38;
    if (i % 2 === 0) {
      page.drawRectangle({ x: 40, y: y - 10, width: width - 80, height: 34, color: rgb(0.96, 0.97, 1) });
    }
    page.drawText(label + ':', { x: 56,  y: y + 6, size: 10, font: bold,    color: rgb(0.08, 0.1, 0.15) });
    page.drawText(String(value), { x: 250, y: y + 6, size: 10, font: regular, color: rgb(0.2,  0.2, 0.2)  });
  });

  // ── Footer ──────────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: 40, y: 55 }, end: { x: width - 40, y: 55 }, thickness: 0.8, color: rgb(0.85, 0.85, 0.85) });
  page.drawText('This is a computer-generated receipt and requires no physical signature.', {
    x: 40, y: 38, size: 8, font: regular, color: rgb(0.55, 0.55, 0.55),
  });
  page.drawText('Department of Maritime Transport and Logistics', {
    x: 40, y: 22, size: 8, font: regular, color: rgb(0.55, 0.55, 0.55),
  });

  return Buffer.from(await pdfDoc.save());
};

/**
 * Extract raw text from a PDF buffer using pdf-parse.
 * Uses require() inside the function to avoid the test-file loading issue.
 */
const extractPdfText = async (buffer) => {
  try {
    // pdf-parse has a known ESM issue; require() inside function avoids it
    const pdfParse = require('pdf-parse'); // eslint-disable-line
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (err) {
    console.error('PDF parse error:', err.message);
    return '';
  }
};

/**
 * Parse raw PDF text and try to extract common student profile fields.
 * Returns an object with whatever fields could be found.
 */
const extractProfileFields = (text) => {
  if (!text) return {};
  const get = (...patterns) => {
    for (const p of patterns) {
      const m = text.match(p);
      if (m?.[1]) return m[1].trim().replace(/\s+/g, ' ');
    }
    return null;
  };
  return {
    fullName:      get(/(?:student['']?s?\s*)?(?:full\s*)?name[:\s]+([A-Za-z ]{3,60})/i),
    matricNumber:  get(/matric(?:ulation)?\s*(?:no|number|#)?[:\s]+([A-Z0-9\/\-]{4,20})/i),
    jambRegNumber: get(/jamb\s*(?:reg(?:istration)?)?\s*(?:no|number|#)?[:\s]+([A-Z0-9]{8,15})/i),
    department:    get(/(?:department|programme|program)[:\s]+([A-Za-z &]{3,60})/i),
    level:         get(/level[:\s]+(\d{3})/i, /(\d{3})\s*level/i),
    stateOfOrigin: get(/state\s*of\s*origin[:\s]+([A-Za-z ]{3,30})/i),
    phone:         get(/(?:phone|mobile|tel(?:ephone)?)[:\s]+([\d+\- ]{7,15})/i),
  };
};

module.exports = { generateReceipt, extractPdfText, extractProfileFields };
