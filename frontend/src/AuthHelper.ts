export type UserRole = "nongdan" | "daily" | "sieuthi" | "admin";

export const ROLE_LABELS: Record<UserRole, string> = {
  nongdan: "Nông dân",
  daily:   "Đại lý",
  sieuthi: "Siêu thị",
  admin:   "Admin",
};

export interface LoginPayload {
  username: string;
  password: string;
  role: string;
}

export interface AuthUser {
  maTaiKhoan: number;
  maDoiTuong: number;
  tenHienThi: string;
  username: string;
  role: UserRole;
  email?: string;
  soDienThoai?: string;
  diaChi?: string;
}

const API = process.env.REACT_APP_API_URL || "";

export interface RegisterPayload {
  role: UserRole;
  fullName: string; phone: string; email: string;
  username: string; password: string;
  province: string; district: string; address: string;
  // nongdan
  farmName?: string; farmArea?: string; cropType?: string; certification?: string;
  // daily
  companyName?: string; taxCode?: string; vehicleCount?: string; serviceArea?: string;
  // sieuthi
  storeName?: string; businessType?: string; businessLicense?: string; storeSize?: string;
  [key: string]: string | undefined;
}

export async function apiRegister(payload: RegisterPayload): Promise<void> {
  const endpointMap: Record<UserRole, string> = {
    nongdan: "/api/nong-dan/create",
    daily:   "/api/dai-ly/create",
    sieuthi: "/api/sieuthi/create",
    admin:   "/api/nong-dan/create",
  };
  const bodyMap: Record<UserRole, object> = {
    nongdan: { TenDangNhap: payload.username, MatKhauHash: payload.password, HoTen: payload.fullName, SoDienThoai: payload.phone, Email: payload.email, DiaChi: payload.address },
    daily:   { TenDangNhap: payload.username, MatKhauHash: payload.password, TenDaiLy: payload.companyName || payload.fullName, SoDienThoai: payload.phone, Email: payload.email, DiaChi: payload.address },
    sieuthi: { TenDangNhap: payload.username, MatKhauHash: payload.password, TenSieuThi: payload.storeName || payload.fullName, SoDienThoai: payload.phone, Email: payload.email, DiaChi: payload.address },
    admin:   { TenDangNhap: payload.username, MatKhauHash: payload.password, HoTen: payload.fullName, SoDienThoai: payload.phone, Email: payload.email, DiaChi: payload.address },
  };
  const res = await fetch(`${API}${endpointMap[payload.role]}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyMap[payload.role]),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Đăng ký thất bại");
}

export async function apiLogin(payload: LoginPayload): Promise<AuthUser> {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: payload.username, password: payload.password, role: payload.role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");
  return data as AuthUser;
}
