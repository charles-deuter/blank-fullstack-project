'use server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

export type FooCategory = 'general' | 'internal' | 'external';

export type FooPriority = 'low' | 'medium' | 'high';

export type CreateFooInput = {
  name: string;
  description: string | null;
  category: FooCategory;
  priority: FooPriority;
  is_active: boolean;
};

export type Foo = CreateFooInput & {
  id: number;
  created_at: string;
};

export type ListFoosResult = { ok: true; foos: Foo[] } | { ok: false; message: string };

export type CreateFooResult = { ok: true; foo: Foo } | { ok: false; message: string };

function failureMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function listFoos(): Promise<ListFoosResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/foo`, { cache: 'no-store' });

    if (!res.ok) {
      return { ok: false, message: `Failed to load foo records (HTTP ${res.status})` };
    }

    return { ok: true, foos: (await res.json()) as Foo[] };
  } catch (err) {
    return { ok: false, message: `Failed to load foo records: ${failureMessage(err)}` };
  }
}

export async function createFoo(input: CreateFooInput): Promise<CreateFooResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/foo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      cache: 'no-store',
    });

    if (!res.ok) {
      // The backend sends { message } on a 400; fall back to the status if it didn't.
      const body = await res.json().catch(() => null);
      return {
        ok: false,
        message: body?.message ?? `Create failed (HTTP ${res.status})`,
      };
    }

    return { ok: true, foo: (await res.json()) as Foo };
  } catch (err) {
    return { ok: false, message: `Create failed: ${failureMessage(err)}` };
  }
}
