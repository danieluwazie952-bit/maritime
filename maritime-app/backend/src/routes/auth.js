const router  = require('express').Router();
const crypto  = require('crypto');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { signToken, authenticate } = require('../middleware/auth');
const { sendEmail, templates }    = require('../utils/email');

const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { fullName, email, password, matricNumber, jambRegNumber, level, phone } = req.body;

    if (!fullName || !email || !password)
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required' });

    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ success: false, message: 'Email is already registered' });

    const rawToken = crypto.randomBytes(32).toString('hex');

    await User.create({
      fullName, email, password, phone,
      matricNumber, jambRegNumber,
      level: level || '100',
      verificationToken:   hashToken(rawToken),
      verificationExpires: Date.now() + 24 * 60 * 60 * 1000,
    });

    const link = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;
    await sendEmail({
      to: email,
      subject: 'Verify Your Email – Maritime Department',
      html: templates.verification(fullName, link),
    });

    res.status(201).json({ success: true, message: 'Registration successful! Check your email to verify your account.' });
  } catch (err) { next(err); }
});

// ── GET /api/auth/verify/:token ───────────────────────────────────────────────
router.get('/verify/:token', async (req, res, next) => {
  try {
    const hashed = hashToken(req.params.token);
    const user   = await User.findOne({
      verificationToken:   hashed,
      verificationExpires: { $gt: Date.now() },
    }).select('+verificationToken +verificationExpires');

    if (!user) return res.status(400).json({ success: false, message: 'Verification link is invalid or has expired' });

    user.isVerified          = true;
    user.verificationToken   = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified! You can now log in.' });
  } catch (err) { next(err); }
});

// ── POST /api/auth/login (student) ────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase(), role: 'student' }).select('+password');

    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (!user.isVerified)
      return res.status(401).json({ success: false, message: 'Please verify your email before logging in' });

    const token = signToken(user._id, user.role);
    res.json({
      success: true, token,
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, level: user.level },
    });
  } catch (err) { next(err); }
});

// ── POST /api/auth/admin-login ────────────────────────────────────────────────
router.post('/admin-login', async (req, res, next) => {
  try {
    const { email, password, accessKey } = req.body;

    if (accessKey !== process.env.ADMIN_ACCESS_KEY)
      return res.status(401).json({ success: false, message: 'Invalid department access key' });

    const user = await User.findOne({ email: email?.toLowerCase(), role: 'admin' }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });

    const token = signToken(user._id, user.role);
    res.json({
      success: true, token,
      user: { id: user._id, fullName: user.fullName, email: user.email, role: 'admin' },
    });
  } catch (err) { next(err); }
});

// ── POST /api/auth/super-login ────────────────────────────────────────────────
router.post('/super-login', (req, res) => {
  if (req.body.password !== process.env.SUPER_ADMIN_PASSWORD)
    return res.status(401).json({ success: false, message: 'Invalid password' });

  const token = jwt.sign({ role: 'super_admin' }, process.env.JWT_SECRET, { expiresIn: '4h' });
  res.json({ success: true, token, user: { role: 'super_admin' } });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  if (req.user.role === 'super_admin') return res.json({ success: true, user: { role: 'super_admin' } });
  res.json({ success: true, user: req.user });
});

module.exports = router;
