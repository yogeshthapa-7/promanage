import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/login/page';
import DashboardPage from './pages/dashboard/page';
import ProjectDetailsPage from './pages/projects/projectdetails';
import ProjectsPage from './pages/projects/page';
import TasksPage from './pages/tasks/page';
import TeamPage from './pages/team/page';
import UsersPage from './pages/users/page';
import ActivityPage from './pages/analytics/page';
import EmployeePage from './pages/employee/page'
import NotFound from './pages/not-found';
import DepartmentPage from './pages/departments/department/page';
import OrganizationPage from './pages/Organizations/page';

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
        <Route path="/users" element={
          <ProtectedRoute>
            <AppLayout showTopbar={false}><UsersPage /></AppLayout>
          </ProtectedRoute>
        } />
         <Route path="/employee" element={
          <ProtectedRoute>
            <AppLayout showTopbar={false}><EmployeePage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/departments" element={
          <ProtectedRoute>
            <AppLayout showTopbar={false}><DepartmentPage /></AppLayout>
          </ProtectedRoute>
        } />
         <Route path="/Organizations" element={
          <ProtectedRoute>
            <AppLayout showTopbar={false}><OrganizationPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<AppLayout showTopbar={false}><NotFound /></AppLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
