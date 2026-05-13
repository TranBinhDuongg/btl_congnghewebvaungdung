import AgriChainLanding from './AgriChainLanding.tsx';
import DangNhap from './DangNhap.tsx';
import DangKy from './DangKy.tsx';
import QuenMatKhau from './QuenMatKhau.tsx';
import NongDanApp from './NongDanApp.tsx';
import DailyApp from './DailyApp.tsx';
import SieuThiApp from './SieuThiApp.tsx';

import AdminApp from './AdminApp.tsx';
import TruyXuatApp from './TruyXuatApp.tsx';

export default function App() {
  const path = window.location.pathname;
  if (path === '/login')           return <DangNhap />;
  if (path === '/register')        return <DangKy />;
  if (path === '/forgot-password') return <QuenMatKhau />;
  if (path === '/nongdan')         return <NongDanApp />;
  if (path === '/daily')           return <DailyApp />;
  if (path === '/sieuthi')         return <SieuThiApp />;
  if (path === '/admin')           return <AdminApp />;
  if (path === '/truy-xuat')       return <TruyXuatApp />;
  return <AgriChainLanding />;
}
