import { db } from '../../../lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    const body = await request.json();
    const { customerName, customerPhone, paymentMethod, notes, items, totalAmount, status, paymentStatus } = body;

    // Validate items
    if (!items || items.length === 0) {
      return Response.json({ error: 'No items in sale' }, { status: 400 });
    }

    // Check stock availability and deduct inventory
    for (const item of items) {
      const productRef = doc(db, 'products', item.productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        return Response.json({ error: `Product ${item.productName} not found` }, { status: 404 });
      }

      const productData = productSnap.data();
      const variantIndex = productData.variants?.findIndex(v => v.id === item.variantId);

      if (variantIndex === -1) {
        return Response.json({ error: `Variant not found for ${item.productName}` }, { status: 404 });
      }

      const variant = productData.variants[variantIndex];
      
      // Check stock
      if (variant.stock < item.quantity) {
        return Response.json({ 
          error: `Insufficient stock for ${item.productName}. Available: ${variant.stock}, Requested: ${item.quantity}` 
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

    // Create manual sale record
    const saleData = {
      customerName,
      customerPhone: customerPhone || null,
      paymentMethod,
      notes: notes || null,
      items,
      totalAmount,
      status: status || 'completed',
      paymentStatus: paymentStatus || 'paid',
      saleType: 'manual',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const saleRef = await addDoc(collection(db, 'manual_sales'), saleData);

    return Response.json({ 
      success: true, 
      saleId: saleRef.id,
      message: 'Sale recorded successfully and inventory updated'
    });

  } catch (error) {
    console.error('Manual sale error:', error);
    return Response.json({ 
      error: 'Failed to record sale',
      message: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const salesQuery = query(
      collection(db, 'manual_sales'),
      orderBy('createdAt', 'desc')
    );
    
    const salesSnapshot = await getDocs(salesQuery);
    const sales = salesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    }));

    return Response.json({ success: true, data: sales });
  } catch (error) {
    console.error('Error fetching manual sales:', error);
    return Response.json({ 
      error: 'Failed to fetch sales',
      message: error.message 
    }, { status: 500 });
  }
}