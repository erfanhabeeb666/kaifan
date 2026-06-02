import api from './axios';
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  DashboardResponse,
  AnalyticsResponse,
  EmployeeResponse,
  CallLogResponse,
  QueueEntryResponse,
  AuditLogResponse,
  PageResponse,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  CallStatus,
  EmployeeStatus,
  CustomerResponse,
  SaveCustomerRequest,
  UpdateCustomerNameRequest,
} from '../types';

// Auth
export const login = (data: LoginRequest) =>
  api.post<ApiResponse<AuthResponse>>('/auth/login', data);

export const refreshToken = (refreshToken: string) =>
  api.post<ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken });

// Dashboard
export const getDashboard = () =>
  api.get<ApiResponse<DashboardResponse>>('/api/dashboard');

export const getAnalytics = () =>
  api.get<ApiResponse<AnalyticsResponse>>('/api/dashboard/analytics');

// Employees
export const getEmployees = () =>
  api.get<ApiResponse<EmployeeResponse[]>>('/api/employees');

export const getActiveEmployees = () =>
  api.get<ApiResponse<EmployeeResponse[]>>('/api/employees/active');

export const getEmployee = (id: number) =>
  api.get<ApiResponse<EmployeeResponse>>(`/api/employees/${id}`);

export const createEmployee = (data: CreateEmployeeRequest) =>
  api.post<ApiResponse<EmployeeResponse>>('/api/employees', data);

export const updateEmployee = (id: number, data: UpdateEmployeeRequest) =>
  api.put<ApiResponse<EmployeeResponse>>(`/api/employees/${id}`, data);

export const updateEmployeeStatus = (id: number, status: EmployeeStatus) =>
  api.patch<ApiResponse<EmployeeResponse>>(`/api/employees/${id}/status`, { status });

export const deactivateEmployee = (id: number) =>
  api.delete<ApiResponse<void>>(`/api/employees/${id}`);

// Call Logs
export const getActiveCalls = () =>
  api.get<ApiResponse<CallLogResponse[]>>('/api/calls/active');

export const getCallHistory = (params: {
  callerNumber?: string;
  status?: CallStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}) => api.get<ApiResponse<PageResponse<CallLogResponse>>>('/api/calls/history', { params });

export const initiateCallback = (id: number) =>
  api.post<ApiResponse<CallLogResponse>>(`/api/calls/${id}/callback`);

// Queue
export const getQueue = () =>
  api.get<ApiResponse<QueueEntryResponse[]>>('/api/queue');

export const getAllQueueEntries = () =>
  api.get<ApiResponse<QueueEntryResponse[]>>('/api/queue/all');

export const getQueueLength = () =>
  api.get<ApiResponse<number>>('/api/queue/length');

export const removeFromQueue = (id: number) =>
  api.delete<ApiResponse<void>>(`/api/queue/${id}`);

export const markAbandoned = (id: number) =>
  api.patch<ApiResponse<void>>(`/api/queue/${id}/abandon`);

// Audit
export const getAuditLogs = (params: { page?: number; size?: number }) =>
  api.get<ApiResponse<PageResponse<AuditLogResponse>>>('/api/audit', { params });

// Customers
export const getCustomers = (params?: { query?: string; page?: number; size?: number }) =>
  api.get<ApiResponse<PageResponse<CustomerResponse>>>('/api/customers', { params });

export const createCustomer = (data: SaveCustomerRequest) =>
  api.post<ApiResponse<CustomerResponse>>('/api/customers', data);

export const updateCustomerName = (id: number, data: UpdateCustomerNameRequest) =>
  api.put<ApiResponse<CustomerResponse>>(`/api/customers/${id}`, data);

export const deleteCustomer = (id: number) =>
  api.delete<ApiResponse<void>>(`/api/customers/${id}`);
