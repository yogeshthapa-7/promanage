'use client';

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
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
        <Button type="link" size="small" onClick={() => navigate('/projects')}>
          View All
        </Button>
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
              <Badge
                style={{
                  background: project.status === 'Completed' ? '#ECFDF5' : project.status === 'In Progress' ? '#EFF6FF' : project.status === 'Overdue' ? '#FEF2F2' : project.status === 'On Hold' ? '#FFFBEB' : '#F3F4F6',
                  color: project.status === 'Completed' ? '#059669' : project.status === 'In Progress' ? '#2563EB' : project.status === 'Overdue' ? '#DC2626' : project.status === 'On Hold' ? '#D97706' : '#6B7280',
                }}
              >
                {project.status}
              </Badge>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default RecentProjectsCard;
