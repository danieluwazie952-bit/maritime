const router  = require('express').Router();
const path    = require('path');
const fs      = require('fs');
const Payment  = require('../models/Payment');
const Settings = require('../models/Settings');
const { authenticate, authorize } = require('../middleware/auth');
const { generateReceipt }         = require('../utils/pdf');
const { sendEmail, templates }    = require('../utils/email');

// ── GET /api/payments ─────────────────────────────────────────────────────────
// Return the student's payment history + current fee amounts
router.get('/', authenticate, authorize('student'), async (req, res, next) => {
  try {
    const [payments, settings] = await Promise.all([
      Payment.find({ student: req.user._id }).sort('-createdAt'),
      Settings.getOrCreate(),
    ]);
    res.json({ success: true, payments, amounts: settings.paymentAmounts, session: settings.academicSession });
  } catch (err) { next(err); }
});

// ── POST /api/payments/initiate ───────────────────────────────────────────────
// Create a pending payment record and return Flutterwave config for the frontend
router.post('/initiate', authenticate, authorize('student'), async (req, res, next) => {
  try {
    const { type } = req.body;
    const validTypes = Object.keys(Payment.PAYMENT_TYPES);
    if (!validTypes.includes(type))
      return res.status(400).json({ success: false, message: 'Invalid payment type' });

    // Prevent duplicate successful payment
    const existing = await Payment.findOne({ student: req.user._id, type, status: 'success' });
    if (existing)
      return res.status(400).json({ success: false, message: `${Payment.PAYMENT_TYPES[type]} has already been paid` });

    const settings = await Settings.getOrCreate();
    const amount   = settings.paymentAmounts[type];
    const label    = Payment.PAYMENT_TYPES[type];
    const txRef    = `maritime-${type}-${req.user._id}-${Date.now()}`;

    await Payment.create({ student: req.user._id, type, label, amount, txRef, status: 'pending' });

    res.json({
      success: true,
      publicKey:     process.env.FLUTTERWAVE_PUBLIC_KEY,
      txRef, amount, currency: 'NGN', label,
      customerEmail: req.user.email,
      customerName:  req.user.fullName,
      customerPhone: req.user.phone || '',
    });
  } catch (err) { next(err); }
});

// ── POST /api/payments/verify ─────────────────────────────────────────────────
// Called by frontend after Flutterwave inline callback
router.post('/verify', authenticate, authorize('student'), async (req, res, next) => {
  try {
    const { transaction_id, tx_ref } = req.body;

    // Verify transaction with Flutterwave SDK
    const Flutterwave = require('flutterwave-node-v3');
    const flw = new Flutterwave(process.env.FLUTTERWAVE_PUBLIC_KEY, process.env.FLUTTERWAVE_SECRET_KEY);
    const response = await flw.Transaction.verify({ id: String(transaction_id) });

    if (response.data?.status !== 'successful') {
      await Payment.findOneAndUpdate({ txRef: tx_ref }, { status: 'failed' });
      return res.status(400).json({ success: false, message: 'Payment not verified by Flutterwave' });
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { txRef: tx_ref },
      { status: 'success', flwRef: response.data.flw_ref, transactionId: String(transaction_id), paidAt: new Date() },
      { new: true }
    );
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    // Generate PDF receipt
    const receiptBuffer = await generateReceipt({
      studentName:  req.user.fullName,
      email:        req.user.email,
      paymentLabel: payment.label,
      amount:       payment.amount,
      txRef:        tx_ref,
      flwRef:       response.data.flw_ref,
      date:         new Date(),
    });

    const receiptFilename = `receipt-${tx_ref}.pdf`;
    const receiptPath     = path.join(__dirname, '../../uploads', receiptFilename);
    fs.writeFileSync(receiptPath, receiptBuffer);

    const receiptUrl = `/uploads/${receiptFilename}`;
    await Payment.findByIdAndUpdate(payment._id, { receiptPath, receiptUrl });

    // Email receipt to student
    await sendEmail({
      to:      req.user.email,
      subject: `Payment Receipt – ${payment.label}`,
      html:    templates.paymentReceipt(req.user.fullName, payment.label, payment.amount, tx_ref),
      attachments: [{ filename: receiptFilename, content: receiptBuffer, contentType: 'application/pdf' }],
    });

    res.json({ success: true, message: 'Payment verified! Receipt sent to your email.', receiptUrl });
  } catch (err) { next(err); }
});

module.exports = router;
