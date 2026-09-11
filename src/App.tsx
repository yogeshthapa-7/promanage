import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App } from 'antd';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/login/page';
import DashboardPage from './pages/dashboard/page';
import ProjectDetailsPage from './pages/projects/projectdetails';
import ProjectsPage from './pages/projects/page';
import TaskAndSubtasks from './pages/projects/TaskAndSubtasks';
import KanbanBoardPage from './pages/projects/KanbanBoard';
import TasksPage from './pages/tasks/page';
import EmployeePage from './pages/employee/page'
import UsersPage from './pages/users/page';
import NotFound from './pages/not-found';
import DepartmentPage from './pages/departments/department/page';
import OrganizationPage from './pages/Organizations/page';
import PolicyPage from './pages/Policy/policy';
import BudgetPage from './pages/Budget/budget';
import ExpensePage from './pages/Expense/expense';
import ClientPage from './pages/Client/client';
import LabelPage from './pages/Label/label';
import WardPage from './pages/WardInfo/WardInfo';
import UserProfilePage from './pages/profile/page';

function RootApp() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4F46E5',
          borderRadius: 12,
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          Card: {
            borderRadiusLG: 16,
          },
          Button: {
            borderRadius: 10,
          },
          Input: {
            borderRadius: 10,
          },
          Select: {
            borderRadius: 10,
          },
          Modal: {
            borderRadiusLG: 16,
          },
        },
      }}
      modal={{
        style: { zIndex: 10001 },
      }}
    >
      <BrowserRouter>
      <App>
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
        <Route path="/Policy" element={
          <ProtectedRoute>
            <AppLayout showTopbar={false}><PolicyPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/Budget" element={
          <ProtectedRoute>
            <AppLayout showTopbar={false}><BudgetPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/Expense" element={
          <ProtectedRoute>
            <AppLayout showTopbar={false}><ExpensePage /></AppLayout>
          </ProtectedRoute>
        } />
         <Route path="/Client" element={
           <ProtectedRoute>
             <AppLayout showTopbar={false}><ClientPage /></AppLayout>
           </ProtectedRoute>
         } />
          <Route path="/Label" element={
            <ProtectedRoute>
              <AppLayout showTopbar={false}><LabelPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <AppLayout showTopbar={false}><UserProfilePage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/projects/:id/tasks"element={
            <ProtectedRoute>
              <AppLayout showTopbar={false}><TaskAndSubtasks /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/projects/:projectId/kanban" element={
            <ProtectedRoute>
              <AppLayout showTopbar={false}> <KanbanBoardPage /> </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/WardInfo" element={
            <ProtectedRoute>
              <AppLayout showTopbar={false}><WardPage /></AppLayout>
            </ProtectedRoute>
          } />

        <Route path="*" element={<AppLayout showTopbar={false}><NotFound /></AppLayout>} />
      </Routes>
      </App>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default RootApp;
