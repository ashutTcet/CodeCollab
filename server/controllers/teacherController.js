function getTeacherDashboard(req, res) {
  return res.status(200).json({
    message: 'Teacher dashboard data loaded',
    dashboard: {
      welcome: `Welcome back, ${req.user.role}`,
      placeholders: {
        activeClassrooms: [],
        studentStatistics: {},
        recentCodingSessions: [],
      },
    },
  });
}

module.exports = {
  getTeacherDashboard,
};
