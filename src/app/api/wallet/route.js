import {
  getWallet,
  listWalletTransactions,
} from '@/services/marketplace/wallet-service';
import { getMarketplaceSettings } from '@/services/marketplace/settings-service';
import { requireVendor } from '@/app/api/_lib/auth';
import { ok, fail } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

/** The signed-in vendor's wallet plus its transaction history. */
export async function GET(request) {
  try {
    const { uid } = await requireVendor(request);

    const [wallet, transactions, settings] = await Promise.all([
      getWallet(uid),
      listWalletTransactions(uid),
      getMarketplaceSettings(),
    ]);

    return ok({
      wallet,
      transactions,
      minWithdrawalAmount: settings.minWithdrawalAmount,
      commissionPercent: settings.commissionPercent,
    });
  } catch (error) {
    return fail(error, error?.status || 500);
  }
}
