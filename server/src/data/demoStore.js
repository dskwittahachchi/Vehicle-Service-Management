import bcrypt from "bcryptjs";

export const STATUSES = ["booked", "inspected", "awaiting_approval", "in_progress", "ready", "completed"];

export function createDemoStore() {
  return {
    users: [
      { id: "usr_customer", name: "Alicia Brown", email: "customer@autoserve.demo", passwordHash: bcrypt.hashSync("demo123", 10), role: "customer" },
      { id: "usr_technician", name: "Marcus Lee", email: "technician@autoserve.demo", passwordHash: bcrypt.hashSync("demo123", 10), role: "technician" },
      { id: "usr_technician_2", name: "Sofia Reyes", email: "sofia@autoserve.demo", passwordHash: bcrypt.hashSync("demo123", 10), role: "technician" },
      { id: "usr_admin", name: "Maya Patel", email: "admin@autoserve.demo", passwordHash: bcrypt.hashSync("demo123", 10), role: "admin" },
    ],
    vehicles: [
      { id: "veh_1", customerId: "usr_customer", make: "Volvo", model: "XC60", year: 2022, plateNumber: "CAR-2841", vin: "YV4A22RK4N1982841", mileage: 28430, color: "Onyx Black", createdAt: "2025-09-12T08:15:00.000Z" },
      { id: "veh_2", customerId: "usr_customer", make: "Toyota", model: "Corolla Cross", year: 2021, plateNumber: "KDL-7719", vin: "7MUCAAAG8MV037719", mileage: 41820, color: "Celestite", createdAt: "2025-11-03T10:00:00.000Z" },
    ],
    bookings: [
      { id: "book_1", vehicleId: "veh_1", customerId: "usr_customer", scheduledAt: "2026-08-19T08:30:00.000Z", serviceType: "Full service", complaint: "Routine 30,000 km service and intermittent brake vibration.", status: "in_progress", createdAt: "2026-08-12T07:20:00.000Z" },
      { id: "book_2", vehicleId: "veh_2", customerId: "usr_customer", scheduledAt: "2026-08-18T10:00:00.000Z", serviceType: "Diagnostics", complaint: "Air conditioning is slow to cool and makes a faint clicking sound.", status: "awaiting_approval", createdAt: "2026-08-15T05:45:00.000Z" },
      { id: "book_3", vehicleId: "veh_1", customerId: "usr_customer", scheduledAt: "2026-09-04T09:00:00.000Z", serviceType: "Wheel alignment", complaint: "Vehicle pulls slightly to the left at highway speed.", status: "booked", createdAt: "2026-08-18T14:10:00.000Z" },
      { id: "book_4", vehicleId: "veh_2", customerId: "usr_customer", scheduledAt: "2026-03-11T11:00:00.000Z", serviceType: "Annual service", complaint: "Annual inspection and fluid replacement.", status: "completed", createdAt: "2026-03-04T12:20:00.000Z" },
    ],
    workOrders: [
      { id: "wo_1048", bookingId: "book_1", technicianId: "usr_technician", status: "in_progress", bay: "Bay 03", findings: "Front brake discs show uneven wear. Engine oil and filters are due.", updatedAt: "2026-08-19T09:18:00.000Z", tasks: [
        { id: "task_1", name: "Engine oil and filter", type: "labor", quantity: 1, unitPrice: 118, complete: true },
        { id: "task_2", name: "Front brake disc resurfacing", type: "labor", quantity: 1.5, unitPrice: 92, complete: false },
        { id: "task_3", name: "Cabin air filter", type: "part", quantity: 1, unitPrice: 46, complete: false },
      ] },
      { id: "wo_1052", bookingId: "book_2", technicianId: "usr_technician_2", status: "awaiting_approval", bay: "Bay 05", findings: "A/C actuator is binding and refrigerant pressure is below specification.", updatedAt: "2026-08-19T08:42:00.000Z", tasks: [
        { id: "task_4", name: "HVAC actuator replacement", type: "part", quantity: 1, unitPrice: 184, complete: false },
        { id: "task_5", name: "A/C evac and recharge", type: "labor", quantity: 1.2, unitPrice: 96, complete: false },
      ] },
      { id: "wo_0991", bookingId: "book_4", technicianId: "usr_technician", status: "completed", bay: "Bay 02", findings: "Annual service completed. No additional safety issues found.", updatedAt: "2026-03-11T15:10:00.000Z", tasks: [
        { id: "task_6", name: "Annual inspection", type: "labor", quantity: 1, unitPrice: 145, complete: true },
        { id: "task_7", name: "Brake fluid", type: "part", quantity: 1, unitPrice: 32, complete: true },
      ] },
    ],
    estimates: [
      { id: "est_7201", workOrderId: "wo_1048", lineItems: [
        { description: "Engine oil and filter", quantity: 1, unitPrice: 118 },
        { description: "Front brake disc resurfacing", quantity: 1.5, unitPrice: 92 },
        { description: "Cabin air filter", quantity: 1, unitPrice: 46 },
      ], total: 302, approvalStatus: "approved", createdAt: "2026-08-19T08:58:00.000Z" },
      { id: "est_7208", workOrderId: "wo_1052", lineItems: [
        { description: "HVAC actuator replacement", quantity: 1, unitPrice: 184 },
        { description: "A/C evac and recharge", quantity: 1.2, unitPrice: 96 },
      ], total: 299.2, approvalStatus: "pending", createdAt: "2026-08-19T08:46:00.000Z" },
    ],
    invoices: [
      { id: "inv_3024", workOrderId: "wo_0991", invoiceNumber: "INV-2026-3024", lineItems: [
        { description: "Annual inspection", quantity: 1, unitPrice: 145 },
        { description: "Brake fluid", quantity: 1, unitPrice: 32 },
      ], subtotal: 177, tax: 14.16, total: 191.16, paymentStatus: "paid", issuedAt: "2026-03-11T15:15:00.000Z" },
    ],
    activity: [
      { id: "act_1", label: "Repair started for WO-1048", detail: "Marcus moved the Volvo XC60 into Bay 03", at: "2026-08-19T09:18:00.000Z" },
      { id: "act_2", label: "Estimate EST-7208 sent", detail: "Customer approval is pending", at: "2026-08-19T08:46:00.000Z" },
      { id: "act_3", label: "Inspection completed for WO-1052", detail: "Sofia recorded two recommended tasks", at: "2026-08-19T08:42:00.000Z" },
    ],
  };
}

export const demoStore = createDemoStore();
