import { BookingStatus, PaymentStatus, GuestDetails, AuditoriumRequirements } from './common.types';
import { PropertyDTO, RoomDTO, RoomTypeDTO } from './property.types';
import { UserDTO } from './user.types';

export interface BookingDTO {
  id: string;
  bookingNumber: string;
  userId: string;
  propertyId: string;
  roomTypeId: string;
  quantity: number;
  checkInDate: string;
  checkOutDate: string;
  guestDetails: GuestDetails;
  specialRequirements: string;
  status: BookingStatus;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;
  otp: string;
  otpExpiresAt?: string;
  rejectionReason: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  property?: PropertyDTO;
  roomType?: RoomTypeDTO;
  user?: UserDTO;
  allocations?: BookingAllocationDTO[];
  occupants?: BookingOccupantDTO[];
  isGuestBooking?: boolean;
}

export interface CreateBookingDTO {
  propertyId: string;
  roomTypeId: string;
  quantity: number;
  checkInDate: string;
  checkOutDate: string;
  guestDetails: GuestDetails;
  specialRequirements?: string;
  auditoriumRequirements?: AuditoriumRequirements;
}

export interface UpdateBookingDTO {
  checkInDate?: string;
  checkOutDate?: string;
  quantity?: number;
  specialRequirements?: string;
  notes?: string;
}

export type OccupantRelation = 'primary' | 'spouse' | 'child' | 'parent' | 'other';
export type OccupantIdProofType = 'aadhaar' | 'pan' | 'passport' | 'driving_licence' | 'voter_id';

export interface BookingOccupantDTO {
  id: string;
  bookingId: string;
  fullName: string;
  relation: OccupantRelation;
  idProofType: OccupantIdProofType | '';
  idProofNumber: string;
  aadhaarUrl: string;
  panUrl: string;
  photoUrl: string;
  createdAt: string;
}

export interface CreateBookingOccupantDTO {
  bookingId: string;
  fullName: string;
  relation: OccupantRelation;
  idProofType: OccupantIdProofType | '';
  idProofNumber: string;
  aadhaarUrl?: string;
  panUrl?: string;
  photoUrl?: string;
}

export interface BookingAllocationDTO {
  id: string;
  bookingId: string;
  roomId: string;
  allocatedBy: string;
  allocatedAt: string;
  checkInTime?: string;
  checkOutTime?: string;
  guestSignature: string;
  room?: RoomDTO;
}

export interface CreateAllocationDTO {
  bookingId: string;
  roomId: string;
}

export interface TransactionDTO {
  id: string;
  bookingId: string;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentGatewayResponse: Record<string, any>;
  createdAt: string;
}

export interface CreateTransactionDTO {
  bookingId: string;
  amount: number;
  paymentMethod: string;
}

export interface AuditLogDTO {
  id: string;
  tableName: string;
  recordId: string;
  action: string;
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
  userId?: string;
  createdAt: string;
}

export interface AdHocLinkDTO {
  id: string;
  token: string;
  managerId: string;
  propertyId: string;
  expiresAt: string;
  metadata: Record<string, any>;
  used: boolean;
  usedAt?: string;
  createdAt: string;
}

export interface CreateAdHocLinkDTO {
  propertyId: string;
  expiresAt: string;
  metadata?: Record<string, any>;
}

export interface BookingFilters {
  userId?: string;
  propertyId?: string;
  status?: BookingStatus;
  fromDate?: string;
  toDate?: string;
  roomTypeId?: string;
}

export interface AvailabilityCheckDTO {
  propertyId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  quantity: number;
}

export interface AvailabilityResultDTO {
  available: boolean;
  availableRooms: RoomDTO[];
  totalAvailable: number;
}

export type BookingServiceType = 'GRIEVANCE' | 'MAINTENANCE' | 'EXTENSION' | 'CANCELLATION_REQUEST' | 'GENERAL';
export type BookingServiceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type BookingServiceUrgency = 'LOW' | 'MEDIUM' | 'HIGH';
export type BookingServiceAuthorRole = 'employee' | 'manager' | 'system';

export interface BookingServiceRequestDTO {
  id: string;
  bookingId: string;
  employeeId: string;
  serviceType: BookingServiceType;
  requestStatus: BookingServiceStatus;
  subject: string;
  remarks: string;
  urgencyLevel: BookingServiceUrgency;
  eoNotes: string;
  documentUrl: string;
  createdAt: string;
  updatedAt: string;
  chats?: BookingServiceChatDTO[];
}

export type ChatDeliveryMode = 'IN_APP' | 'EMAIL' | 'SMS' | 'WA';

export interface BookingServiceChatDTO {
  id: string;
  serviceRequestId: string;
  authorId: string;
  authorRole: BookingServiceAuthorRole;
  message: string;
  documentUrls: string[];
  deliveryMode: ChatDeliveryMode;
  createdAt: string;
}

export interface CreateBookingServiceRequestDTO {
  bookingId: string;
  serviceType: BookingServiceType;
  subject: string;
  remarks: string;
  urgencyLevel?: BookingServiceUrgency;
  documentUrl?: string;
}
