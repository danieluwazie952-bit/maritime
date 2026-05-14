const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 100-Level onboarding checklist items
const ONBOARDING_ITEMS = [
  'JAMB Admission Letter',
  'School Admission Letter',
  'State of Origin Certificate',
  'JAMB Result',
  'School Acceptance Fee Receipt',
  'School Fees Receipt',
  'Students Union Government Due Receipt',
  'Biodata Form',
  'Letter from Clergy',
  'Letter from Guardian',
  'Passport Photograph',
  'Post Card Photograph',
  'WAEC Result',
];

const userSchema = new mongoose.Schema(
  {
    fullName:      { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:      { type: String, required: true, minlength: 6, select: false },
    phone:         { type: String },
    role:          { type: String, enum: ['student', 'admin'], default: 'student' },

    // Student identification — only admin may edit after creation
    matricNumber:  { type: String, trim: true },
    jambRegNumber: { type: String, trim: true },
    level:         { type: String, enum: ['100', '200', '300', '400', '500'], default: '100' },
    stateOfOrigin: { type: String },
    department:    { type: String },

    // Auto-populated from PDF upload
    profileData:   { type: Object, default: {} },

    // Email verification
    isVerified:          { type: Boolean, default: false },
    verificationToken:   { type: String, select: false },
    verificationExpires: { type: Date,   select: false },

    // 100-level onboarding checklist (auto-seeded on create)
    onboarding: {
      type: [
        {
          name:       { type: String },
          status:     { type: String, enum: ['pending', 'uploaded', 'verified'], default: 'pending' },
          documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
          uploadedAt: { type: Date },
        },
      ],
      default: () => ONBOARDING_ITEMS.map((name) => ({ name, status: 'pending' })),
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.statics.ONBOARDING_ITEMS = ONBOARDING_ITEMS;

module.exports = mongoose.model('User', userSchema);
