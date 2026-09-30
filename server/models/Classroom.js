const mongoose = require("mongoose");
const {
  SUPPORTED_CLASSROOM_SUBJECTS,
  normalizeClassroomSubject,
} = require("../config/classroomLanguages");

const CLASSROOM_SUBJECT_ENUM = ["C", "C++", "Java", "Python", "JavaScript"];

const classroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      enum: CLASSROOM_SUBJECT_ENUM,
      immutable: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    roomCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

classroomSchema.pre("validate", function normalizeSubject() {
  if (this.isNew || this.isModified("subject")) {
    const normalized = normalizeClassroomSubject(this.subject);
    if (!normalized || !SUPPORTED_CLASSROOM_SUBJECTS.includes(normalized)) {
      this.invalidate(
        "subject",
        "Subject must be one of C, C++, Java, Python, or JavaScript",
      );
      return;
    }

    this.subject = normalized;
  }
});

classroomSchema.pre(
  ["findOneAndUpdate", "updateOne", "updateMany"],
  function preventSubjectMutation() {
    const update = this.getUpdate() || {};
    const directSubject = update.subject;
    const setSubject = update.$set && update.$set.subject;

    if (directSubject !== undefined || setSubject !== undefined) {
      if (update.subject !== undefined) {
        delete update.subject;
      }

      if (update.$set && update.$set.subject !== undefined) {
        delete update.$set.subject;
      }

      this.setUpdate(update);
    }
  },
);

classroomSchema.index({ teacher: 1, createdAt: -1 });
classroomSchema.index({ students: 1 });

const Classroom = mongoose.model("Classroom", classroomSchema);

module.exports = Classroom;
