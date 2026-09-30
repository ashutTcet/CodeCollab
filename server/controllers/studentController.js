function getStudentDashboard(req, res) {
  return res.status(200).json({
    message: 'Student dashboard data loaded',
    dashboard: {
      welcome: `Welcome back, ${req.user.role}`,
      placeholders: {
        activeCodingSessions: [],
        recentProjects: [],
        learningProgress: {},
        recentActivity: [],
      },
    },
  });
}

module.exports = {
  getStudentDashboard,
};
