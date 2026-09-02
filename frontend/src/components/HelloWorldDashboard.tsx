import { getHealthCheck } from "@/server-actions/health-check";

export default async function HelloWorldDashboard() {
  const health = await getHealthCheck();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="flex items-center gap-2 text-2xl font-semibold">
        hello-world
        <span
          title={health.detail}
          aria-label={`health: ${health.healthy ? "up" : "down"}`}
          className={`inline-block h-3 w-3 shrink-0 cursor-help rounded-full ${
            health.healthy ? "bg-green-500" : "bg-red-500"
          }`}
        />
      </h1>
    </main>
  );
}
