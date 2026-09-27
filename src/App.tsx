import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App } from 'antd';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './features/auth/pages/loginpage';
import DashboardPage from './features/dashboard/pages/dashboardpage';
import ProjectDetailsPage from './features/projects/pages/projectdetails';
import ProjectsPage from './features/projects/pages/projectspage';
import TaskAndSubtasks from './features/projects/pages/TaskAndSubtasks';
import KanbanBoardPage from './features/projects/pages/kanban/page';
import DigitalBoardPage from './features/projects/pages/board/digital_board';
import TasksPage from './features/tasks/pages/taskspage';
import EmployeePage from './features/employee/pages/employeepage'
import UsersPage from './features/users/pages/userspage';
import NotFound from './features/not-found/pages/not-found';
import DepartmentPage from './features/departments/pages/departmentspage';
import OrganizationPage from './features/organizations/pages/organizationspage';
import PolicyPage from './features/policy/pages/policypage';
import BudgetPage from './features/budget/pages/budgetpage';
import ExpensePage from './features/expense/pages/expensepage';
import ClientPage from './features/client/pages/clientpage';
import LabelPage from './features/label/pages/labelpage';
import WardPage from './features/ward/pages/wardpage';
import FiscalYearPage from './features/fiscal-year/pages/fiscalyearpage';

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
        style: { zIndex: 99999 },
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
           <Route path="/projects/:id/tasks"element={
            <ProtectedRoute>
              <AppLayout showTopbar={false}><TaskAndSubtasks /></AppLayout>
            </ProtectedRoute>
          } />
           <Route path="/projects/:id/kanban" element={
            <ProtectedRoute>
              <AppLayout showTopbar={false}> <KanbanBoardPage /> </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/projects/:id/board" element={
            <ProtectedRoute>
              <AppLayout showTopbar={false}><DigitalBoardPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/WardInfo" element={
            <ProtectedRoute>
              <AppLayout showTopbar={false}><WardPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/FiscalYear" element={
            <ProtectedRoute>
              <AppLayout showTopbar={false}><FiscalYearPage /></AppLayout>
            </ProtectedRoute>
          } />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </App>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default RootApp;



