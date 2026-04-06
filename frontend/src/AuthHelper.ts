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

export interface RegisterPayload {
  role: UserRole;
  fullName: string; phone: string; email: string;
  username: string; password: string;
  province: string; district: string; address: string;
  companyName?: string; taxCode?: string; vehicleCount?: string; serviceArea?: string;
  storeName?: string; businessType?: string; businessLicense?: string; storeSize?: string;
  farmName?: string; farmArea?: string; cropType?: string; certification?: string;
  [key: string]: string | undefined;
}

export interface ResetPasswordPayload {
  role: UserRole;
  email: string;
  newPassword: string;
}

const API = process.env.REACT_APP_API_URL || "";
const USER_KEY = "agrichain_user";

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function clearCurrentUser(): void {
  localStorage.removeItem(USER_KEY);
}

export async function apiLogin(payload: LoginPayload): Promise<AuthUser> {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: payload.username, password: payload.password, role: payload.role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");
  const user = data as AuthUser;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
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

export async function apiResetPassword(payload: ResetPasswordPayload): Promise<void> {
  const res = await fetch(`${API}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Đặt lại mật khẩu thất bại");
}

export async function apiUpdateProfile(payload: {
  maTaiKhoan: number;
  hoTen: string;
  soDienThoai?: string;
  email?: string;
  diaChi?: string;
}): Promise<void> {
  const res = await fetch(`${API}/api/auth/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Cập nhật thất bại");
  const user = getCurrentUser();
  if (user) {
    user.tenHienThi  = data.tenHienThi  ?? user.tenHienThi;
    user.soDienThoai = data.soDienThoai ?? user.soDienThoai;
    user.email       = data.email       ?? user.email;
    user.diaChi      = data.diaChi      ?? user.diaChi;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}
