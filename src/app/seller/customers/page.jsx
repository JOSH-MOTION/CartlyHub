"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Phone, Mail } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getVendorCustomers } from "@/utils/marketplaceData";
import { formatCurrency } from "@/services/payments/money";
import {
  PageHeader,
  Panel,
  StatCard,
  Table,
  Cell,
  EmptyState,
  LoadingState,
} from "@/components/marketplace/dashboard-ui";

/** People who have ordered from this store, ranked by what they've spent. */
export default function SellerCustomersPage() {
  const { sellerProfile } = useApp();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["seller", "customers", sellerProfile?.uid],
    queryFn: () => getVendorCustomers(sellerProfile?.uid),
    enabled: Boolean(sellerProfile?.uid),
  });

  const totalSpend = customers.reduce((sum, customer) => sum + customer.totalSpend, 0);
  const repeat = customers.filter((customer) => customer.orderCount > 1).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Relationships"
        title="Customers"
        description="Built from your order history — both online payments and WhatsApp orders."
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Customers" value={customers.length} icon={Users} />
        <StatCard label="Repeat customers" value={repeat} />
        <StatCard label="Total spend" value={formatCurrency(totalSpend)} tone="dark" />
      </div>

      <Panel title="Customer list">
        {isLoading ? (
          <LoadingState label="Loading customers" />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Anyone who orders from your store appears here automatically."
          />
        ) : (
          <Table head={["Customer", "Contact", "Orders", "Total spend", "Last order"]}>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <Cell className="font-black text-black">{customer.name}</Cell>
                <Cell className="text-xs text-gray-500 font-medium">
                  {customer.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-gray-300" />
                      {customer.phone}
                    </span>
                  )}
                  {customer.email && (
                    <span className="flex items-center gap-1.5 mt-1">
                      <Mail className="h-3 w-3 text-gray-300" />
                      {customer.email}
                    </span>
                  )}
                  {!customer.phone && !customer.email && "—"}
                </Cell>
                <Cell>{customer.orderCount}</Cell>
                <Cell className="font-black text-black">
                  {formatCurrency(customer.totalSpend)}
                </Cell>
                <Cell className="text-xs text-gray-400">
                  {customer.lastOrderAt?.toLocaleDateString?.() || "—"}
                </Cell>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}
