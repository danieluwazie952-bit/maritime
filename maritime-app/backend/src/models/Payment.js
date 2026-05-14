const mongoose = require('mongoose');

const PAYMENT_TYPES = {
  national_association: 'National Association of Maritime Students Due',
  department:           'Department Due',
  college:              'College Due',
  national_institute:   'National Institute of Maritime Transport and Logistics Due',
};

const paymentSchema = new mongoose.Schema(
  {
    student:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type:          { type: String, enum: Object.keys(PAYMENT_TYPES), required: true },
    label:         { type: String }, // human-readable label stored at time of payment
    amount:        { type: Number, required: true },
    currency:      { type: String, default: 'NGN' },
    status:        { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    txRef:         { type: String, unique: true },
    flwRef:        { type: String },
    transactionId: { type: String },
    receiptPath:   { type: String },
    receiptUrl:    { type: String },
    paidAt:        { type: Date },
  },
  { timestamps: true }
);

paymentSchema.statics.PAYMENT_TYPES = PAYMENT_TYPES;

module.exports = mongoose.model('Payment', paymentSchema);
