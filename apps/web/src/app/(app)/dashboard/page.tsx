import { PainelDashboard } from "@/features/dashboard/painel-dashboard";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
      <PainelDashboard />
    </div>
  );
}
