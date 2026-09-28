import { useEffect, useState } from 'react';
// import { fetchUsers } from '@/features/users/services/user.service';
// import { fetchEmployees } from '@/features/employee/services/employee.service';
// import { fetchDepartments } from '@/features/departments/services/department.service';
// import { fetchOrganizations } from '@/features/organizations/services/organization.service';
// import { fetchTaskCount } from '@/features/stats/services/stat.service';
import type { DashboardStats } from '@/features/dashboard/types/dashboard-types';
import { fetchProjectCount, fetchTaskCount, fetchUsersCount, fetchEmployeeCount, fetchOrganizationCount, fetchDepartmentCount }
from '@/features/dashboard/service/dashboardstats.service'; 

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
        const [usersCount, employeesCount, departmentsCount, organizationsCount, projectsCount, tasksCount] = await Promise.all([
          fetchUsersCount({ search: '', start: 0, length: 1, signal: controller.signal }),
          fetchEmployeeCount({ search: '', start: 0, length: 1, signal: controller.signal }),
          fetchDepartmentCount({ search: '', start: 0, length: 1, signal: controller.signal }),
          fetchOrganizationCount({ search: '', start: 0, length: 1, signal: controller.signal }),
          fetchProjectCount({ search: '', start: 0, length: 1, signal: controller.signal }),
          fetchTaskCount(),
        ]);

        if (!cancelled) {
          setStats({
            users: usersCount,
            employees: employeesCount,
            departments: departmentsCount,
            organizations: organizationsCount,
            projects: projectsCount,
            tasks: tasksCount,
            loading: false,
          });
        }
      } catch (err) {
        console.error('stats failed:',err);
        if (!cancelled) {
          setStats({
            projects: projectCount || 0,
            users: 0,
            employees: 0,
            departments: 0,
            organizations: 0,
            projects: 0,
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







