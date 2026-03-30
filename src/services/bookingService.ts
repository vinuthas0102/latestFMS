import { supabase } from '../lib/supabase';
import {
  BookingDTO,
  CreateBookingDTO,
  UpdateBookingDTO,
  BookingFilters,
  AvailabilityCheckDTO,
  AvailabilityResultDTO,
  BookingStatus,
} from '../types';
import { generateOTP as generateOTPService, verifyOTP as verifyOTPService } from './otpService';

const GUEST_USER_ID = '00000000-0000-0000-0000-000000000001';

export const bookingService = {
  createBooking: async (userId: string, bookingData: CreateBookingDTO): Promise<BookingDTO> => {
    const bookingNumber = await generateBookingNumber();
    const otpResult = generateOTPService();

    const totalAmount = await calculateBookingAmount(
      bookingData.propertyId,
      bookingData.roomTypeId,
      bookingData.quantity,
      bookingData.checkInDate,
      bookingData.checkOutDate
    );

    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          booking_number: bookingNumber,
          user_id: userId,
          property_id: bookingData.propertyId,
          room_type_id: bookingData.roomTypeId,
          quantity: bookingData.quantity,
          check_in_date: bookingData.checkInDate,
          check_out_date: bookingData.checkOutDate,
          guest_details: bookingData.guestDetails,
          special_requirements: bookingData.specialRequirements || '',
          status: 'REQUESTED',
          total_amount: totalAmount,
          paid_amount: 0,
          balance_amount: totalAmount,
          payment_status: 'PENDING',
          otp: otpResult.otp,
          otp_expires_at: otpResult.otpExpiresAt,
          is_guest_booking: false,
        },
      ])
      .select('*, property:properties(*), roomType:room_types(*), user:users(*)')
      .single();

    if (error) throw error;
    return mapBookingFromDb(data);
  },

  createGuestBooking: async (bookingData: CreateBookingDTO, guestInfo: {
    name: string;
    email: string;
    phone: string;
  }): Promise<{ booking: BookingDTO; otp: string }> => {
    const bookingNumber = await generateBookingNumber();
    const otpResult = generateOTPService();

    const totalAmount = await calculateBookingAmount(
      bookingData.propertyId,
      bookingData.roomTypeId,
      bookingData.quantity,
      bookingData.checkInDate,
      bookingData.checkOutDate
    );

    const guestDetails = {
      ...bookingData.guestDetails,
      name: guestInfo.name,
      email: guestInfo.email,
      phone: guestInfo.phone,
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          booking_number: bookingNumber,
          user_id: GUEST_USER_ID,
          property_id: bookingData.propertyId,
          room_type_id: bookingData.roomTypeId,
          quantity: bookingData.quantity,
          check_in_date: bookingData.checkInDate,
          check_out_date: bookingData.checkOutDate,
          guest_details: guestDetails,
          special_requirements: bookingData.specialRequirements || '',
          status: 'REQUESTED',
          total_amount: totalAmount,
          paid_amount: 0,
          balance_amount: totalAmount,
          payment_status: 'PENDING',
          otp_hash: otpResult.otpHash,
          otp_expires_at: otpResult.otpExpiresAt,
          is_guest_booking: true,
        },
      ])
      .select('*, property:properties(*), roomType:room_types(*)')
      .single();

    if (error) throw error;

    return {
      booking: mapBookingFromDb(data),
      otp: otpResult.otp,
    };
  },

  getBookings: async (filters?: BookingFilters): Promise<BookingDTO[]> => {
    let query = supabase
      .from('bookings')
      .select('*, property:properties(*), roomType:room_types(*), user:users(*)');

    if (filters?.userId) query = query.eq('user_id', filters.userId);
    if (filters?.propertyId) query = query.eq('property_id', filters.propertyId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.fromDate) query = query.gte('check_in_date', filters.fromDate);
    if (filters?.toDate) query = query.lte('check_out_date', filters.toDate);
    if (filters?.roomTypeId) query = query.eq('room_type_id', filters.roomTypeId);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(mapBookingFromDb);
  },

  getBookingById: async (id: string): Promise<BookingDTO | null> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, property:properties(*), roomType:room_types(*), user:users(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapBookingFromDb(data);
  },

  updateBookingStatus: async (
    id: string,
    status: BookingStatus,
    notes?: string
  ): Promise<BookingDTO> => {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes) updateData.notes = notes;

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select('*, property:properties(*), roomType:room_types(*), user:users(*)')
      .single();

    if (error) throw error;
    return mapBookingFromDb(data);
  },

  updateBooking: async (id: string, updates: UpdateBookingDTO): Promise<BookingDTO> => {
    const updateData: any = { updated_at: new Date().toISOString() };

    if (updates.checkInDate) updateData.check_in_date = updates.checkInDate;
    if (updates.checkOutDate) updateData.check_out_date = updates.checkOutDate;
    if (updates.quantity) updateData.quantity = updates.quantity;
    if (updates.specialRequirements !== undefined)
      updateData.special_requirements = updates.specialRequirements;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select('*, property:properties(*), roomType:room_types(*), user:users(*)')
      .single();

    if (error) throw error;
    return mapBookingFromDb(data);
  },

  checkAvailability: async (
    checkData: AvailabilityCheckDTO
  ): Promise<AvailabilityResultDTO> => {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*, roomType:room_types(*), floor:floors(*, block:blocks(property_id))')
      .eq('room_type_id', checkData.roomTypeId)
      .eq('status', 'AVAILABLE')
      .eq('is_active', true);

    if (error) throw error;

    const propertyRooms = rooms.filter(
      (room: any) => room.floor?.block?.property_id === checkData.propertyId
    );

    const { data: conflictingAllocations } = await supabase
      .from('booking_allocations')
      .select('room_id, booking:bookings!inner(check_in_date, check_out_date, status)')
      .in(
        'room_id',
        propertyRooms.map((r: any) => r.id)
      )
      .in('booking.status', ['ALLOCATED', 'CHECKED_IN']);

    const conflictingRoomIds = new Set(
      (conflictingAllocations || [])
        .filter((alloc: any) => {
          const allocCheckIn = new Date(alloc.booking.check_in_date);
          const allocCheckOut = new Date(alloc.booking.check_out_date);
          const requestCheckIn = new Date(checkData.checkInDate);
          const requestCheckOut = new Date(checkData.checkOutDate);

          return (
            (requestCheckIn >= allocCheckIn && requestCheckIn < allocCheckOut) ||
            (requestCheckOut > allocCheckIn && requestCheckOut <= allocCheckOut) ||
            (requestCheckIn <= allocCheckIn && requestCheckOut >= allocCheckOut)
          );
        })
        .map((alloc: any) => alloc.room_id)
    );

    const availableRooms = propertyRooms
      .filter((room: any) => !conflictingRoomIds.has(room.id))
      .map((room: any) => ({
        id: room.id,
        floorId: room.floor_id,
        roomTypeId: room.room_type_id,
        roomNumber: room.room_number,
        capacity: room.capacity,
        basePrice: room.base_price,
        amenities: room.amenities || [],
        isSmokingAllowed: room.is_smoking_allowed,
        metadata: room.metadata || {},
        status: room.status,
        isActive: room.is_active,
        createdAt: room.created_at,
        updatedAt: room.updated_at,
        roomType: room.roomType,
        floor: room.floor,
      }));

    return {
      available: availableRooms.length >= checkData.quantity,
      availableRooms,
      totalAvailable: availableRooms.length,
    };
  },

  verifyOTP: async (bookingId: string, otp: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('otp, otp_expires_at')
      .eq('id', bookingId)
      .maybeSingle();

    if (error || !data) return false;

    const now = new Date();
    const expiresAt = new Date(data.otp_expires_at);

    return data.otp === otp && now <= expiresAt;
  },

  getBookingByBookingNumber: async (bookingNumber: string): Promise<BookingDTO | null> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, property:properties(*), roomType:room_types(*), user:users(*)')
      .eq('booking_number', bookingNumber)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapBookingFromDb(data);
  },

  getBookingByNumberAndOTP: async (bookingNumber: string, otp: string): Promise<BookingDTO | null> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, property:properties(*), roomType:room_types(*), user:users(*)')
      .eq('booking_number', bookingNumber)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    if (data.is_guest_booking) {
      const isValid = verifyOTPService(otp, data.otp_hash, data.otp_expires_at);
      if (!isValid) return null;
    } else {
      if (data.otp !== otp) return null;

      const now = new Date();
      const expiresAt = new Date(data.otp_expires_at);

      if (now > expiresAt) {
        return null;
      }
    }

    return mapBookingFromDb(data);
  },

  cancelBooking: async (bookingId: string, userId?: string): Promise<BookingDTO> => {
    const updateData: any = {
      status: 'CANCELLED',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select('*, property:properties(*), roomType:room_types(*), user:users(*)')
      .single();

    if (error) throw error;
    return mapBookingFromDb(data);
  },
};

function mapBookingFromDb(dbBooking: any): BookingDTO {
  return {
    id: dbBooking.id,
    bookingNumber: dbBooking.booking_number,
    userId: dbBooking.user_id,
    propertyId: dbBooking.property_id,
    roomTypeId: dbBooking.room_type_id,
    quantity: dbBooking.quantity,
    checkInDate: dbBooking.check_in_date,
    checkOutDate: dbBooking.check_out_date,
    guestDetails: dbBooking.guest_details || {},
    specialRequirements: dbBooking.special_requirements || '',
    status: dbBooking.status,
    totalAmount: parseFloat(dbBooking.total_amount) || 0,
    paidAmount: parseFloat(dbBooking.paid_amount) || 0,
    balanceAmount: parseFloat(dbBooking.balance_amount) || 0,
    paymentStatus: dbBooking.payment_status,
    otp: dbBooking.otp || '',
    otpExpiresAt: dbBooking.otp_expires_at,
    rejectionReason: dbBooking.rejection_reason || '',
    notes: dbBooking.notes || '',
    createdAt: dbBooking.created_at,
    updatedAt: dbBooking.updated_at,
    property: dbBooking.property,
    roomType: dbBooking.roomType,
    user: dbBooking.user,
    isGuestBooking: dbBooking.is_guest_booking || false,
  };
}

async function generateBookingNumber(): Promise<string> {
  const { data } = await supabase.rpc('generate_booking_number');
  return data || `BK${Date.now()}`;
}

async function calculateBookingAmount(
  propertyId: string,
  roomTypeId: string,
  quantity: number,
  checkInDate: string,
  checkOutDate: string
): Promise<number> {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  const { data: rooms } = await supabase
    .from('rooms')
    .select('base_price, floor:floors!inner(block:blocks!inner(property_id))')
    .eq('room_type_id', roomTypeId)
    .eq('is_active', true)
    .limit(1);

  const basePrice = rooms && rooms.length > 0 ? parseFloat(rooms[0].base_price) : 1000;

  return basePrice * nights * quantity;
}
