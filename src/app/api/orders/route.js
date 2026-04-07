import { db } from '../../../lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      items,
      totalAmount,
      status,
      paymentMethod,
      paymentReference,
      paymentDetails,
    } = body;

    // Validate items
    if (!items || items.length === 0) {
      return Response.json({ error: 'No items in order' }, { status: 400 });
    }

    // Check stock availability and deduct inventory
    for (const item of items) {
      const productRef = doc(db, 'products', item.productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        return Response.json({ error: `Product not found` }, { status: 404 });
      }

      const productData = productSnap.data();
      const variantIndex = productData.variants?.findIndex(v => v.id === item.variantId);

      if (variantIndex === -1) {
        return Response.json({ error: `Variant not found` }, { status: 404 });
      }

      const variant = productData.variants[variantIndex];
      
      // Check stock
      if (variant.stock < item.quantity) {
        return Response.json({ 
          error: `Insufficient stock. Available: ${variant.stock}, Requested: ${item.quantity}` 
        }, { status: 400 });
      }

      // Deduct stock
      const updatedVariants = [...productData.variants];
      updatedVariants[variantIndex] = {
        ...variant,
        stock: variant.stock - item.quantity
      };

      await updateDoc(productRef, {
        variants: updatedVariants,
        updatedAt: Timestamp.now()
      });
    }

    // Create order record
    const orderData = {
      customerName,
      customerEmail: customerEmail || null,
      customerPhone,
      deliveryAddress,
      items,
      totalAmount,
      status: status || 'pending',
      paymentMethod: paymentMethod || 'paystack',
      paymentReference: paymentReference || null,
      paymentDetails: paymentDetails || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const orderRef = await addDoc(collection(db, 'orders'), orderData);

    return Response.json({ 
      success: true, 
      orderId: orderRef.id,
      message: 'Order created successfully and inventory updated'
    });

  } catch (error) {
    console.error('Create order error:', error);
    return Response.json({ 
      error: 'Failed to create order',
      message: error.message 
    }, { status: 500 });
  }
}