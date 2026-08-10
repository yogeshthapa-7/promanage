'use client';

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/ui/Card';
import type { Project } from '@/lib/projects-data';

interface RecentProjectsCardProps {
  projects: Project[];
  loading?: boolean;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const RecentProjectsCard = ({ projects, loading = false }: RecentProjectsCardProps) => {
  const navigate = useNavigate();
  const recent = useMemo(() => {
    return [...projects]
      .sort((a, b) => new Date(b.startDate || b.dueDate || 0).getTime() - new Date(a.startDate || a.dueDate || 0).getTime())
      .slice(0, 5);
  }, [projects]);

  return (
     <Card className="h-full flex flex-col">
       <div className="flex items-center justify-between mb-3 flex-shrink-0">
         <h2 className="text-sm font-bold text-foreground">Recent Projects</h2>
        <button
          onClick={() => navigate('/projects')}
          className="text-xs font-semibold transition-colors duration-150 hover:opacity-80"
          style={{ color: 'var(--primary)' }}
        >
          View All
        </button>
      </div>

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-thin -mr-2 pr-2">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading projects...</p>
        ) : recent.length === 0 ? (
          <p className="text-xs text-muted-foreground">No projects found.</p>
        ) : (
          recent.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-200/80 bg-white/60"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{project.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(project.startDate)}</p>
              </div>
              <span
                className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  project.status === 'Completed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : project.status === 'In Progress'
                    ? 'bg-blue-100 text-blue-700'
                    : project.status === 'Overdue'
                    ? 'bg-rose-100 text-rose-700'
                    : project.status === 'On Hold'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {project.status}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default RecentProjectsCard;
