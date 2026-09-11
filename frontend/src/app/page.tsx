import WalletDashboard from '@/components/WalletDashboard';

const DEMO_WALLET_ID = 1;

export default function Home() {
  return <WalletDashboard walletId={DEMO_WALLET_ID} />;
}
