const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    student:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:            { type: String, required: true },
    originalName:    { type: String },
    filePath:        { type: String, required: true },
    fileUrl:         { type: String },
    fileType:        { type: String },
    size:            { type: Number },
    category:        {
      type: String,
      enum: ['onboarding', 'course_form', 'payment_receipt', 'other'],
      default: 'other',
    },
    verifiedByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
