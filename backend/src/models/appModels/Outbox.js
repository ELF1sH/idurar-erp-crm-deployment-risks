const mongoose = require('mongoose');

const outboxSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: ''
    },
    subject: {
      type: String,
      required: true
    },
    link: String,
    type: {
      type: String,
      enum: ['invoice'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending'
    },
    attempts: {
      type: Number,
      default: 0
    },
    lastAttempt: Date,
    htmlContent: String,
    error: String
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Outbox', outboxSchema);