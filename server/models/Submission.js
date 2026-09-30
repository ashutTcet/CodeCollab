const mongoose = require('mongoose');
const { SUPPORTED_CLASSROOM_SUBJECTS } = require('../config/classroomLanguages');

const submissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
      index: true,
    },
    language: {
      type: String,
      enum: SUPPORTED_CLASSROOM_SUBJECTS,
      required: true,
      index: true,
    },
    judge0LanguageId: {
      type: Number,
      required: true,
    },
    judge0SubmissionToken: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      required: true,
      trim: true,
    },
    statusLabel: {
      type: String,
      required: true,
      trim: true,
    },
    executionTime: {
      type: Number,
      default: null,
    },
    memory: {
      type: Number,
      default: null,
    },
    sourceCodeLength: {
      type: Number,
      default: 0,
    },
    stdinLength: {
      type: Number,
      default: 0,
    },
    problemKey: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ student: 1, language: 1, createdAt: -1 });
submissionSchema.index({ classroom: 1, createdAt: -1 });

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
