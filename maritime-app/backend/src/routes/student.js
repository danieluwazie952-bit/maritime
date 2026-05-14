const router = require('express').Router();
const fs     = require('fs');
const User     = require('../models/User');
const Document = require('../models/Document');
const upload   = require('../middleware/upload');
const { authenticate, authorize } = require('../middleware/auth');
const { extractPdfText, extractProfileFields } = require('../utils/pdf');

// ── GET /api/student/profile ──────────────────────────────────────────────────
router.get('/profile', authenticate, authorize('student'), async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});

// ── GET /api/student/documents ────────────────────────────────────────────────
router.get('/documents', authenticate, authorize('student'), async (req, res) => {
  const docs = await Document.find({ student: req.user._id }).sort('-createdAt');
  res.json({ success: true, documents: docs });
});

// ── POST /api/student/upload ──────────────────────────────────────────────────
// General document upload (course forms, receipts, etc.)
router.post('/upload', authenticate, authorize('student'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { name, category } = req.body;

    const doc = await Document.create({
      student:      req.user._id,
      name:         name || req.file.originalname,
      originalName: req.file.originalname,
      filePath:     req.file.path,
      fileUrl:      `/uploads/${req.file.filename}`,
      fileType:     req.file.mimetype,
      size:         req.file.size,
      category:     category || 'other',
    });

    res.status(201).json({ success: true, document: doc });
  } catch (err) { next(err); }
});

// ── POST /api/student/upload-onboarding ──────────────────────────────────────
// Upload a named 100-level onboarding item
router.post('/upload-onboarding', authenticate, authorize('student'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { itemName } = req.body;
    if (!itemName)      return res.status(400).json({ success: false, message: 'itemName is required' });

    const doc = await Document.create({
      student:      req.user._id,
      name:         itemName,
      originalName: req.file.originalname,
      filePath:     req.file.path,
      fileUrl:      `/uploads/${req.file.filename}`,
      fileType:     req.file.mimetype,
      size:         req.file.size,
      category:     'onboarding',
    });

    // Mark onboarding item as uploaded in the user record
    const user  = await User.findById(req.user._id);
    const item  = user.onboarding.find((i) => i.name === itemName);
    if (item) {
      item.status     = 'uploaded';
      item.documentId = doc._id;
      item.uploadedAt = new Date();
      await user.save();
    }

    res.json({ success: true, document: doc, onboarding: user.onboarding });
  } catch (err) { next(err); }
});

// ── POST /api/student/extract-pdf ─────────────────────────────────────────────
// Upload a PDF and auto-populate student profile from its text
router.post('/extract-pdf', authenticate, authorize('student'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file)                                   return res.status(400).json({ success: false, message: 'No file uploaded' });
    if (req.file.mimetype !== 'application/pdf')     return res.status(400).json({ success: false, message: 'Please upload a PDF file' });

    const buffer = fs.readFileSync(req.file.path);
    const text   = await extractPdfText(buffer);
    const fields = extractProfileFields(text);

    // Build safe update (admin-editable fields are excluded)
    const update = { profileData: fields };
    if (fields.fullName)      update.fullName      = fields.fullName;
    if (fields.department)    update.department    = fields.department;
    if (fields.stateOfOrigin) update.stateOfOrigin = fields.stateOfOrigin;
    if (fields.phone)         update.phone         = fields.phone;
    if (fields.level)         update.level         = fields.level;
    // matricNumber / jambRegNumber intentionally excluded — admin-only

    await User.findByIdAndUpdate(req.user._id, update);

    res.json({ success: true, extracted: fields, message: 'Profile updated from PDF' });
  } catch (err) { next(err); }
});

module.exports = router;
