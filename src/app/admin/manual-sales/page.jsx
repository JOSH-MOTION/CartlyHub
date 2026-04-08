"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, X, Search, Loader2, DollarSign, Phone, User as UserIcon, Package, Edit, AlertCircle } from "lucide-react";
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

  const [editingSaleId, setEditingSaleId] = useState(null);
  const [editForm, setEditForm] = useState({
    customerName: "",
    customerPhone: "",
    notes: "",
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      return await getProducts();
    },
  });

  const { data: pastSales, isLoading: pastSalesLoading } = useQuery({
    queryKey: ["manualSales"],
    queryFn: async () => {
      const response = await fetch('/api/manual-sales');
      const result = await response.json();
      return result.data || [];
    },
  });

  const deleteSaleMutation = useMutation({
    mutationFn: async (saleId) => {
      const response = await fetch('/api/manual-sales', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId }),
      });
      if (!response.ok) throw new Error('Failed to delete sale');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["manualSales"]);
      queryClient.invalidateQueries(["products"]);
      toast.success("Sale deleted and stock restored");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateSaleMutation = useMutation({
    mutationFn: async ({ saleId, updates }) => {
      const response = await fetch('/api/manual-sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId, updates }),
      });
      if (!response.ok) throw new Error('Failed to update sale');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["manualSales"]);
      setEditingSaleId(null);
      toast.success("Sale updated successfully");
    },
    onError: (error) => toast.error(error.message),
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
        fullDetails: `${selectedVariant.color || 'Standard'} - ${selectedVariant.size}${selectedVariant.material ? ` - ${selectedVariant.material}` : ''}`,
        hexColor: selectedVariant.hexColor,
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to record sale');
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
    if (e && e.preventDefault) e.preventDefault();
    console.log("Submitting sale:", saleForm);
    
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
                    <div className="md:col-span-2 space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Select Color & Size
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.variants?.map((variant) => (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => setSelectedVariant(variant)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${
                              selectedVariant?.id === variant.id
                                ? "border-black bg-black text-white shadow-lg"
                                : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200"
                            } ${variant.stock <= 0 ? "opacity-30 cursor-not-allowed grayscale" : ""}`}
                            disabled={variant.stock <= 0}
                          >
                            {/* Color Swatch */}
                            {variant.hexColor ? (
                              <div 
                                className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                                style={{ backgroundColor: variant.hexColor }}
                              />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-gray-300 border border-white/20" title="No color color set" />
                            )}
                            <div className="text-left">
                              <p className="font-bold text-xs leading-none mb-1 capitalize">
                                {variant.color || "Standard"}
                              </p>
                              <p className={`text-[9px] font-black uppercase tracking-wider ${
                                selectedVariant?.id === variant.id ? "text-white/60" : "text-gray-400"
                              }`}>
                                Size: {variant.size} • Stock: {variant.stock}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                      {selectedVariant && (
                        <p className="text-[10px] font-bold text-green-600 mt-2 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedVariant.hexColor || '#ccc' }} />
                          Matched: {selectedVariant.color || 'Standard'} • Size: {selectedVariant.size} | GH₵{selectedVariant.price || selectedProduct.basePrice}
                        </p>
                      )}
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
                      <div className="flex-grow flex items-center gap-3">
                        {item.variantInfo.hexColor && (
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-200 shadow-sm flex-shrink-0"
                                style={{ backgroundColor: item.variantInfo.hexColor }}
                          />
                        )}
                        <div>
                          <p className="font-bold">{item.productName}</p>
                          <p className="text-xs text-gray-500">
                            {item.variantInfo.color || 'Standard'} • Size: {item.variantInfo.size} × {item.quantity}
                          </p>
                        </div>
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
                disabled={recordSaleMutation.isPending || saleForm.items.length === 0}
                className="bg-black text-white py-6 px-12 rounded-3xl font-black uppercase tracking-[0.2em] text-sm hover:bg-gray-800 transition-all shadow-2xl shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {recordSaleMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  "Record Sale"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
              <DollarSign className="h-16 w-16 text-gray-200 mx-auto mb-6" />
              <h3 className="text-xl font-black uppercase tracking-widest text-gray-400 mb-4">
                Manual Sales Overview
              </h3>
              <p className="text-gray-400 font-medium mb-8 max-w-md mx-auto">
                No active sale in progress. Click "New Sale" to record an in-person, Instagram or WhatsApp order.
              </p>
            </div>

            {/* Recent Sales Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                 <h3 className="text-sm font-black uppercase tracking-widest">Recent Records</h3>
                 <span className="text-[10px] font-bold text-gray-400">Showing last {pastSales?.length || 0} sales</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Details</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Profit</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-black">
                    {pastSales?.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6">
                           {editingSaleId === sale.id ? (
                             <input 
                               value={editForm.customerName}
                               onChange={(e) => setEditForm({...editForm, customerName: e.target.value})}
                               className="bg-gray-50 border-0 outline-none p-1 rounded w-full text-xs font-black uppercase"
                             />
                           ) : (
                             <>
                               <p className="font-black text-xs uppercase">{sale.customerName}</p>
                               <p className="text-[9px] font-bold text-gray-400 mt-1">{sale.customerPhone || 'No Phone'}</p>
                             </>
                           )}
                        </td>
                        <td className="px-8 py-6">
                           {editingSaleId === sale.id ? (
                              <input 
                                value={editForm.notes}
                                onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                                placeholder="Notes..."
                                className="bg-gray-50 border-0 outline-none p-1 rounded w-full text-[10px]"
                              />
                           ) : (
                             <p className="text-[10px] font-bold text-gray-500 italic">
                               {sale.items?.length} items • {sale.paymentMethod}
                             </p>
                           )}
                        </td>
                        <td className="px-8 py-6">
                           <p className="font-black text-sm text-gray-400">GH₵{sale.totalAmount?.toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-6">
                           <p className="font-black text-sm text-green-600">GH₵{sale.totalProfit?.toLocaleString() || '0'}</p>
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-[10px] font-bold text-gray-400">
                             {new Date(sale.createdAt).toLocaleDateString()}
                           </p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end space-x-3">
                            {editingSaleId === sale.id ? (
                              <>
                                <button 
                                  onClick={() => updateSaleMutation.mutate({ saleId: sale.id, updates: editForm })}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => setEditingSaleId(null)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={() => {
                                    setEditingSaleId(sale.id);
                                    setEditForm({
                                      customerName: sale.customerName,
                                      customerPhone: sale.customerPhone || "",
                                      notes: sale.notes || "",
                                    });
                                  }}
                                  className="text-gray-400 hover:text-black transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    if(confirm('Are you sure? This will RESTORE the inventory for these items.')) {
                                      deleteSaleMutation.mutate(sale.id);
                                    }
                                  }}
                                  className="text-gray-300 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!pastSales || pastSales.length === 0) && (
                      <tr>
                        <td colSpan="4" className="px-8 py-12 text-center text-gray-300 font-bold uppercase text-[10px] tracking-widest">
                          No sales recorded yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}