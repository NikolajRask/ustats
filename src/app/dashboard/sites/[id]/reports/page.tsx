export default async function ReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Reports
        </h2>
      </div>
    </div>
  );
}
