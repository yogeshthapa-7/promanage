import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/ui/Card';

interface EntitySummaryCardProps {
  title: string;
  count: number;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  href: string;
  loading?: boolean;
}

const EntitySummaryCard = memo(function EntitySummaryCard({
  title,
  count,
  description,
  icon,
  iconBg,
  iconColor,
  href,
  loading = false,
}: EntitySummaryCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        <span className="text-xl font-bold tabular-nums text-foreground">
          {loading ? '—' : count}
        </span>
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
      </div>
      <button
        onClick={() => navigate(href)}
        className="text-xs font-semibold transition-colors duration-150 hover:opacity-80 self-start"
        style={{ color: 'var(--primary)' }}
      >
        View All
      </button>
    </Card>
  );
});

export default EntitySummaryCard;
