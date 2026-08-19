import type { ApiResponse, Booking, DashboardData, Estimate, Invoice, User, Vehicle, WorkOrder } from "./types";

const TOKEN_KEY = "autoserve-token";

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok) throw new Error(payload.message || "The request could not be completed");
  return payload;
}

export const api = {
  token: {
    get: () => localStorage.getItem(TOKEN_KEY),
    set: (value: string) => localStorage.setItem(TOKEN_KEY, value),
    clear: () => localStorage.removeItem(TOKEN_KEY),
  },
  login: (email: string, password: string) => request<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request<User>("/auth/me"),
  dashboard: () => request<DashboardData>("/dashboard"),
  vehicles: () => request<Vehicle[]>("/vehicles"),
  addVehicle: (vehicle: Omit<Vehicle, "id" | "customerId" | "createdAt">) => request<Vehicle>("/vehicles", { method: "POST", body: JSON.stringify(vehicle) }),
  bookings: () => request<Booking[]>("/bookings"),
  createBooking: (booking: Pick<Booking, "vehicleId" | "scheduledAt" | "serviceType" | "complaint">) => request<Booking>("/bookings", { method: "POST", body: JSON.stringify(booking) }),
  technicians: () => request<User[]>("/technicians"),
  assignBooking: (id: string, technicianId: string, bay: string) => request<Booking>(`/admin/bookings/${id}/assign`, { method: "PUT", body: JSON.stringify({ technicianId, bay }) }),
  workOrders: () => request<WorkOrder[]>("/work-orders"),
  updateStatus: (id: string, status: string, findings?: string) => request<WorkOrder>(`/work-orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status, findings }) }),
  updateTask: (orderId: string, taskId: string, complete: boolean) => request<WorkOrder>(`/work-orders/${orderId}/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ complete }) }),
  estimates: () => request<Estimate[]>("/estimates"),
  decideEstimate: (id: string, decision: "approved" | "rejected") => request<Estimate>(`/estimates/${id}/approve`, { method: "PUT", body: JSON.stringify({ decision }) }),
  invoices: () => request<Invoice[]>("/invoices"),
  updatePayment: (id: string, paymentStatus: Invoice["paymentStatus"]) => request<Invoice>(`/invoices/${id}/payment`, { method: "PUT", body: JSON.stringify({ paymentStatus }) }),
};
