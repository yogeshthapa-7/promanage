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
        const results = await Promise.allSettled([
          fetchUsersCount(),
          fetchEmployeeCount(),
          fetchDepartmentCount(),
          fetchOrganizationCount(),
          fetchProjectCount(),
          fetchTaskCount(),
        ])

        if (cancelled) return;

        const pick = (r: PromiseSettledResult<number>) => r.status === 'fulfilled' ? r.value: 0;
        setStats({
          users: pick(results[0]),
          employees: pick(results[1]),
          departments: pick(results[2]),
          organizations: pick(results[3]),
          projects: pick(results[4]),
          tasks: pick(results[5]),
          loading: false,
        });

        results.forEach((r, i) => {
          if (r.status === 'rejected') console.error(`Stat ${i} failed:`, r.reason);
        });
      } catch (err) {
        console.error('status failed:', err);
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
    return() => {
      cancelled = true;
      controller.abort();
    };
  }, [projectCount]);

  return stats;

}




