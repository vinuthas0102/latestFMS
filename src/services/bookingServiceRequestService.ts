import { supabase } from '../lib/supabase';
import {
  BookingServiceRequestDTO,
  BookingServiceChatDTO,
  BookingServiceStatus,
  CreateBookingServiceRequestDTO,
} from '../types';

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
    createdAt: row.created_at as string,
  };
}

export const bookingServiceRequestService = {
  async getServiceRequests(bookingId: string): Promise<BookingServiceRequestDTO[]> {
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
  ): Promise<BookingServiceChatDTO> {
    const { data, error } = await supabase
      .from('booking_service_chats')
      .insert({
        service_request_id: serviceRequestId,
        author_id: authorId,
        author_role: authorRole,
        message,
        document_urls: documentUrls,
      })
      .select()
      .single();
    if (error) throw error;
    return mapChat(data);
  },
};
