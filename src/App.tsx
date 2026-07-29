import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/login/page';
import DashboardPage from './pages/dashboard/page';
import ProjectsPage from './pages/projects/page';
import ProjectDetailsPage from './pages/projects/projectdetails';
import TasksPage from './pages/tasks/page';
import TeamPage from './pages/team/page';
import ActivityPage from './pages/analytics/page';
import NotFound from './pages/not-found';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppLayout showTopbar={false}><DashboardPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/projects" element={
          <ProtectedRoute>
            <AppLayout showTopbar={false}><ProjectsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/projects/:id" element={
          <ProtectedRoute>
            <AppLayout showTopbar={false}><ProjectDetailsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute>
            <AppLayout showTopbar={false}><TasksPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/team" element={
          <ProtectedRoute>
            <AppLayout showTopbar={false}><TeamPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <AppLayout showTopbar={false}><ActivityPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<AppLayout showTopbar={false}><NotFound /></AppLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
