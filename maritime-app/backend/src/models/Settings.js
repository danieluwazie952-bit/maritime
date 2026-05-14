const mongoose = require('mongoose');

// Singleton settings document — one per deployment
const settingsSchema = new mongoose.Schema({
  academicSession: { type: String, default: '2024/2025' },
  paymentAmounts: {
    national_association: { type: Number, default: 5000 },
    department:           { type: Number, default: 3000 },
    college:              { type: Number, default: 2000 },
    national_institute:   { type: Number, default: 4000 },
  },
  paymentDueDates: {
    national_association: { type: Date },
    department:           { type: Date },
    college:              { type: Date },
    national_institute:   { type: Date },
  },
});

// Always return (or create) the single settings document
settingsSchema.statics.getOrCreate = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model('Settings', settingsSchema);
