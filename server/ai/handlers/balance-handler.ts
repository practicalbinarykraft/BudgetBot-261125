// Balance Tool Handler - get user's total balance and wallet info
import { storage } from '../../storage';
import { ToolResult } from '../tool-types';

export async function handleGetBalance(
  userId: number
): Promise<ToolResult> {
  try {
    // Get all user's wallets
    const wallets = await storage.getWalletsByUserId(userId);
    
    // Calculate total balance in USD
    const totalBalance = wallets.reduce(
      (sum, wallet) => {
        const balanceUsd = wallet.balanceUsd ? parseFloat(wallet.balanceUsd as string) : 0;
        return sum + balanceUsd;
      },
      0
    );
    
    // Get wallet statistics
    const walletCount = wallets.length;
    const primaryWallet = wallets.find(w => w.isPrimary === 1);
    
    // Format balance for display
    const formatted = `$${totalBalance.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
    
    return {
      success: true,
      data: {
        balance: totalBalance,
        currency: 'USD',
        wallets: walletCount,
        primaryWallet: primaryWallet?.name || 'None',
        formatted,
        message: `You have ${formatted} across ${walletCount} wallet${walletCount !== 1 ? 's' : ''}`
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get balance'
    };
  }
}
