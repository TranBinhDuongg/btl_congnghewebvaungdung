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
  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role:        payload.role,
      username:    payload.username,
      password:    payload.password,
      fullName:    payload.fullName,
      phone:       payload.phone,
      email:       payload.email,
      address:     `${payload.address}, ${payload.district}, ${payload.province}`,
      companyName: payload.companyName,
      storeName:   payload.storeName,
    }),
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

export interface ResetPasswordPayload {
  role: UserRole;
  email: string;
  newPassword: string;
}

export async function apiResetPassword(payload: ResetPasswordPayload): Promise<void> {
  const res = await fetch(`${API}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Đặt lại mật khẩu thất bại");
}
