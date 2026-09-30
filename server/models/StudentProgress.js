const mongoose = require('mongoose');
const { SUPPORTED_CLASSROOM_SUBJECTS } = require('../config/classroomLanguages');

const studentProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    language: {
      type: String,
      enum: SUPPORTED_CLASSROOM_SUBJECTS,
      required: true,
      index: true,
    },
    problemsAttempted: {
      type: Number,
      default: 0,
      min: 0,
    },
    problemsSolved: {
      type: Number,
      default: 0,
      min: 0,
    },
    submissions: {
      type: Number,
      default: 0,
      min: 0,
    },
    acceptedSubmissions: {
      type: Number,
      default: 0,
      min: 0,
    },
    compilationErrors: {
      type: Number,
      default: 0,
      min: 0,
    },
    runtimeErrors: {
      type: Number,
      default: 0,
      min: 0,
    },
    codingSessions: {
      type: Number,
      default: 0,
      min: 0,
    },
    codingTimeMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActiveAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

studentProgressSchema.index({ student: 1, language: 1 }, { unique: true });
studentProgressSchema.index({ student: 1, updatedAt: -1 });

const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema);

module.exports = StudentProgress;
