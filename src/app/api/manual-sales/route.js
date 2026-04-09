import { NextResponse } from 'next/server';
import { db } from '../../../services/firebase';

export const dynamic = 'force-dynamic';
import { db } from '../../../lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, deleteDoc, increment, Timestamp, query, orderBy, getDocs } from 'firebase/firestore';

export async function POST(request) {
  const method = request.method;

  try {
    if (method === 'POST') {
      const body = await request.json();
      const { customerName, customerPhone, paymentMethod, notes, items, totalAmount, status, paymentStatus } = body;

      // Validate items
      if (!items || items.length === 0) {
        return NextResponse.json({ error: 'No items in sale' }, { status: 400 });
      }

      // Check stock availability and deduct inventory
      let totalProfit = 0;
      const itemsWithSnapshots = [];

      for (const item of items) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) {
          return NextResponse.json({ error: `Product ${item.productName} not found` }, { status: 404 });
        }

        const productData = productSnap.data();
        const variantIndex = productData.variants?.findIndex(v => v.id === item.variantId);

        if (variantIndex === -1) {
          return NextResponse.json({ error: `Variant not found for ${item.productName}` }, { status: 404 });
        }

        const variant = productData.variants[variantIndex];
        
        // Robust cost detection (checks for common field name variations)
        const costPrice = Number(
          productData.costPrice || 
          productData.cost_price || 
          productData.buying_price || 
          productData.buyingPrice || 
          0
        );

        const sellingPrice = Number(item.price || 0);
        const quantity = Number(item.quantity || 1);
        const itemProfit = (sellingPrice - costPrice) * quantity;
        
        totalProfit += itemProfit;

        itemsWithSnapshots.push({
          ...item,
          costPrice: costPrice,
          profit: itemProfit
        });
        
        // Check stock
        if (variant.stock < item.quantity) {
          return NextResponse.json({ 
            error: `Insufficient stock for ${item.productName}. Available: ${variant.stock}, Requested: ${item.quantity}` 
          }, { status: 400 });
        }

        // Deduct stock
        const updatedVariants = productData.variants.map((v, idx) => {
          if (idx === variantIndex) {
            return {
              ...v,  
              stock: Math.max(0, v.stock - item.quantity)  
            };
          }
          return v;
        });

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
        items: itemsWithSnapshots,
        totalAmount,
        totalProfit,
        status: status || 'completed',
        paymentStatus: paymentStatus || 'paid',
        saleType: 'manual',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const saleRef = await addDoc(collection(db, 'manualSales'), saleData);

      return NextResponse.json({ 
        success: true, 
        saleId: saleRef.id,
        message: 'Sale recorded successfully and inventory updated'
      });
    }

    if (method === 'DELETE') {
      const body = await request.json();
      const { saleId } = body;

      if (!saleId) {
        return NextResponse.json({ error: 'Sale ID required' }, { status: 400 });
      }

      // 1. Fetch the sale to get items for stock restoration
      const saleRef = doc(db, 'manualSales', saleId);
      const saleSnap = await getDoc(saleRef);

      if (!saleSnap.exists()) {
        return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
      }

      const saleData = saleSnap.data();

      // 2. Restore stock
      for (const item of saleData.items || []) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const productData = productSnap.data();
          const updatedVariants = productData.variants?.map(v => {
            if (v.id === item.variantId) {
              return { ...v, stock: (Number(v.stock) || 0) + (Number(item.quantity) || 0) };
            }
            return v;
          });

          await updateDoc(productRef, {
            variants: updatedVariants,
            updatedAt: Timestamp.now()
          });
        }
      }

      // 3. Delete the sale record
      await deleteDoc(saleRef);

      return NextResponse.json({ success: true, message: 'Sale deleted and stock restored' });
    }

    if (method === 'PUT') {
      const body = await request.json();
      const { saleId, updates } = body;

      if (!saleId || !updates) {
        return NextResponse.json({ error: 'Sale ID and updates required' }, { status: 400 });
      }

      const saleRef = doc(db, 'manualSales', saleId);
      
      // We only allow editing metadata to prevent inventory desync via simple PUT
      // To edit items, user should delete and re-add.
      const allowedUpdates = {
        customerName: updates.customerName,
        customerPhone: updates.customerPhone,
        notes: updates.notes,
        paymentMethod: updates.paymentMethod,
        status: updates.status,
        paymentStatus: updates.paymentStatus,
        updatedAt: Timestamp.now()
      };

      // Remove undefined fields
      Object.keys(allowedUpdates).forEach(key => 
        allowedUpdates[key] === undefined && delete allowedUpdates[key]
      );

      await updateDoc(saleRef, allowedUpdates);

      return NextResponse.json({ success: true, message: 'Sale updated' });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });

  } catch (error) {
    console.error(`Manual sale ${method} error:`, error);
    return NextResponse.json({ 
      error: `Failed to ${method.toLowerCase()} sale`,
      message: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const salesQuery = query(
      collection(db, 'manualSales'),
      orderBy('createdAt', 'desc')
    );
    
    const salesSnapshot = await getDocs(salesQuery);
    const sales = salesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    }));

    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    console.error('Error fetching manual sales:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch sales',
      message: error.message 
    }, { status: 500 });
  }
}