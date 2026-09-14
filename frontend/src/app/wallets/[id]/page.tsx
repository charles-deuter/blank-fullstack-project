import WalletPanel from '@/components/WalletPanel';

export default async function WalletPage({ params }: PageProps<'/wallets/[id]'>) {
  const { id } = await params;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Wallet #{id}</h1>
      <WalletPanel walletId={id} />
    </main>
  );
}
