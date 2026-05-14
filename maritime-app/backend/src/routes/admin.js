const router   = require('express').Router();
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const Payment  = require('../models/Payment');
const Document = require('../models/Document');
const Settings = require('../models/Settings');
const { authenticate, authorize } = require('../middleware/auth');

// ── Super-admin JWT check (no DB user required) ───────────────────────────────
const superOnly = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'super_admin') return res.status(403).json({ success: false, message: 'Forbidden' });
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [totalStudents, verifiedStudents, successPayments, totalDocs, recentStudents] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', isVerified: true }),
      Payment.countDocuments({ status: 'success' }),
      Document.countDocuments(),
      User.find({ role: 'student' }).select('-password').sort('-createdAt').limit(5),
    ]);
    res.json({ success: true, stats: { totalStudents, verifiedStudents, successPayments, totalDocs }, recentStudents });
  } catch (err) { next(err); }
});

// ── GET /api/admin/students ───────────────────────────────────────────────────
router.get('/students', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const students    = await User.find({ role: 'student' }).select('-password').sort('-createdAt');
    const allPayments = await Payment.find({ status: 'success' });
    const allDocs     = await Document.find().select('student category');

    const enriched = students.map((s) => {
      const id = s._id.toString();
      return {
        ...s.toObject(),
        payments:      allPayments.filter((p) => p.student.toString() === id),
        documentCount: allDocs.filter((d) => d.student.toString() === id).length,
      };
    });
    res.json({ success: true, students: enriched });
  } catch (err) { next(err); }
});

// ── GET /api/admin/students/:id ───────────────────────────────────────────────
router.get('/students/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    if (!student || student.role !== 'student')
      return res.status(404).json({ success: false, message: 'Student not found' });

    const [payments, documents] = await Promise.all([
      Payment.find({ student: req.params.id }).sort('-createdAt'),
      Document.find({ student: req.params.id }).sort('-createdAt'),
    ]);
    res.json({ success: true, student, payments, documents });
  } catch (err) { next(err); }
});

// ── PUT /api/admin/students/:id/matric ────────────────────────────────────────
// Admin edits matric / JAMB number
router.put('/students/:id/matric', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { matricNumber, jambRegNumber } = req.body;
    const student = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { matricNumber, jambRegNumber } },
      { new: true }
    ).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (err) { next(err); }
});

// ── GET /api/admin/settings (super admin only) ────────────────────────────────
router.get('/settings', superOnly, async (req, res, next) => {
  try {
    const settings = await Settings.getOrCreate();
    res.json({ success: true, settings });
  } catch (err) { next(err); }
});

// ── PUT /api/admin/settings (super admin only) ────────────────────────────────
router.put('/settings', superOnly, async (req, res, next) => {
  try {
    const settings = await Settings.getOrCreate();
    if (req.body.paymentAmounts)  Object.assign(settings.paymentAmounts,  req.body.paymentAmounts);
    if (req.body.academicSession) settings.academicSession = req.body.academicSession;
    if (req.body.paymentDueDates) Object.assign(settings.paymentDueDates, req.body.paymentDueDates);
    settings.markModified('paymentAmounts');
    settings.markModified('paymentDueDates');
    await settings.save();
    res.json({ success: true, settings });
  } catch (err) { next(err); }
});

module.exports = router;
