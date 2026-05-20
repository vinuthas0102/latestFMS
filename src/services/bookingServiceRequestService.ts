import { supabase } from '../lib/supabase';
import {
  BookingServiceRequestDTO,
  BookingServiceChatDTO,
  BookingServiceStatus,
  CreateBookingServiceRequestDTO,
} from '../types';
import { DEMO_MODE } from '../mocks/demoData';

// Demo service requests keyed by booking id — used in DEMO_MODE to bypass RLS
const DEMO_BOOKING_SERVICES: Record<string, BookingServiceRequestDTO[]> = {
  // BK2026051800011 — CHECKED_IN, 2 active service requests
  'dd000002-0000-4000-a000-000000000002': [
    {
      id: 'aa000002-0000-4000-8000-000000000002',
      bookingId: 'dd000002-0000-4000-a000-000000000002',
      employeeId: '5f865f74-aeab-4885-a898-80ba3da33ae0',
      serviceType: 'MAINTENANCE',
      requestStatus: 'OPEN',
      subject: 'Bathroom tap leaking',
      remarks: 'The cold water tap in the attached bathroom has been dripping since day 1. Please repair.',
      urgencyLevel: 'HIGH',
      eoNotes: '',
      documentUrl: '',
      createdAt: '2026-05-17T08:30:00Z',
      updatedAt: '2026-05-17T08:30:00Z',
    },
    {
      id: 'aa000003-0000-4000-8000-000000000003',
      bookingId: 'dd000002-0000-4000-a000-000000000002',
      employeeId: '5f865f74-aeab-4885-a898-80ba3da33ae0',
      serviceType: 'GRIEVANCE',
      requestStatus: 'IN_PROGRESS',
      subject: 'Noise from adjacent room at night',
      remarks: 'Loud noise from Room 205 between 11 PM and 1 AM. Requested intervention from management.',
      urgencyLevel: 'NORMAL',
      eoNotes: 'Estate office notified. Guest in Room 205 has been spoken to.',
      documentUrl: '',
      createdAt: '2026-05-18T22:45:00Z',
      updatedAt: '2026-05-19T09:00:00Z',
    },
  ],
  // BK2026052000023 — ALLOCATED, 1 cancellation request awaiting EO approval
  'a2000001-b000-4000-8000-000000000001': [
    {
      id: 'ab000001-0000-4000-8000-000000000001',
      bookingId: 'a2000001-b000-4000-8000-000000000001',
      employeeId: '5f865f74-aeab-4885-a898-80ba3da33ae0',
      serviceType: 'CANCELLATION_REQUEST',
      requestStatus: 'OPEN',
      subject: 'Request to cancel booking',
      remarks: 'Plans have changed due to official travel rescheduling. Requesting cancellation of this booking.',
      urgencyLevel: 'MEDIUM',
      eoNotes: '',
      documentUrl: '',
      createdAt: '2026-05-20T10:00:00Z',
      updatedAt: '2026-05-20T10:00:00Z',
    },
  ],
  // BK2026040100005 — CHECKED_OUT, 1 open maintenance request (post-vacate)
  'dffc4358-d2df-4264-9838-d402e0935bb7': [
    {
      id: 'aa000001-0000-4000-8000-000000000001',
      bookingId: 'dffc4358-d2df-4264-9838-d402e0935bb7',
      employeeId: '5f865f74-aeab-4885-a898-80ba3da33ae0',
      serviceType: 'MAINTENANCE',
      requestStatus: 'OPEN',
      subject: 'AC not cooling properly',
      remarks: 'Air conditioner in the room not cooling adequately. Needs servicing before next occupancy.',
      urgencyLevel: 'MEDIUM',
      eoNotes: '',
      documentUrl: '',
      createdAt: '2026-04-03T06:00:00Z',
      updatedAt: '2026-04-03T06:00:00Z',
    },
  ],
};

function mapRequest(row: Record<string, unknown>): BookingServiceRequestDTO {
  return {
    id: row.id as string,
    bookingId: row.booking_id as string,
    employeeId: row.employee_id as string,
    serviceType: row.service_type as BookingServiceRequestDTO['serviceType'],
    requestStatus: row.request_status as BookingServiceStatus,
    subject: row.subject as string,
    remarks: row.remarks as string,
    urgencyLevel: row.urgency_level as BookingServiceRequestDTO['urgencyLevel'],
    eoNotes: row.eo_notes as string,
    documentUrl: row.document_url as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapChat(row: Record<string, unknown>): BookingServiceChatDTO {
  return {
    id: row.id as string,
    serviceRequestId: row.service_request_id as string,
    authorId: row.author_id as string,
    authorRole: row.author_role as BookingServiceChatDTO['authorRole'],
    message: row.message as string,
    documentUrls: (row.document_urls as string[]) ?? [],
    deliveryMode: (row.delivery_mode as BookingServiceChatDTO['deliveryMode']) ?? 'IN_APP',
    createdAt: row.created_at as string,
  };
}

export const bookingServiceRequestService = {
  async getServiceRequests(bookingId: string): Promise<BookingServiceRequestDTO[]> {
    if (DEMO_MODE) return Promise.resolve(DEMO_BOOKING_SERVICES[bookingId] ?? []);
    const { data, error } = await supabase
      .from('booking_service_requests')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRequest);
  },

  async createServiceRequest(
    userId: string,
    input: CreateBookingServiceRequestDTO,
  ): Promise<BookingServiceRequestDTO> {
    const { data, error } = await supabase
      .from('booking_service_requests')
      .insert({
        booking_id: input.bookingId,
        employee_id: userId,
        service_type: input.serviceType,
        subject: input.subject,
        remarks: input.remarks,
        urgency_level: input.urgencyLevel ?? 'MEDIUM',
        document_url: input.documentUrl ?? '',
      })
      .select()
      .single();
    if (error) throw error;
    return mapRequest(data);
  },

  async updateServiceStatus(requestId: string, status: BookingServiceStatus): Promise<void> {
    if (DEMO_MODE) {
      for (const list of Object.values(DEMO_BOOKING_SERVICES)) {
        const svc = list.find(s => s.id === requestId);
        if (svc) { svc.requestStatus = status; svc.updatedAt = new Date().toISOString(); }
      }
      return;
    }
    const { error } = await supabase
      .from('booking_service_requests')
      .update({ request_status: status, updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw error;
  },

  async getServiceChats(serviceRequestId: string): Promise<BookingServiceChatDTO[]> {
    const { data, error } = await supabase
      .from('booking_service_chats')
      .select('*')
      .eq('service_request_id', serviceRequestId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapChat);
  },

  async addServiceChat(
    serviceRequestId: string,
    authorId: string,
    authorRole: BookingServiceChatDTO['authorRole'],
    message: string,
    documentUrls: string[] = [],
    deliveryMode: BookingServiceChatDTO['deliveryMode'] = 'IN_APP',
  ): Promise<BookingServiceChatDTO> {
    const { data, error } = await supabase
      .from('booking_service_chats')
      .insert({
        service_request_id: serviceRequestId,
        author_id: authorId,
        author_role: authorRole,
        message,
        document_urls: documentUrls,
        delivery_mode: deliveryMode,
      })
      .select()
      .single();
    if (error) throw error;
    return mapChat(data);
  },
};
