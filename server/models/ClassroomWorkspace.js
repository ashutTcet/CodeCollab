const mongoose = require('mongoose');

const SUPPORTED_LANGUAGES = ['javascript', 'cpp', 'python', 'java'];

const classroomWorkspaceSchema = new mongoose.Schema(
  {
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
      unique: true,
      index: true,
    },
    language: {
      type: String,
      enum: SUPPORTED_LANGUAGES,
      default: 'javascript',
      required: true,
    },
    ydocState: {
      type: Buffer,
      default: Buffer.alloc(0),
      required: true,
    },
    codeSnapshot: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = {
  ClassroomWorkspace: mongoose.model('ClassroomWorkspace', classroomWorkspaceSchema),
  SUPPORTED_LANGUAGES,
};
