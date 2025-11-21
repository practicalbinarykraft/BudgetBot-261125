/**
 * Simple test script for /api/assets/history endpoint
 * Run with: npx tsx server/test-assets-history.ts
 */

import { assetsRepository } from './repositories/assets.repository';

async function testAssetsHistory() {
  console.log('🧪 Testing Assets History Endpoint Logic...\n');

  let createdAssetId: number | null = null;

  try {
    // Test user ID (use existing user from DB)
    const userId = 12; // From logs: "Scheduled daily notification for user 12"

    // Date range - last 6 months
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000);

    console.log(`📅 Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // Create test asset with depreciation (e.g., car)
    console.log('📝 Creating test asset...');
    const testAsset = await assetsRepository.create({
      userId,
      type: 'asset',
      name: 'Test Car',
      purchasePrice: '25000',
      currentValue: '25000',
      purchaseDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
      depreciationRate: '15', // 15% per year
      notes: 'Test asset for endpoint testing'
    });
    createdAssetId = testAsset.id;
    console.log(`  ✅ Created test asset ID: ${createdAssetId}\n`);

    // Get all assets for user
    const allAssets = await assetsRepository.findByUserId(userId);
    console.log(`📊 Found ${allAssets.length} assets for user ${userId}`);

    // Preload valuations
    const valuationsMap = new Map<number, any[]>();
    await Promise.all(
      allAssets.map(async (item) => {
        const valuations = await assetsRepository.getValuations(item.asset.id);
        const sorted = valuations.sort((a, b) => 
          new Date(b.valuationDate).getTime() - new Date(a.valuationDate).getTime()
        );
        valuationsMap.set(item.asset.id, sorted);
        console.log(`  └─ Asset ${item.asset.id}: ${valuations.length} valuations`);
      })
    );

    // Generate monthly dates
    const dates: string[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setMonth(current.getMonth() + 1);
    }

    console.log(`\n📈 Calculating history for ${dates.length} months...\n`);

    // Calculate history
    const history = dates.map((date) => {
      let totalAssets = 0;
      let totalLiabilities = 0;

      for (const item of allAssets) {
        const asset = item.asset;

        // Skip if asset was purchased after this date
        const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate) : new Date(asset.createdAt);
        if (purchaseDate > new Date(date)) {
          continue;
        }

        const valuations = valuationsMap.get(asset.id) || [];
        const value = calculateAssetValueAtDate(asset, date, valuations);

        if (asset.type === 'asset') {
          totalAssets += value;
        } else {
          totalLiabilities += value;
        }
      }

      return {
        date,
        assets: Math.round(totalAssets * 100) / 100,
        liabilities: Math.round(totalLiabilities * 100) / 100,
        netWorth: Math.round((totalAssets - totalLiabilities) * 100) / 100
      };
    });

    // Display results
    console.log('Results:');
    console.log('─'.repeat(70));
    console.log('Date         │ Assets      │ Liabilities │ Net Worth');
    console.log('─'.repeat(70));
    
    history.forEach(h => {
      console.log(
        `${h.date} │ $${h.assets.toFixed(2).padStart(10)} │ $${h.liabilities.toFixed(2).padStart(10)} │ $${h.netWorth.toFixed(2).padStart(10)}`
      );
    });

    console.log('─'.repeat(70));
    console.log(`\n✅ Test completed successfully!`);
    console.log(`📊 Generated ${history.length} data points`);

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup: delete test asset
    if (createdAssetId !== null) {
      try {
        console.log(`\n🧹 Cleaning up test asset ID ${createdAssetId}...`);
        await assetsRepository.delete(createdAssetId);
        console.log('  ✅ Test asset deleted');
      } catch (cleanupError: any) {
        console.error('  ⚠️  Failed to cleanup test asset:', cleanupError.message);
      }
    }
  }

  process.exit(0);
}

// Helper function (same as in assets.routes.ts)
function calculateAssetValueAtDate(asset: any, targetDate: string, valuations: any[]): number {
  const target = new Date(targetDate);

  const relevantValuation = valuations.find(v => 
    new Date(v.valuationDate) <= target
  );

  if (relevantValuation) {
    return parseFloat(relevantValuation.value as unknown as string);
  }

  const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate) : new Date(asset.createdAt);
  const purchaseValue = asset.purchasePrice 
    ? parseFloat(asset.purchasePrice as unknown as string) 
    : parseFloat(asset.currentValue as unknown as string);

  if (target < purchaseDate) {
    return 0;
  }

  const yearsElapsed = (target.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

  if (asset.appreciationRate) {
    const rate = parseFloat(asset.appreciationRate as unknown as string) / 100;
    return purchaseValue * Math.pow(1 + rate, yearsElapsed);
  }

  if (asset.depreciationRate) {
    const rate = parseFloat(asset.depreciationRate as unknown as string) / 100;
    return purchaseValue * Math.pow(1 - rate, yearsElapsed);
  }

  return purchaseValue;
}

// Run test
testAssetsHistory();
