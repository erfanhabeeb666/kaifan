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
  recordingUrl?: string | null;
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

export interface AgentDiallingResponse {
  callSid: string;
  dialWhomNumber: string;
  callerNumber: string | null;
  status: string | null;
  agentName: string | null;
  agentId: number | null;
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
  deliveryAddress?: string;
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

export interface MenuItemDto {
  id: number;
  itemId: string;
  itemName: string;
  itemDescription: string | null;
  price: number;
  categoryId: string;
  itemTax: number;
  taxType: number;
  itemType: string;
  inStock: boolean;
  variationGroupName: string | null;
  itemImageUrl: string | null;
  itemAllowAddon: number;
}

export interface MenuCategoryDto {
  id: number;
  categoryId: string;
  categoryName: string;
  rank: number;
  parentCategoryId: string | null;
}

export interface VariationDto {
  id: number;
  variationId: string;
  variationName: string;
  variationGroupName: string | null;
  itemId: string;
  price: number;
  inStock: boolean;
}

export interface AddonGroupDto {
  id: number;
  addonGroupId: string;
  addonGroupName: string;
  rank: number;
  minQuantity: number;
  maxQuantity: number;
}

export interface AddonItemDto {
  id: number;
  addonItemId: string;
  addonItemName: string;
  addonGroupId: string;
  price: number;
  inStock: boolean;
}

export interface ItemAddonMappingDto {
  itemId: string;
  addonGroupId: string;
}

export interface MenuResponseDto {
  categories: MenuCategoryDto[];
  items: MenuItemDto[];
  variations: VariationDto[];
  addonGroups: AddonGroupDto[];
  addonItems: AddonItemDto[];
  itemAddonMappings: ItemAddonMappingDto[];
  lastSyncedAt: string | null;
}

export interface OrderItemRequest {
  petpoojaItemId: string;
  itemName: string;
  quantity: number;
  price: number;
  variationId?: string;
  variationName?: string;
  variationPrice?: number;
  addons?: Array<{ addonId: string; addonName: string; price: number }>;
  itemNotes?: string;
}

export interface CreateOrderRequest {
  customerPhone: string;
  customerName?: string;
  deliveryAddress?: string;
  orderType: string;
  paymentType: string;
  items: OrderItemRequest[];
  packingCharges?: number;
  deliveryCharges?: number;
  discountAmount?: number;
  preorderDate?: string;
  preorderTime?: string;
  notes?: string;
}

export interface CallCenterOrderItemResponse {
  id: number;
  petpoojaItemId: string;
  itemName: string;
  quantity: number;
  price: number;
  finalPrice: number;
  variationId: string | null;
  variationName: string | null;
  addonsJson: string | null;
  taxAmount: number;
  itemNotes: string | null;
}

export interface CallCenterOrderResponse {
  id: number;
  orderId: string;
  petpoojaOrderId: string | null;
  customerPhone: string;
  customerName: string | null;
  deliveryAddress: string | null;
  orderType: string;
  paymentType: string;
  orderStatus: string;
  subtotal: number;
  packingCharges: number;
  deliveryCharges: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  createdBy: string | null;
  items: CallCenterOrderItemResponse[];
  createdAt: string;
}

