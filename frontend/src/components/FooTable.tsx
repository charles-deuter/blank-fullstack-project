"use client";

import { useState, useTransition } from "react";
import { createFoo, listFoos, type Foo } from "@/server-actions/foo";

const FOO_NAME = "hello-world";

// Locale and timezone are pinned so the server and the client format identically;
// letting either default would render different text and trip a hydration mismatch.
const createdAtFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

type Status = { ok: boolean; message: string };

type FooTableProps = {
  initialFoos: Foo[];
  initialError: string | null;
};

export default function FooTable({ initialFoos, initialError }: FooTableProps) {
  const [foos, setFoos] = useState<Foo[]>(initialFoos);
  const [status, setStatus] = useState<Status | null>(
    initialError ? { ok: false, message: initialError } : null,
  );
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      const created = await createFoo(FOO_NAME);

      if (!created.ok) {
        setStatus({ ok: false, message: created.message });
        return;
      }

      // Re-read rather than prepending locally, so the server's ordering stays
      // the single source of truth for what the table shows.
      const listed = await listFoos();

      if (!listed.ok) {
        setStatus({ ok: false, message: listed.message });
        return;
      }

      setFoos(listed.foos);
      setStatus({ ok: true, message: `Created foo #${created.foo.id}` });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={handleCreate}
          disabled={isPending}
          className="self-start rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Creating…" : "Create foo"}
        </button>

        <div role="status" aria-live="polite" className="min-h-9">
          {status && (
            <p
              className={`rounded px-3 py-2 text-sm ${
                status.ok
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {status.message}
            </p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-gray-500">
              <th className="py-2 pr-4 font-medium">id</th>
              <th className="py-2 pr-4 font-medium">name</th>
              <th className="py-2 font-medium">created_at (UTC)</th>
            </tr>
          </thead>
          <tbody>
            {foos.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 text-gray-500">
                  No foo records yet
                </td>
              </tr>
            ) : (
              foos.map((foo) => (
                <tr key={foo.id} className="border-b border-gray-200">
                  <td className="py-2 pr-4">{foo.id}</td>
                  <td className="py-2 pr-4">{foo.name}</td>
                  <td className="py-2">
                    {createdAtFormat.format(new Date(foo.created_at))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
