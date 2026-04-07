"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Check, ArrowLeft, MessageCircle, Truck, ShieldCheck } from "lucide-react";
import useCart from "@/store/useCart";
import { toast } from "sonner";
import PaystackCheckout from "@/components/PaystackCheckout";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart, addItem } = useCart();
  const [paymentMade, setPaymentMade] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [user] = useState({ name: '', email: '' }); // Placeholder user data
  const [checkoutData, setCheckoutData] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [productPrice, setProductPrice] = useState(0);

  // Load checkout data from product page
  useEffect(() => {
    const storedCheckoutData = localStorage.getItem('checkoutData');
    if (storedCheckoutData) {
      const data = JSON.parse(storedCheckoutData);
      setCheckoutData(data);
      setSelectedColor(data.color || '');
      
      // Fetch and set the price
      if (data.product && data.variant) {
        const price = data.variant?.price || data.product?.basePrice || 0;
        setProductPrice(price);
        
        // Pre-fill cart with product from product page
        clearCart();
        addItem(data.product, data.variant, data.quantity || 1);
      }
    }
  }, []);

  const handlePaystackPayment = async () => {
    setIsProcessing(true);
    
    // Debug: Log current cart state
    console.log('Current cart items:', items);
    console.log('Total price calculation:', getTotal());
    
    try {
      // Initialize Paystack (you'll need to add Paystack script to your HTML)
      const totalPrice = getTotal();
      console.log('Final total for Paystack:', totalPrice);
      
      const paystack = new window.PaystackPop({
        key: 'YOUR_PAYSTACK_PUBLIC_KEY', // Replace with your actual Paystack public key
        email: 'customer@example.com', // You'll want to collect this from user
        amount: totalPrice * 100, // Convert to kobo (cents)
        currency: 'GHS',
        ref: Math.random().toString(36).substring(2, 9),
        callback: function(response) {
          if (response.status === 'success') {
            setPaymentMade(true);
            setIsProcessing(false);
            toast.success("Payment successful! You can now proceed to WhatsApp order.");
            clearCart();
          } else {
            setIsProcessing(false);
            toast.error("Payment failed. Please try again.");
          }
        },
        onClose: function() {
          setIsProcessing(false);
        }
      });

      paystack.openIframe();
    } catch (error) {
      setIsProcessing(false);
      toast.error("Payment initialization failed. Please try again.");
      console.error('Paystack error:', error);
    }
  };

  const handleWhatsAppOrder = () => {
    const checkoutData = JSON.parse(localStorage.getItem('checkoutData') || '{}');
    const text = `Hi Carly Hub, I want to order:\nProduct: ${checkoutData.product?.name || 'N/A'}\nSize: ${checkoutData.size || 'N/A'}\nColor: ${checkoutData.color || 'N/A'}\nQuantity: ${checkoutData.quantity || 1}\nPrice: GH¢${getTotal().toLocaleString()}\nPayment Status: ${paymentMade ? 'Paid' : 'Pending'}\nURL: ${window.location.href}`;
    
    window.open(
      `https://wa.me/233123456789?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  const handleComplete = () => {
    console.log('Payment completed');
    setPaymentMade(true);
  };

  const handleCancel = () => {
    console.log('Payment cancelled');
  };

  const handleContinue = () => {
    // Navigate to success page or home page
    navigate('/');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Your cart is empty</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Simple Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Store</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {!paymentMade ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Product Info Header */}
              <div className="bg-gray-50 p-6 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  {checkoutData?.product?.images?.[0] && (
                    <img 
                      src={checkoutData.product.images[0]} 
                      alt={checkoutData.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {checkoutData?.product?.name || 'Product'}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      {checkoutData?.size && (
                        <span>Size: {checkoutData.size}</span>
                      )}
                      {selectedColor && (
                        <span>Color: {selectedColor}</span>
                      )}
                      <span>Qty: {checkoutData?.quantity || 1}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      GH¢{productPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Product Price</span>
                      <span>GH¢{productPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Quantity</span>
                      <span>{checkoutData?.quantity || 1}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>GH¢{(productPrice * (checkoutData?.quantity || 1)).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span className="text-orange-600">Calculated on WhatsApp</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-green-600">
                        GH¢{(productPrice * (checkoutData?.quantity || 1)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-sm font-medium">Secure payment via Paystack</span>
                  </div>
                </div>
                
                <PaystackCheckout 
                  cart={items}
                  total={getTotal()}
                  userProfile={user}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                />
              </div>
            </div>
          ) : (
            /* Success State */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-green-50 p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
                <p className="text-gray-600">Your order has been confirmed</p>
              </div>
              
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Product</span>
                        <span className="font-medium">{checkoutData?.product?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Color</span>
                        <span className="font-medium capitalize">{selectedColor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity</span>
                        <span className="font-medium">{checkoutData?.quantity || 1}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal Paid</span>
                        <span className="font-bold text-green-600">
                          GH¢{(productPrice * (checkoutData?.quantity || 1)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Shipping costs will be discussed on WhatsApp
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleContinue}
                    className="flex-1 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800"
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={() => window.open('https://wa.me/233123456789', '_blank')}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200"
                  >
                    Contact on WhatsApp
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}