"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, X, Search, Loader2, DollarSign, Phone, User as UserIcon, Package, Edit, AlertCircle, Image as ImageIcon, Copy } from "lucide-react";
import { toast } from "sonner";
import { getProducts, getManualSales, createManualSale, updateManualSale, deleteManualSale } from "@/utils/firebaseData";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ManualSalesPage() {
  const queryClient = useQueryClient();
  const [posSearchTerm, setPosSearchTerm] = useState("");
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [editForm, setEditForm] = useState({
    customerName: "",
    customerPhone: "",
    notes: "",
  });
  const [selectedQuickSell, setSelectedQuickSell] = useState(null); // { product, variant }
  const [quickSellQty, setQuickSellQty] = useState(1);
  const [quickSellPrice, setQuickSellPrice] = useState("");

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      return await getProducts({ includePrivate: true });
    },
  });

  const { data: pastSales, isLoading: pastSalesLoading } = useQuery({
    queryKey: ["manualSales"],
    queryFn: async () => {
      return await getManualSales();
    },
  });

  const { data: reinvestments = [] } = useQuery({
    queryKey: ["reinvestments"],
    queryFn: async () => {
      try {
        const q = query(collection(db, "reinvestments"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error("Error fetching reinvestments:", error);
        return [];
      }
    },
  });

  const deleteSaleMutation = useMutation({
    mutationFn: async (saleId) => {
      return await deleteManualSale(saleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["manualSales"]);
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["admin-financials"]);
      toast.success("Sale deleted and stock restored");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateSaleMutation = useMutation({
    mutationFn: async ({ saleId, updates }) => {
      return await updateManualSale(saleId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["manualSales"]);
      queryClient.invalidateQueries(["admin-financials"]);
      setEditingSaleId(null);
      toast.success("Sale updated successfully");
    },
    onError: (error) => toast.error(error.message),
  });

  const recordSaleMutation = useMutation({
    mutationFn: async (saleData) => {
      return await createManualSale(saleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["manualSales"]);
      queryClient.invalidateQueries(["admin-financials"]);
      toast.success("Sale recorded successfully!");
      setSelectedQuickSell(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record sale");
    },
  });

  const openQuickSellModal = (product, variant) => {
    setSelectedQuickSell({ product, variant });
    setQuickSellQty(1);
    setQuickSellPrice(variant.price || product.basePrice || "");
  };

  const submitQuickSell = () => {
    if (!selectedQuickSell) return;
    const { product, variant } = selectedQuickSell;
    const qty = Number(quickSellQty);
    const priceNum = Number(quickSellPrice);

    if (isNaN(qty) || qty <= 0 || qty > variant.stock) {
      toast.error(`Invalid quantity. Please enter a number between 1 and ${variant.stock}.`);
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    const saleData = {
      customerName: "Walk-in Customer",
      customerPhone: "",
      paymentMethod: "cash",
      notes: "Quick POS Sale",
      items: [
        {
          productId: product.id,
          variantId: variant.vId || variant.id || null,
          variantMatchIndex: product.variants.indexOf(variant),
          productName: product.name,
          variantInfo: {
            size: variant.size || "Standard",
            color: variant.color || variant.colorName || "Standard",
            sku: variant.sku || '',
            hexColor: variant.hexColor || '',
          },
          quantity: qty,
          basePrice: variant.price || product.basePrice || 0,
          price: priceNum,
          discountAmount: 0,
        }
      ],
      totalAmount: priceNum * qty,
      status: 'completed',
      paymentStatus: 'paid',
    };

    recordSaleMutation.mutate(saleData);
  };

  const handleCopyStockList = (product) => {
    try {
      // Group variants by color
      const grouped = {};
      let totalStock = 0;

      product.variants?.forEach(v => {
        const color = v.color || "Standard";
        const size = v.size || "Standard";
        const stock = Number(v.stock) || 0;

        if (stock <= 0) return; // skip out of stock items

        totalStock += stock;

        if (!grouped[color]) {
          grouped[color] = {
            sizes: [],
            total: 0
          };
        }
        grouped[color].sizes.push(`${stock} ${size}`);
        grouped[color].total += stock;
      });

      const lines = [`📦 ${product.name} Remaining Stock:\n`];
      Object.keys(grouped).forEach(color => {
        const item = grouped[color];
        lines.push(`• ${color}: ${item.sizes.join(", ")} (Total: ${item.total})`);
      });

      lines.push(`\nTotal: ${totalStock} pieces left.`);

      const textToCopy = lines.join("\n");
      navigator.clipboard.writeText(textToCopy);
      toast.success("Stock breakdown copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy stock list:", err);
      toast.error("Failed to copy stock list");
    }
  };

  const getProductProfit = (productId) => {
    if (!pastSales) return 0;
    let totalProductProfit = 0;
    pastSales.forEach(sale => {
      sale.items?.forEach(item => {
        if (item.productId === productId) {
          totalProductProfit += Number(item.profit || 0);
        }
      });
    });
    return totalProductProfit;
  };

  const filteredProducts = products?.filter(p => 
    (p.isPrivate === true || p.isActive === false) &&
    p.name.toLowerCase().includes(posSearchTerm.toLowerCase())
  );

  const inventoryStats = useMemo(() => {
    if (!products) return { totalItems: 0, productBreakdown: [] };
    
    // Filter down to only private admin products
    const privateProducts = products.filter(p => p.isPrivate === true || p.isActive === false);
    
    let totalItems = 0;
    const breakdown = privateProducts.map(p => {
      const productStock = p.variants?.reduce((sum, v) => sum + (Number(v.stock) || 0), 0) || 0;
      totalItems += productStock;
      return {
        id: p.id,
        name: p.name,
        stock: productStock
      };
    });

    return { totalItems, productBreakdown: breakdown };
  }, [products]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-100 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
            Point of Sale (POS)
          </span>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter uppercase">Quick Register Sale</h1>
        </div>
      </header>

      {/* Stock Summary Widget */}
      {!productsLoading && inventoryStats.productBreakdown.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)] space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory Status Overview</span>
            <div className="bg-indigo-50 px-3.5 py-1.5 rounded-xl">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700">
                Total Stock: {inventoryStats.totalItems} pieces
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {inventoryStats.productBreakdown.map((item) => (
              <div 
                key={item.id} 
                className="bg-gray-50/50 border border-gray-100/50 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full ${item.stock > 0 ? "bg-green-500" : "bg-red-400"}`} />
                <span className="uppercase tracking-tight">{item.name}:</span>
                <span className="font-black text-black">{item.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product List POS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 max-w-md bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full bg-transparent pl-11 pr-4 py-3 font-bold text-sm outline-none"
              value={posSearchTerm}
              onChange={(e) => setPosSearchTerm(e.target.value)}
            />
          </div>
          {posSearchTerm && (
            <button
              onClick={() => setPosSearchTerm("")}
              className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors px-2"
            >
              Clear
            </button>
          )}
        </div>

        {productsLoading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts?.map((product) => (
              <div
                key={product.id}
                className="bg-white p-6 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4 truncate">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="truncate">
                        <h3 className="font-black text-sm uppercase tracking-tight truncate">{product.name}</h3>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span>Cost: GH₵{Number(product.costPrice || 0).toFixed(2)}</span>
                          {getProductProfit(product.id) > 0 && (
                            <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded-md font-black">
                              Profit: GH₵{getProductProfit(product.id).toFixed(2)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleCopyStockList(product)}
                      className="p-2 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all flex items-center justify-center text-gray-400 flex-shrink-0"
                      title="Copy Stock List to Clipboard"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Variants List */}
                  <div className="space-y-3 pt-4 border-t border-gray-50">
                    {product.variants?.map((variant, idx) => (
                      <div
                        key={variant.vId || idx}
                        className="flex items-center justify-between bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border border-gray-200"
                            style={{
                              backgroundColor: variant.hexColor || variant.color || variant.colorName?.toLowerCase() || "#ccc",
                            }}
                          />
                          <div>
                            <p className="font-bold text-[10px] uppercase leading-none mb-1">
                              {variant.color || "Standard"}
                            </p>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                              Size: {variant.size || "M"} • {variant.stock} left
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => openQuickSellModal(product, variant)}
                          disabled={variant.stock <= 0 || recordSaleMutation.isPending}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            variant.stock <= 0
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-200"
                          }`}
                        >
                          {variant.stock <= 0 ? "Out" : "Sold"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Sales Table */}
      <div className="space-y-6 pt-8 border-t border-gray-100">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest">Recent Sales History</h3>
            <span className="text-[10px] font-bold text-gray-400">
              Showing last {pastSales?.length || 0} sales
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Items Sold</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date/Time</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-black">
                {pastSales?.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        {sale.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {item.variantInfo?.hexColor && (
                              <div
                                className="w-3 h-3 rounded-full border border-gray-200 shadow-sm flex-shrink-0"
                                style={{ backgroundColor: item.variantInfo.hexColor }}
                              />
                            )}
                            <p className="text-xs text-black flex items-center">
                              <span className="font-black mr-1">{item.quantity}x</span> {item.productName}
                              <span className="text-gray-400 text-[9px] ml-2 uppercase font-black tracking-widest">
                                ({item.variantInfo?.color || "Std"} - {item.variantInfo?.size})
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-3">
                        Paid via {sale.paymentMethod} {sale.notes ? `• Note: ${sale.notes}` : ""}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-sm text-black">GH₵{sale.totalAmount?.toLocaleString()}</p>
                      <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mt-1">
                        Profit: GH₵{sale.totalProfit?.toLocaleString() || "0"}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[10px] font-bold text-gray-800">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {new Date(sale.createdAt).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => {
                            if (confirm("Are you sure? This will RESTORE the inventory for these items.")) {
                              deleteSaleMutation.mutate(sale.id);
                            }
                          }}
                          className="text-gray-300 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!pastSales || pastSales.length === 0) && (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-8 py-12 text-center text-gray-300 font-bold uppercase text-[10px] tracking-widest"
                    >
                      No sales recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Custom Quick Sell Modal */}
      {selectedQuickSell && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-gray-100 space-y-6 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 mb-1 block">
                  Log Variant Sale
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                  {selectedQuickSell.product.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="w-3 h-3 rounded-full border border-gray-200"
                    style={{
                      backgroundColor:
                        selectedQuickSell.variant.hexColor ||
                        selectedQuickSell.variant.color ||
                        selectedQuickSell.variant.colorName?.toLowerCase() ||
                        "#ccc",
                    }}
                  />
                  <span className="text-xs font-black uppercase text-gray-500">
                    {selectedQuickSell.variant.color || "Standard"} • Size: {selectedQuickSell.variant.size}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedQuickSell(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Fields */}
            <div className="space-y-4 pt-2">
              {/* Cost Info */}
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-50 p-3.5 rounded-xl">
                <span>Unit Cost Price:</span>
                <span className="text-black font-black">
                  GH¢{Number(selectedQuickSell.product.costPrice || 0).toFixed(2)}
                </span>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Quantity Sold (Stock: {selectedQuickSell.variant.stock} left)
                </label>
                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border-2 border-transparent focus-within:border-black transition-all">
                  <button
                    type="button"
                    onClick={() => setQuickSellQty(q => Math.max(1, q - 1))}
                    className="w-10 h-10 bg-white rounded-xl font-bold flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all shadow-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={selectedQuickSell.variant.stock}
                    className="flex-grow text-center bg-transparent border-none font-black text-sm outline-none"
                    value={quickSellQty}
                    onChange={(e) =>
                      setQuickSellQty(
                        Math.min(
                          selectedQuickSell.variant.stock,
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setQuickSellQty(q => Math.min(selectedQuickSell.variant.stock, q + 1))
                    }
                    className="w-10 h-10 bg-white rounded-xl font-bold flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Selling Price */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Selling Price Per Item
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                    value={quickSellPrice}
                    onChange={(e) => setQuickSellPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Financial Calculation Summary */}
              <div className="border-t border-gray-100 pt-4 space-y-2.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <div className="flex justify-between">
                  <span>Total Sale:</span>
                  <span className="text-black font-black">
                    GH¢{Number((Number(quickSellPrice || 0) * quickSellQty)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Cost:</span>
                  <span className="text-black font-black">
                    GH¢{Number((Number(selectedQuickSell.product.costPrice || 0) * quickSellQty)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-dashed border-gray-100 pt-2 text-green-600">
                  <span>Estimated Profit:</span>
                  <span className="text-green-600 font-black text-sm">
                    GH¢{Number(
                      Math.max(
                        0,
                        (Number(quickSellPrice || 0) - Number(selectedQuickSell.product.costPrice || 0)) * quickSellQty
                      )
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setSelectedQuickSell(null)}
                className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitQuickSell}
                disabled={recordSaleMutation.isPending}
                className="flex-1 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 active:scale-95 transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
              >
                {recordSaleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <DollarSign className="h-4 w-4" />
                    <span>Confirm Sale</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}