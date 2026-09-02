"use server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export type HealthCheck = {
  /** serverStatus & connectionStatus — true only when both are active */
  isHealthy: boolean;
  /** what to show on hover: the formatted body, or the failure detail */
  detail: string;
};

export async function getHealthCheck(): Promise<HealthCheck> {
  const url = `${BACKEND_URL}/health-check`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();

    if (!res.ok) {
      return {
        isHealthy: false,
        detail: `GET ${url}\nHTTP ${res.status}\n\n${text}`,
      };
    }

    let body = text;

    const parsed = JSON.parse(text);
    const isServerActive = parsed?.server_status === "ACTIVE";
    const isConnectionActive = parsed?.connection_status === "ACTIVE";
    const isHealthy = isServerActive && isConnectionActive;
    body = JSON.stringify(parsed, null, 2);

    return {
      isHealthy: isHealthy,
      detail: `GET ${url}\nHTTP ${res.status}\n\n${body}`,
    };
  } catch (err) {
    return {
      isHealthy: false,
      detail: `GET ${url}\nRequest failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}
