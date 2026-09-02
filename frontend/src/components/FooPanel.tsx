import { listFoos } from "@/server-actions/foo";
import FooTable from "./FooTable";

export default async function FooPanel() {
  const result = await listFoos();

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-4 px-8 pb-8">
      <h2 className="text-lg font-semibold">foo records</h2>
      <FooTable
        initialFoos={result.ok ? result.foos : []}
        initialError={result.ok ? null : result.message}
      />
    </section>
  );
}
