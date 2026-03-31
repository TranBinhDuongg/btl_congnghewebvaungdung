import AgriChainLanding from './AgriChainLanding.tsx';
import DangNhap from './DangNhap.tsx';
import DangKy from './DangKy.tsx';

export default function App() {
  const path = window.location.pathname;
  if (path === '/login')    return <DangNhap />;
  if (path === '/register') return <DangKy />;
  return <AgriChainLanding />;
}
