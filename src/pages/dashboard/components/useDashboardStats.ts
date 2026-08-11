import { useEffect, useState } from 'react';
import { fetchUsers } from '@/lib/users-data';
import { fetchEmployees } from '@/lib/employees-data';
import { fetchDepartments } from '@/lib/departments-data';
import { fetchOrganizations } from '@/lib/organizations-data';
import { fetchAllTasks } from '@/lib/tasks-data';

interface DashboardStats {
  projects: number;
  users: number;
  employees: number;
  departments: number;
  organizations: number;
  tasks: number;
  loading: boolean;
}

export function useDashboardStats(projectCount = 0) {
  const [stats, setStats] = useState<DashboardStats>({
    projects: 0,
    users: 0,
    employees: 0,
    departments: 0,
    organizations: 0,
    tasks: 0,
    loading: true,
  });

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setStats((s) => ({ ...s, loading: true }));
      try {
        const [usersResult, employeesResult, departmentsResult, organizationsResult, tasksResult] = await Promise.all([
          fetchUsers({ search: '', start: 0, length: 1, signal: controller.signal }),
          fetchEmployees({ search: '', start: 0, length: 1, signal: controller.signal }),
          fetchDepartments({ search: '', start: 0, length: 1, signal: controller.signal }),
          fetchOrganizations({ search: '', start: 0, length: 1, signal: controller.signal }),
          fetchAllTasks({ page: 1, pageSize: 1, signal: controller.signal }),
        ]);

        if (!cancelled) {
          setStats({
            projects: projectCount || 0,
            users: usersResult.total,
            employees: employeesResult.total,
            departments: departmentsResult.total,
            organizations: organizationsResult.total,
            tasks: tasksResult.total,
            loading: false,
          });
        }
      } catch {
        if (!cancelled) {
          setStats({
            projects: projectCount || 0,
            users: 0,
            employees: 0,
            departments: 0,
            organizations: 0,
            tasks: 0,
            loading: false,
          });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return stats;
}
