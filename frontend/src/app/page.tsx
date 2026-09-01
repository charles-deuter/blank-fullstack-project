const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

type HealthCheck = {
  ok: boolean;
  status: number;
  body: string;
};

async function getHealthCheck(): Promise<HealthCheck> {
  try {
    const res = await fetch(`${BACKEND_URL}/health-check`, {
      cache: "no-store",
    });
    const text = await res.text();
    let body = text;
    try {
      body = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      // response was not JSON; show it verbatim
    }
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      body: err instanceof Error ? err.message : String(err),
    };
  }
}

export default async function Home() {
  const health = await getHealthCheck();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">hello-world</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-gray-500">
          GET {BACKEND_URL}/health-check
        </h2>
        {health.ok ? (
          <pre className="overflow-x-auto rounded bg-gray-100 p-4 text-sm">
            {health.body}
          </pre>
        ) : (
          <pre className="overflow-x-auto rounded bg-red-100 p-4 text-sm text-red-800">
            {health.status
              ? `HTTP ${health.status}\n\n${health.body}`
              : `Request failed: ${health.body}`}
          </pre>
        )}
      </section>
    </main>
  );
}
