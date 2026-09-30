const Classroom = require('../models/Classroom');

async function getTeacherDashboard(req, res, next) {
  try {
    const classrooms = await Classroom.find({ teacher: req.user.id })
      .sort({ createdAt: -1 })
      .select('name subject roomCode students createdAt updatedAt');

    const uniqueStudentIds = new Set();
    classrooms.forEach((classroom) => {
      classroom.students.forEach((studentId) => uniqueStudentIds.add(studentId.toString()));
    });

    return res.status(200).json({
      message: 'Teacher dashboard data loaded',
      dashboard: {
        welcome: 'Welcome back',
        placeholders: {
          activeClassrooms: classrooms.map((classroom) => ({
            id: classroom._id,
            name: classroom.name,
            subject: classroom.subject,
            roomCode: classroom.roomCode,
            studentCount: classroom.students.length,
            createdAt: classroom.createdAt,
          })),
          studentStatistics: {
            totalClassrooms: classrooms.length,
            totalEnrolledStudents: uniqueStudentIds.size,
          },
          recentCodingSessions: [],
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getTeacherDashboard,
};
