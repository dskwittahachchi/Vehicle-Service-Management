export type Role = "customer" | "technician" | "admin";
export type ServiceStatus = "booked" | "inspected" | "awaiting_approval" | "in_progress" | "ready" | "completed";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Vehicle {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  vin: string;
  mileage: number;
  color?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  name: string;
  type: "part" | "labor";
  quantity: number;
  unitPrice: number;
  complete: boolean;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Estimate {
  id: string;
  workOrderId: string;
  lineItems: LineItem[];
  total: number;
  approvalStatus: "pending" | "approved" | "rejected";
  createdAt: string;
  workOrder?: WorkOrder;
}

export interface Invoice {
  id: string;
  workOrderId: string;
  invoiceNumber: string;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: "unpaid" | "paid" | "refunded";
  issuedAt: string;
  workOrder?: WorkOrder;
}

export interface WorkOrder {
  id: string;
  bookingId: string;
  technicianId: string;
  technician?: User;
  status: ServiceStatus;
  bay: string;
  findings: string;
  updatedAt: string;
  tasks: Task[];
  booking?: Booking;
  estimate?: Estimate;
  invoice?: Invoice;
}

export interface Booking {
  id: string;
  vehicleId: string;
  customerId: string;
  scheduledAt: string;
  serviceType: string;
  complaint: string;
  status: ServiceStatus;
  createdAt: string;
  vehicle?: Vehicle;
  workOrder?: WorkOrder | null;
}

export interface Activity {
  id: string;
  label: string;
  detail: string;
  at: string;
}

export interface DashboardData {
  metrics: {
    activeJobs: number;
    vehicles: number;
    pendingApprovals: number;
    unpaidInvoices: number;
    taskCompletion: number;
  };
  bookings: Booking[];
  activity: Activity[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Array<{ path: string; message: string }>;
}
