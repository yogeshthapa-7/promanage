'use client';

import Card from '@/components/ui/Card';

const client = () => {
  return (
    <Card hover className="max-w-2xl">
      <h1 className="text-3xl font-bold text-slate-800">Clients Info</h1>
      <p className="mt-1 text-base text-slate-500">
        Essential details to strengthen relationships and deliver value.
      </p>
    </Card>
  );
}

export default client