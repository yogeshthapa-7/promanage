'use client';

import Card from '@/components/ui/Card';

const budget = () => {
  return (
    <Card hover className="max-w-2xl">
      <h1 className="text-3xl font-bold text-slate-800">Budgets</h1>
      <p className="mt-1 text-base text-slate-500">
        Strategic allocation of resources to maximize impact.
      </p>
    </Card>
  );
}

export default budget