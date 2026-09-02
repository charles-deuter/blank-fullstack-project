"use server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export type Bit = 0 | 1;

export type HealthCheck = {
  /** `server_status === "ACTIVE"` as a bit */
  serverBit: Bit;
  /** `connection_status === "ACTIVE"` as a bit */
  connectionBit: Bit;
  /** serverBit & connectionBit — 1 only when both are up */
  healthy: Bit;
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
        serverBit: 0,
        connectionBit: 0,
        healthy: 0,
        detail: `GET ${url}\nHTTP ${res.status}\n\n${text}`,
      };
    }

    let serverBit: Bit = 0;
    let connectionBit: Bit = 0;
    let body = text;

    try {
      const parsed = JSON.parse(text);
      serverBit = parsed?.server_status === "ACTIVE" ? 1 : 0;
      connectionBit = parsed?.connection_status === "ACTIVE" ? 1 : 0;
      body = JSON.stringify(parsed, null, 2);
    } catch {
      // response was not JSON; show it verbatim and treat it as unhealthy
    }

    return {
      serverBit,
      connectionBit,
      healthy: (serverBit & connectionBit) as Bit,
      detail: `GET ${url}\nHTTP ${res.status}\n\n${body}`,
    };
  } catch (err) {
    return {
      serverBit: 0,
      connectionBit: 0,
      healthy: 0,
      detail: `GET ${url}\nRequest failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}
