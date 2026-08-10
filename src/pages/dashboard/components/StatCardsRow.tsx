import StatCardClient from './StatCardClient';
import { getStatCards } from './statCardsData';
import { type Project } from '@/lib/projects-data';

interface StatCardsRowProps {
  projects?: Project[];
  stats?: {
    projects: number;
    users: number;
    employees: number;
    departments: number;
    organizations: number;
    tasks: number;
  };
  loading?: boolean;
}

export default function StatCardsRow({ projects, stats, loading = false }: StatCardsRowProps) {
  const cards = stats
    ? getStatCards(stats)
    : projects
      ? getStatCards({ projects: projects.length, users: 0, employees: 0, departments: 0, organizations: 0, tasks: 0 })
      : [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5 gap-3">
      {cards.map((card) => (
        <StatCardClient key={card.id} {...card} loading={loading} />
      ))}
    </div>
  );
}