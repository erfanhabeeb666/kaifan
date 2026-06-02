// Types matching the backend DTOs

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  fullName: string;
  role: string;
  employeeId: number | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type EmployeeStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';
export type CallStatus = 'INCOMING' | 'QUEUED' | 'CONNECTED' | 'COMPLETED' | 'MISSED' | 'ABANDONED';
export type QueueStatus = 'WAITING' | 'CONNECTED' | 'COMPLETED' | 'ABANDONED';

export interface EmployeeResponse {
  id: number;
  name: string;
  phoneNumber: string;
  status: EmployeeStatus;
  active: boolean;
  lastIdleSince: string | null;
  createdAt: string;
}

export interface CallLogResponse {
  id: number;
  callSid: string;
  callerNumber: string;
  customerName?: string | null;
  status: CallStatus;
  employeeName: string | null;
  employeeId: number | null;
  startTime: string;
  answerTime: string | null;
  endTime: string | null;
  durationSeconds: number | null;
  missed: boolean;
  createdAt: string;
}

export interface QueueEntryResponse {
  id: number;
  callerNumber: string;
  customerName?: string | null;
  callSid: string | null;
  queuePosition: number;
  queuedAt: string;
  connectedAt: string | null;
  waitTimeSeconds: number | null;
  status: QueueStatus;
}

export interface AnalyticsResponse {
  callsToday: number;
  callsThisWeek: number;
  callsThisMonth: number;
  answeredCalls: number;
  missedCalls: number;
  averageWaitTimeSeconds: number | null;
  longestWaitTimeSeconds: number | null;
  averageCallDurationSeconds: number | null;
  currentQueueLength: number;
}

export interface DashboardResponse {
  activeCall: CallLogResponse | null;
  queueEntries: QueueEntryResponse[];
  employees: EmployeeResponse[];
  analytics: AnalyticsResponse;
}

export interface AuditLogResponse {
  id: number;
  username: string;
  action: string;
  details: string;
  ipAddress: string | null;
  timestamp: string;
}

export interface WebSocketEvent {
  type: string;
  payload: unknown;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface CreateEmployeeRequest {
  name: string;
  phoneNumber: string;
}

export interface UpdateEmployeeRequest {
  name?: string;
  phoneNumber?: string;
  active?: boolean;
}

export interface CustomerResponse {
  id: number;
  phoneNumber: string;
  name: string | null;
  deliveryAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveCustomerRequest {
  phoneNumber: string;
  name?: string;
  deliveryAddress?: string;
}

export interface UpdateCustomerNameRequest {
  name: string;
}

// PetPooja types
export interface PetpoojaOrderItem {
  name: string;
  quantity: number;
  price: number;
  variant: string | null;
  addons: string[] | null;
}

export interface PetpoojaOrderResponse {
  id: number;
  petpoojaOrderId: string;
  customerPhone: string;
  customerName: string | null;
  deliveryAddress: string | null;
  orderStatus: string | null;
  orderType: string | null;
  items: PetpoojaOrderItem[];
  totalAmount: number | null;
  discountAmount: number | null;
  taxAmount: number | null;
  deliveryCharge: number | null;
  paymentMode: string | null;
  orderPlacedAt: string | null;
}

export interface CustomerDetailResponse {
  customerId: number | null;
  phoneNumber: string;
  name: string | null;
  deliveryAddress: string | null;
  customerSince: string | null;
  totalOrders: number;
  totalSpent: number;
  recentOrders: PetpoojaOrderResponse[];
}
