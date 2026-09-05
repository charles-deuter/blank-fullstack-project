import FooPanel from '@/components/FooPanel';
import HelloWorldDashboard from '@/components/HelloWorldDashboard';
import WalletPanel from '@/components/WalletPanel';

export default function Home() {
  return (
    <>
      <HelloWorldDashboard />
      <WalletPanel />
      <FooPanel />
    </>
  );
}
