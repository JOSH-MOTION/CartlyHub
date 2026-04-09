"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Info, Loader2, CheckCircle2, ShieldCheck, User, Phone, MessageCircle, CreditCard, Mail } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import LocationSearch from './LocationSearch';

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_STORE_WHATSAPP;

const PaystackCheckout = ({ cart, total: subtotal, userProfile, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [paymentReference, setPaymentReference] = useState(null);

  const [form, setForm] = useState({
    name: userProfile?.fullName || userProfile?.name || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    city: userProfile?.city || '',
    detailedAddress: '',
  });

  const finalTotal = subtotal;

  useEffect(() => {
    // Load Paystack script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePaystackPayment = () => {
    if (!form.name || !form.email || !form.phone) {
      alert('Please fill in all required fields');
      return;
    }

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: form.email,
      amount: finalTotal * 100, // Paystack expects amount in pesewas (kobo)
      currency: 'GHS',
      ref: 'ORD-' + Math.floor((Math.random() * 1000000000) + 1),
      metadata: {
        custom_fields: [
          {
            display_name: "Customer Name",
            variable_name: "customer_name",
            value: form.name
          },
          {
            display_name: "Phone Number",
            variable_name: "phone",
            value: form.phone
          }
        ]
      },
      callback: function(response) {
        setPaymentReference(response.reference);
        verifyPayment(response.reference);
      },
      onClose: function() {
        alert('Payment window closed');
      }
    });
    
    handler.openIframe();
  };

  const verifyPayment = async (reference, retries = 3) => {
    setLoading(true);
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference })
      });

      if (!response.ok && retries > 0) {
        // Retry after 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
        return verifyPayment(reference, retries - 1);
      }

      const data = await response.json();
      
      if (data.success && data.data.status === 'success') {
        setPaymentVerified(true);
        await deductInventory(cart);
        await createOrder(reference, data.data);
        setStep(3);
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return verifyPayment(reference, retries - 1);
      }
      console.error('Payment verification error:', error);
      alert('Payment verification failed. Please contact support with reference: ' + reference);
    } finally {
      setLoading(false);
    }
  };

  const deductInventory = async (cartItems) => {
    try {
      // Update stock for each item in Firestore
      for (const item of cartItems) {
        const productRef = doc(db, 'products', item.product.id);
        const productDoc = await getDoc(productRef);
        
        if (productDoc.exists()) {
          const productData = productDoc.data();
          const variants = productData.variants || [];
          
          // Find the specific variant and update its stock
          const updatedVariants = variants.map(variant => {
            if (variant.id === item.variant.id) {
              const currentStock = variant.stock || 0;
              const newStock = Math.max(0, currentStock - item.quantity);
              return { ...variant, stock: newStock };
            }
            return variant;
          });
          
          // Update the product with new stock levels
          await updateDoc(productRef, { variants: updatedVariants });
        }
      }
    } catch (error) {
      console.error('Error deducting inventory:', error);
      throw error;
    }
  };

  const createOrder = async (reference, paymentData) => {
    try {
      const orderData = {
        items: cart.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.variant?.price || item.product?.basePrice,
          productName: item.product?.name,
          variantInfo: {
            size: item.variant?.size,
            color: item.variant?.colorName || item.variant?.color || item.variant?.hexColor || null,
            hexColor: item.variant?.hexColor || null
          }
        })),
        totalAmount: finalTotal,
        status: 'paid',
        paymentMethod: 'paystack',
        paymentReference: reference,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        deliveryAddress: `${form.city}, ${form.detailedAddress}`,
        paymentDetails: {
          reference: paymentData.reference,
          transactionId: paymentData.id.toString(),
          amount: paymentData.amount,
          paidAt: paymentData.paid_at
        }
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      return await response.json();
    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
  };

  const handleWhatsAppMessage = () => {
    const itemsList = cart.map(item => {
      const product = item.product;
      const variant = item.variant;
      const sizeLine = variant?.size ? `\n📏 Size: ${variant.size}` : '';
      const colorText = variant?.colorName || variant?.color || variant?.hexColor;
      const colorLine = colorText ? `\n🎨 Color: ${colorText}` : '';
      return `🛍 ${product?.name}${sizeLine}${colorLine}\n📦 Qty: ${item.quantity}`;
    }).join('\n\n');

    const message = `Hello Carly Hub 👋

Payment Confirmed! 💳

Order Details:
${itemsList}

📍 Delivery Address:
${form.city}
${form.detailedAddress}

💰 Total Paid: GH₵${finalTotal.toLocaleString()}
🧾 Payment Ref: ${paymentReference}

Please confirm delivery time. Thank you! 🙏`;

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    window.open(url, '_blank');
  };

  if (step === 3) return (
    <div className="max-w-xl mx-auto py-24 px-4 text-center animate-in zoom-in duration-500">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-xl">
        <CheckCircle2 className="text-green-500" size={48} />
      </div>
      <h2 className="text-5xl font-serif font-bold text-stone-900 mb-4">Payment Successful!</h2>
      <p className="text-stone-500 mb-4 text-lg">Your order has been confirmed and paid.</p>
      <p className="text-sm text-stone-400 mb-8">Reference: {paymentReference}</p>
      
      <div className="space-y-4 mb-12">
        <button 
          onClick={handleWhatsAppMessage}
          className="w-full py-6 bg-[#25D366] text-white rounded-3xl font-bold flex items-center justify-center gap-3 hover:bg-[#128C7E] transition-all shadow-xl shadow-green-500/20 scale-105"
        >
          <MessageCircle size={24} fill="white" /> Confirm Delivery on WhatsApp
        </button>
        <button onClick={onComplete} className="w-full bg-stone-100 text-stone-600 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all">
          Back to Store
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-12 lg:p-16">
      <button onClick={onCancel} className="group flex items-center gap-3 text-stone-400 hover:text-stone-900 mb-12 font-bold text-[10px] uppercase tracking-[0.3em] transition-all">
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Cart
      </button>
      
      <div className="grid lg:grid-cols-12 gap-16 lg:gap-24">
        <div className="lg:col-span-7 space-y-12">
          <div className="flex items-center gap-8">
             <div className="flex items-center gap-4">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 1 ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-100 text-stone-400'}`}>1</div>
               <span className={`text-[10px] font-bold uppercase tracking-widest ${step === 1 ? 'text-stone-900' : 'text-stone-400'}`}>Details</span>
             </div>
             <div className="w-16 h-px bg-stone-100" />
             <div className="flex items-center gap-4">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 2 ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-100 text-stone-400'}`}>2</div>
               <span className={`text-[10px] font-bold uppercase tracking-widest ${step === 2 ? 'text-stone-900' : 'text-stone-400'}`}>Payment</span>
             </div>
          </div>

          {step === 1 ? (
            <div className="space-y-8 animate-in slide-in-from-left duration-500">
              <h2 className="text-4xl font-serif font-bold text-stone-900">Delivery Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input icon={<User size={18}/>} label="Full Name" value={form.name} onChange={(v) => setForm({...form, name: v})} placeholder="Kofi Mensah" />
                <Input icon={<Phone size={18}/>} label="Phone Number" type="tel" value={form.phone} onChange={(v) => setForm({...form, phone: v})} placeholder="024 XXX XXXX" />
              </div>
              <div className="space-y-3">
                <Input icon={<Mail size={18}/>} label="Email Address" type="email" value={form.email} onChange={(v) => setForm({...form, email: v})} placeholder="kofi@example.com" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase text-stone-400 tracking-widest block">City / Location</label>
                <LocationSearch 
                  value={form.city} 
                  onChange={(val) => setForm({...form, city: val})} 
                  placeholder="Enter your location..."
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase text-stone-400 tracking-widest block">Detailed Address</label>
                <textarea 
                  className="w-full p-6 border-2 border-stone-50 rounded-3xl outline-none focus:border-stone-900 focus:bg-white transition-all min-h-[140px] text-sm font-bold text-stone-900 bg-stone-50/50" 
                  placeholder="House number, street name, landmarks..." 
                  value={form.detailedAddress} 
                  onChange={e => setForm({...form, detailedAddress: e.target.value})}
                />
              </div>

              <button 
                disabled={!form.name || !form.email || !form.phone || !form.city || !form.detailedAddress} 
                onClick={() => setStep(2)} 
                className="w-full bg-stone-900 text-white py-6 rounded-3xl font-bold hover:bg-stone-800 disabled:bg-stone-100 disabled:text-stone-300 transition-all shadow-2xl shadow-stone-900/10"
              >
                Continue to Payment
              </button>
            </div>
          ) : (
            <div className="space-y-10 animate-in slide-in-from-right duration-500">
              <h2 className="text-4xl font-serif font-bold text-stone-900">Secure Payment</h2>
              
              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck size={24} />
                    <p className="text-sm font-bold uppercase tracking-wider">Paystack Secure Payment</p>
                  </div>
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                      <p className="text-white/80 text-xs mb-2 uppercase tracking-widest font-bold">Amount to Pay</p>
                      <h3 className="text-5xl font-serif font-bold">GH₵ {finalTotal.toLocaleString()}</h3>
                    </div>
                    <CreditCard size={64} className="text-white/20" />
                  </div>
                </div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
              </div>

              <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 space-y-2">
                <div className="flex items-center gap-2 text-blue-900">
                  <Info size={14} className="text-blue-600" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Secure Payment Notice</span>
                </div>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Your payment is processed securely through Paystack. After successful payment, you'll be able to confirm your delivery details via WhatsApp.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <button onClick={() => setStep(1)} className="px-10 py-6 border-2 border-stone-100 rounded-3xl font-bold text-stone-600 hover:bg-stone-50 transition-all">Edit Details</button>
                <button 
                  disabled={loading} 
                  onClick={handlePaystackPayment} 
                  className="flex-grow bg-green-600 text-white py-6 rounded-3xl font-bold flex items-center justify-center gap-4 hover:bg-green-700 transition-all shadow-2xl shadow-green-600/20"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : (
                    <>
                      <ShieldCheck size={24} />
                      Pay with Paystack
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="bg-stone-50 p-10 rounded-[3rem] border border-stone-100/60 sticky top-28">
            <h3 className="text-2xl font-serif font-bold text-stone-900 mb-10">Order Summary</h3>
            
            <div className="space-y-6 mb-10">
              {cart.map((item, idx) => {
                const product = item.product;
                const variant = item.variant;
                const displayImage = variant?.images?.[0] || product?.images[0];
                return (
                  <div key={idx} className="flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 bg-stone-200 rounded-xl overflow-hidden shrink-0">
                        <img src={displayImage} className="w-full h-full object-cover" alt={product?.name} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900 line-clamp-1">{product?.name}</p>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1">
                          <span>Qty: {item.quantity}</span>
                          <span className="text-stone-200 px-0.5">•</span>
                          <span>{variant?.size || 'OS'}</span>
                          {(variant?.color || variant?.colorName || variant?.hexColor) && (
                            <>
                              <span className="text-stone-200 px-0.5">•</span>
                              <span className="flex items-center gap-1">
                                {variant?.hexColor && (
                                  <span className="w-2 h-2 rounded-full border border-stone-300" style={{ backgroundColor: variant.hexColor }} />
                                )}
                                {variant?.colorName || variant?.color || 'Color'}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-stone-900 text-sm">GH₵ {((variant?.price || product?.basePrice || 0) * item.quantity).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex justify-between text-sm text-stone-400 font-medium">
                <span>Subtotal</span>
                <span>GH₵ {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-3xl font-serif font-bold text-stone-900 pt-6">
                <span>Total</span>
                <span className="text-stone-900 tracking-tight">GH₵ {finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, placeholder, type = 'text', icon }) => (
  <div className="space-y-3 group">
    <label className="text-[10px] font-bold uppercase text-stone-400 tracking-widest block transition-colors group-focus-within:text-stone-900">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-stone-900 transition-colors">{icon}</div>}
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${icon ? 'pl-16' : 'px-6'} py-6 border-2 border-stone-50 bg-stone-50/50 focus:bg-white rounded-3xl outline-none focus:border-stone-900 transition-all text-sm font-bold text-stone-900 placeholder:text-stone-200 shadow-sm`}
      />
    </div>
  </div>
);

export default PaystackCheckout;