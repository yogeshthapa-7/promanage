export default function WardInfoPage() {
  return (
    <div className="fade-in text-slate-800">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Ward Info</h1>
          <p className="mt-1 text-base text-slate-500">
            Manage ward information, boundaries, and administrative details.
          </p>
        </div>
      </div>
      <hr className="border-slate-200 my-6" />
    </div>
  );
}
