"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Boxes, AlertTriangle, PackageX, Plus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getSellerProducts } from "@/utils/firebaseData";
import { formatCurrency } from "@/services/payments/money";
import {
  PageHeader,
  Panel,
  StatCard,
  Table,
  Cell,
  Pill,
  EmptyState,
  LoadingState,
} from "@/components/marketplace/dashboard-ui";

const LOW_STOCK_THRESHOLD = 5;

/**
 * Stock levels per variant.
 *
 * Stock is deducted automatically when an online payment is verified, so this
 * view is the vendor's early warning for anything running out.
 */
export default function SellerInventoryPage() {
  const { sellerProfile } = useApp();
  const router = useRouter();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["seller", "products", sellerProfile?.uid],
    queryFn: () => getSellerProducts(sellerProfile?.uid),
    enabled: Boolean(sellerProfile?.uid),
  });

  const rows = useMemo(
    () =>
      products.flatMap((product) =>
        (product.variants || []).map((variant, index) => ({
          key: `${product.id}-${variant.id || index}`,
          productId: product.id,
          productName: product.name,
          image: variant.images?.[0] || product.images?.[0] || null,
          size: variant.size || null,
          color: variant.colorName || variant.color || null,
          price: Number(variant.price || product.basePrice || 0),
          stock: Number(variant.stock ?? 0),
        })),
      ),
    [products],
  );

  const outOfStock = rows.filter((row) => row.stock <= 0).length;
  const lowStock = rows.filter((row) => row.stock > 0 && row.stock <= LOW_STOCK_THRESHOLD).length;
  const stockValue = rows.reduce((sum, row) => sum + row.price * row.stock, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Stock"
        title="Inventory"
        description="Live stock across every option you sell. Paid orders reduce these numbers automatically."
        actions={
          <button
            onClick={() => router.push("/seller/products/add")}
            className="bg-black text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add product
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Variants tracked" value={rows.length} icon={Boxes} />
        <StatCard label="Low stock" value={lowStock} hint={`${LOW_STOCK_THRESHOLD} or fewer left`} icon={AlertTriangle} />
        <StatCard label="Out of stock" value={outOfStock} icon={PackageX} />
        <StatCard label="Stock value" value={formatCurrency(stockValue)} tone="dark" />
      </div>

      <Panel title="Stock levels">
        {isLoading ? (
          <LoadingState label="Loading inventory" />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="Nothing in stock yet"
            description="Add a product with its sizes and colours to start tracking stock."
          />
        ) : (
          <Table head={["Product", "Option", "Price", "Stock", "Status"]}>
            {rows
              .slice()
              .sort((a, b) => a.stock - b.stock)
              .map((row) => (
                <tr
                  key={row.key}
                  onClick={() => router.push(`/seller/products/edit/${row.productId}`)}
                  className="cursor-pointer hover:bg-gray-50/60 transition-colors"
                >
                  <Cell>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-11 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                        {row.image && (
                          <img src={row.image} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <span className="font-black truncate">{row.productName}</span>
                    </div>
                  </Cell>
                  <Cell className="text-xs text-gray-500">
                    {[row.size, row.color].filter(Boolean).join(" • ") || "One option"}
                  </Cell>
                  <Cell>{formatCurrency(row.price)}</Cell>
                  <Cell className="font-black text-black">{row.stock}</Cell>
                  <Cell>
                    {row.stock <= 0 ? (
                      <Pill tone="red" label="Out of stock" />
                    ) : row.stock <= LOW_STOCK_THRESHOLD ? (
                      <Pill tone="amber" label="Low" />
                    ) : (
                      <Pill tone="emerald" label="In stock" />
                    )}
                  </Cell>
                </tr>
              ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}
