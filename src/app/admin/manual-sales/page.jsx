"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, X, Search, Loader2, DollarSign, Phone, User as UserIcon, Package } from "lucide-react";
import { toast } from "sonner";
import { getProducts } from "@/utils/firebaseData";

export default function ManualSalesPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const [saleForm, setSaleForm] = useState({
    customerName: "",
    customerPhone: "",
    paymentMethod: "cash",
    notes: "",
    items: [],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState(null);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      return await getProducts();
    },
  });

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItemToSale = () => {
    if (!selectedProduct || !selectedVariant) {
      toast.error("Please select a product and variant");
      return;
    }

    if (selectedVariant.stock < quantity) {
      toast.error(`Only ${selectedVariant.stock} items in stock`);
      return;
    }

    const basePrice = selectedVariant.price || selectedProduct.basePrice;
    // Ensure customPrice state is respected if it was typed
    const finalPrice = customPrice !== null ? customPrice : basePrice;

    const newItem = {
      productId: selectedProduct.id,
      variantId: selectedVariant.id,
      productName: selectedProduct.name,
      variantInfo: {
        size: selectedVariant.size,
        color: selectedVariant.color,
        sku: selectedVariant.sku || '',
        material: selectedVariant.material || '',
        fullDetails: `${selectedVariant.size} - ${selectedVariant.color}${selectedVariant.material ? ` - ${selectedVariant.material}` : ''}`,
      },
      quantity: quantity,
      basePrice: basePrice,
      price: finalPrice,
      discountAmount: customPrice !== null ? (basePrice - customPrice) : 0,
    };

    setSaleForm({
      ...saleForm,
      items: [...saleForm.items, newItem],
    });

    // Reset selection
    setSelectedProduct(null);
    setSelectedVariant(null);
    setQuantity(1);
    setSearchTerm("");
    setCustomPrice(null);
  };

  const removeItem = (index) => {
    setSaleForm({
      ...saleForm,
      items: saleForm.items.filter((_, i) => i !== index),
    });
  };

  const calculateTotal = () => {
    return saleForm.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const recordSaleMutation = useMutation({
    mutationFn: async (saleData) => {
      const response = await fetch('/api/manual-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to record sale');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["manual-sales"]);
      toast.success("Sale recorded successfully!");
      setSaleForm({
        customerName: "",
        customerPhone: "",
        paymentMethod: "cash",
        notes: "",
        items: [],
      });
      setIsAdding(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record sale");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (saleForm.items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    if (!saleForm.customerName) {
      toast.error("Please enter customer name");
      return;
    }

    const saleData = {
      ...saleForm,
      totalAmount: calculateTotal(),
      status: 'completed',
      paymentStatus: 'paid',
    };

    recordSaleMutation.mutate(saleData);
  };

  return (
    <div className="space-y-4">
        <header className="flex justify-between items-end mb-12">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
              Sales Management
            </span>
            <h1 className="text-4xl font-black tracking-tighter uppercase">
              Manual Sales Entry
            </h1>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center space-x-3 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition-all shadow-xl shadow-black/10"
          >
            {isAdding ? (
              <X className="h-5 w-5" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
            <span>{isAdding ? "Cancel" : "New Sale"}</span>
          </button>
        </header>

        {isAdding ? (
          <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 max-w-6xl mx-auto space-y-10">
            <section className="space-y-6">
              <h2 className="text-xl font-black uppercase tracking-widest pb-4 border-b border-gray-100">
                Customer Info
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Customer Name
                  </label>
                  <input
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                    value={saleForm.customerName}
                    onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Phone Number (Optional)
                  </label>
                  <input
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                    value={saleForm.customerPhone}
                    onChange={(e) => setSaleForm({ ...saleForm, customerPhone: e.target.value })}
                    placeholder="024 XXX XXXX"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Payment Method
                  </label>
                  <select
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold appearance-none"
                    value={saleForm.paymentMethod}
                    onChange={(e) => setSaleForm({ ...saleForm, paymentMethod: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="momo">Mobile Money</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-black uppercase tracking-widest pb-4 border-b border-gray-100">
                Add Products
              </h2>
              
              {/* Product Search */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Search Product
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      className="w-full pl-12 px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name..."
                    />
                  </div>
                  
                  {searchTerm && filteredProducts && filteredProducts.length > 0 && (
                    <div className="absolute z-10 bg-white border border-gray-200 rounded-2xl shadow-xl mt-2 max-h-64 overflow-y-auto w-full md:w-auto md:min-w-[400px]">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => {
                            setSelectedProduct(product);
                            setSelectedVariant(product.variants?.[0] || null);
                            setSearchTerm("");
                          }}
                          className="w-full px-4 py-3 hover:bg-gray-50 text-left flex items-center gap-3 border-b last:border-b-0"
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                            {product.images?.[0] && (
                              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{product.name}</p>
                            <p className="text-xs text-gray-500">GH₵{product.basePrice?.toLocaleString()}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedProduct && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Variant
                      </label>
                      <select
                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold appearance-none"
                        value={selectedVariant?.id || ""}
                        onChange={(e) => {
                          const variant = selectedProduct.variants?.find(v => v.id === e.target.value);
                          setSelectedVariant(variant || null);
                        }}
                      >
                        {selectedProduct.variants?.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.size} - {variant.color}{variant.material ? ` - ${variant.material}` : ''} (Stock: {variant.stock}) {variant.sku ? `[${variant.sku}]` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={selectedVariant?.stock || 1}
                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex justify-between pr-2">
                        Custom Price (Optional)
                        {selectedProduct && <span className="text-gray-300">Default: ₵{selectedVariant?.price || selectedProduct?.basePrice || 0}</span>}
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Leave empty for default price..."
                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold placeholder:text-gray-300"
                        value={customPrice === null ? "" : customPrice}
                        onChange={(e) => setCustomPrice(e.target.value === "" ? null : Number(e.target.value))}
                      />
                    </div>
                  </>
                )}
              </div>

              {selectedProduct && (
                <button
                  onClick={addItemToSale}
                  className="w-full md:w-auto px-8 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all"
                >
                  Add to Sale
                </button>
              )}

              {/* Sale Items */}
              {saleForm.items.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Items in Sale</h3>
                  {saleForm.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex-grow">
                        <p className="font-bold">{item.productName}</p>
                        <p className="text-xs text-gray-500">
                          {item.variantInfo.size} - {item.variantInfo.color} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-lg">GH₵{(item.price * item.quantity).toLocaleString()}</span>
                        <button
                          onClick={() => removeItem(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-black uppercase tracking-widest pb-4 border-b border-gray-100">
                Notes (Optional)
              </h2>
              <textarea
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold resize-none"
                rows="3"
                value={saleForm.notes}
                onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                placeholder="Any additional notes about this sale..."
              />
            </section>

            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Amount</p>
                <p className="text-4xl font-black text-black">GH₵{calculateTotal().toLocaleString()}</p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={recordSaleMutation.isLoading || saleForm.items.length === 0}
                className="bg-black text-white py-6 px-12 rounded-3xl font-black uppercase tracking-[0.2em] text-sm hover:bg-gray-800 transition-all shadow-2xl shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {recordSaleMutation.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  "Record Sale"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-20 rounded-3xl shadow-sm border border-gray-100 text-center">
            <DollarSign className="h-16 w-16 text-gray-200 mx-auto mb-6" />
            <h3 className="text-xl font-black uppercase tracking-widest text-gray-400 mb-4">
              No Active Sale
            </h3>
            <p className="text-gray-400 font-medium mb-8">
              Click "New Sale" to record an in-person or WhatsApp sale.
            </p>
          </div>
        )}
    </div>
  );
}