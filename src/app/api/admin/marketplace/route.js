import {
  getMarketplaceSettings,
  updateMarketplaceSettings,
} from '@/services/marketplace/settings-service';
import { listVendors } from '@/services/marketplace/vendor-service';
import { listAllWallets } from '@/services/marketplace/wallet-service';
import { listAllWithdrawals } from '@/services/marketplace/withdrawal-service';
import { listPaymentProviders } from '@/services/payments';
import { requireAdmin } from '@/app/api/_lib/auth';
import { ok, fail } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

/** Everything the admin marketplace screens need, in one round trip. */
export async function GET(request) {
  try {
    await requireAdmin(request);

    const [settings, vendors, wallets, withdrawals] = await Promise.all([
      getMarketplaceSettings(),
      listVendors(),
      listAllWallets(),
      listAllWithdrawals(),
    ]);

    const walletByVendor = new Map(wallets.map((wallet) => [wallet.vendorId, wallet]));

    return ok({
      settings,
      providers: listPaymentProviders(),
      vendors: vendors.map((vendor) => ({
        ...vendor,
        wallet: walletByVendor.get(vendor.id) || null,
      })),
      wallets,
      withdrawals,
      totals: {
        availableBalance: wallets.reduce((sum, w) => sum + Number(w.availableBalance || 0), 0),
        pendingBalance: wallets.reduce((sum, w) => sum + Number(w.pendingBalance || 0), 0),
        totalEarnings: wallets.reduce((sum, w) => sum + Number(w.totalEarnings || 0), 0),
        totalWithdrawals: wallets.reduce((sum, w) => sum + Number(w.totalWithdrawals || 0), 0),
      },
    });
  } catch (error) {
    return fail(error, error?.status || 500);
  }
}

/** Marketplace commission percentage and payout policy. */
export async function PUT(request) {
  try {
    const admin = await requireAdmin(request);
    const updates = await request.json();
    const settings = await updateMarketplaceSettings(updates, admin.uid);
    return ok({ settings });
  } catch (error) {
    return fail(error, 400);
  }
}
