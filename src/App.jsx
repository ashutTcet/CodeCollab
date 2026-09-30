import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudentDashboardPage from './pages/StudentDashboardPage'
import TeacherDashboardPage from './pages/TeacherDashboardPage'
import TeacherClassroomPage from './pages/TeacherClassroomPage'
import StudentClassroomPage from './pages/StudentClassroomPage'
import ClassroomWorkspacePage from './pages/ClassroomWorkspacePage'
import ProgressPage from './pages/ProgressPage'
import TeacherClassroomProgressPage from './pages/TeacherClassroomProgressPage'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute role="student">
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/classrooms"
            element={
              <ProtectedRoute role="student">
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/classroom/:id"
            element={
              <ProtectedRoute role="student">
                <StudentClassroomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute role="student">
                <ProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute role="teacher">
                <TeacherDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/classrooms"
            element={
              <ProtectedRoute role="teacher">
                <TeacherDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/classroom/:id"
            element={
              <ProtectedRoute role="teacher">
                <TeacherClassroomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/classroom/:id/progress"
            element={
              <ProtectedRoute role="teacher">
                <TeacherClassroomProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/classroom/:id/progress/:studentId"
            element={
              <ProtectedRoute role="teacher">
                <TeacherClassroomProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classroom/:id/workspace"
            element={
              <ProtectedRoute>
                <ClassroomWorkspacePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
