import AgriChainLanding from './AgriChainLanding.tsx';
import DangNhap from './DangNhap.tsx';
import DangKy from './DangKy.tsx';
import QuenMatKhau from './QuenMatKhau.tsx';

export default function App() {
  const path = window.location.pathname;
  if (path === '/login')           return <DangNhap />;
  if (path === '/register')        return <DangKy />;
  if (path === '/forgot-password') return <QuenMatKhau />;
  return <AgriChainLanding />;
}
