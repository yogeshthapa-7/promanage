import StatCardClient from './StatCardClient';
import { getStatCards } from './statCardsData';
import { type Project } from '@/lib/projects-data';

interface StatCardsRowProps {
  projects?: Project[];
}

export default function StatCardsRow({ projects }: StatCardsRowProps) {
  const data = projects ? getStatCards(projects) : getStatCards([]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5 gap-4">
      {data.map((card) => (
        <StatCardClient key={card.id} {...card} />
      ))}
    </div>
  );
}