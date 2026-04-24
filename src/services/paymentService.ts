import { supabase } from '../lib/supabase';
import { TransactionDTO } from '../types';

export const paymentService = {
  processPayment: async (
    bookingId: string,
    amount: number,
    shouldSucceed: boolean = true
  ): Promise<TransactionDTO> => {
    const mockTransactionId = `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const mockResponse = {
      gateway: 'IBL-ATOM',
      transactionId: mockTransactionId,
      status: shouldSucceed ? 'SUCCESS' : 'FAILURE',
      timestamp: new Date().toISOString(),
      message: shouldSucceed ? 'Payment processed successfully' : 'Payment failed',
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          booking_id: bookingId,
          transaction_id: mockTransactionId,
          amount: amount,
          payment_method: 'IBL-ATOM',
          payment_status: shouldSucceed ? 'SUCCESS' : 'FAILURE',
          payment_gateway_response: mockResponse,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    if (shouldSucceed) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('paid_amount, total_amount')
        .eq('id', bookingId)
        .maybeSingle();

      if (booking) {
        const newPaidAmount = parseFloat(booking.paid_amount) + amount;
        const totalAmount = parseFloat(booking.total_amount);
        const balanceAmount = totalAmount - newPaidAmount;

        await supabase
          .from('bookings')
          .update({
            paid_amount: newPaidAmount,
            balance_amount: balanceAmount,
            payment_status:
              balanceAmount <= 0 ? 'COMPLETED' : newPaidAmount > 0 ? 'PARTIAL' : 'PENDING',
          })
          .eq('id', bookingId);
      }
    }

    return mapTransactionFromDb(data);
  },

  getTransactions: async (bookingId: string): Promise<TransactionDTO[]> => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(mapTransactionFromDb);
  },
};

function mapTransactionFromDb(dbTransaction: any): TransactionDTO {
  return {
    id: dbTransaction.id,
    bookingId: dbTransaction.booking_id,
    transactionId: dbTransaction.transaction_id,
    amount: parseFloat(dbTransaction.amount),
    paymentMethod: dbTransaction.payment_method,
    paymentStatus: dbTransaction.payment_status,
    paymentGatewayResponse: dbTransaction.payment_gateway_response || {},
    createdAt: dbTransaction.created_at,
  };
}
