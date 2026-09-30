const Classroom = require('../models/Classroom');

async function getStudentDashboard(req, res, next) {
  try {
    const classrooms = await Classroom.find({ students: req.user.id })
      .populate('teacher', 'name email')
      .sort({ updatedAt: -1 })
      .select('name subject description teacher roomCode students createdAt updatedAt');

    return res.status(200).json({
      message: 'Student dashboard data loaded',
      dashboard: {
        welcome: 'Welcome back',
        placeholders: {
          activeCodingSessions: [],
          recentProjects: [],
          learningProgress: {},
          recentActivity: [],
          classrooms: classrooms.map((classroom) => ({
            id: classroom._id,
            name: classroom.name,
            subject: classroom.subject,
            description: classroom.description,
            roomCode: classroom.roomCode,
            teacher: classroom.teacher
              ? {
                  id: classroom.teacher._id,
                  name: classroom.teacher.name,
                  email: classroom.teacher.email,
                }
              : null,
            studentCount: classroom.students.length,
            joinedAt: classroom.updatedAt,
            createdAt: classroom.createdAt,
          })),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getStudentDashboard,
};
