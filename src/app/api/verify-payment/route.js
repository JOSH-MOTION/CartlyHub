import { orderService } from '../../../services/firestore';
import { OrderStatus } from '../../../types';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request) {
  try {
    const { reference, orderId } = await request.json();

    if (!reference) {
      return Response.json(
        { success: false, error: 'Reference is required' },
        { status: 400 }
      );
    }

    // Verify payment with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const verification = await response.json();

    if (!verification.status) {
      return Response.json(
        { 
          success: false, 
          error: 'Payment verification failed',
          message: verification.message 
        },
        { status: 400 }
      );
    }

    const paymentData = verification.data;

    // Check if payment was successful
    if (paymentData.status !== 'success') {
      return Response.json(
        { 
          success: false, 
          error: 'Payment was not successful',
          status: paymentData.status 
        },
        { status: 400 }
      );
    }

    // Update order in Firestore
    if (orderId) {
      await orderService.updateStatus(orderId, OrderStatus.PROCESSING);
      
      // Update payment details
      await orderService.update(orderId, {
        paymentDetails: {
          reference: paymentData.reference,
          transactionId: paymentData.id.toString(),
          verifiedAt: new Date(),
        },
      });
    }

    return Response.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        reference: paymentData.reference,
        amount: paymentData.amount,
        paidAt: paymentData.paid_at,
        customer: paymentData.customer,
        metadata: paymentData.metadata,
      },
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    
    return Response.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const reference = url.searchParams.get('reference');

    if (!reference) {
      return Response.json(
        { success: false, error: 'Reference is required' },
        { status: 400 }
      );
    }

    // Get transaction details from Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const transaction = await response.json();

    return Response.json({
      success: true,
      data: transaction.data,
    });

  } catch (error) {
    console.error('Transaction details error:', error);
    
    return Response.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
