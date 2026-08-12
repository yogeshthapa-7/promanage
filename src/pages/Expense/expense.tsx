'use client';

import Card from '@/components/ui/Card';

const expense = () => {
  return (
    <Card hover className="max-w-2xl">
      <h1 className="text-3xl font-bold text-slate-800">Expenses</h1>
      <p className="mt-1 text-base text-slate-500">
        Transparent tracking of costs and financial accountability.
      </p>
    </Card>
  );
}

export default expense