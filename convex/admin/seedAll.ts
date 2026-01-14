import { internalMutation, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

// Type definitions for seed results
interface SeedUserResult {
  created: number;
  total: number;
}

interface SeedEventResult {
  created: number;
  total: number;
}

interface SeedClassResult {
  created: number;
  total: number;
}

interface SeedRestaurantResult {
  created: number;
  total: number;
}

interface SeedVendorResult {
  productsCreated: number;
}

interface SeedResults {
  users?: SeedUserResult;
  events?: SeedEventResult;
  classes?: SeedClassResult;
  restaurants?: SeedRestaurantResult;
  vendor?: SeedVendorResult;
}

/**
 * Master seed orchestration
 * Runs all seed functions in the correct order to populate the database
 * with test data for demonstration purposes.
 *
 * Order matters because:
 * 1. seedUsers - Creates user accounts (required for foreign keys)
 * 2. seedEvents - Creates events (needs organizer user IDs)
 * 3. seedClasses - Creates classes + instructor (needs instructor user ID)
 * 4. seedRestaurants - Creates restaurants (needs owner user ID)
 * 5. seedVendor - Creates vendor + products (needs owner user ID)
 *
 * Run with:
 * CONVEX_SELF_HOSTED_URL=https://convex.toolboxhosting.com \
 * CONVEX_SELF_HOSTED_ADMIN_KEY="convex-self-hosted|..." \
 * npx convex run --no-push admin/seedAll:seedAll {}
 */
export const seedAll = internalAction({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    results: SeedResults;
    errors: string[];
  }> => {
    const results: SeedResults = {};
    const errors: string[] = [];

    // 1. Seed Users (must be first)
    console.log("🔄 Seeding users...");
    try {
      results.users = await ctx.runMutation(internal.admin.seedUsers.seedUsers, {});
      console.log(`✅ Users: ${results.users.created} created, ${results.users.total} total`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Users: ${errorMessage}`);
      console.error(`❌ Users failed: ${errorMessage}`);
      // Users are required for other seeds, so fail early
      return { success: false, results, errors };
    }

    // 2. Seed Events
    console.log("🔄 Seeding events...");
    try {
      results.events = await ctx.runMutation(internal.admin.seedEvents.seedEvents, {});
      console.log(`✅ Events: ${results.events.created} created, ${results.events.total} total`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Events: ${errorMessage}`);
      console.error(`❌ Events failed: ${errorMessage}`);
    }

    // 3. Seed Classes
    console.log("🔄 Seeding classes...");
    try {
      results.classes = await ctx.runMutation(internal.admin.seedClasses.seedClasses, {});
      console.log(`✅ Classes: ${results.classes.created} created, ${results.classes.total} total`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Classes: ${errorMessage}`);
      console.error(`❌ Classes failed: ${errorMessage}`);
    }

    // 4. Seed Restaurants
    console.log("🔄 Seeding restaurants...");
    try {
      results.restaurants = await ctx.runMutation(internal.admin.seedRestaurants.seedRestaurants, {});
      console.log(`✅ Restaurants: ${results.restaurants.created} created, ${results.restaurants.total} total`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Restaurants: ${errorMessage}`);
      console.error(`❌ Restaurants failed: ${errorMessage}`);
    }

    // 5. Seed Vendor & Products
    console.log("🔄 Seeding vendor and products...");
    try {
      results.vendor = await ctx.runMutation(internal.admin.seedVendor.seedVendor, {});
      console.log(`✅ Vendor: ${results.vendor.productsCreated} products created`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Vendor: ${errorMessage}`);
      console.error(`❌ Vendor failed: ${errorMessage}`);
    }

    const success = errors.length === 0;

    console.log("\n" + "=".repeat(50));
    console.log(success ? "✅ ALL SEEDS COMPLETED SUCCESSFULLY" : "⚠️ SOME SEEDS FAILED");
    console.log("=".repeat(50));

    if (success) {
      console.log(`
📊 Summary:
- Users: ${results.users?.created || 0} created
- Events: ${results.events?.created || 0} created
- Classes: ${results.classes?.created || 0} created
- Restaurants: ${results.restaurants?.created || 0} created
- Products: ${results.vendor?.productsCreated || 0} created

🔑 Test Credentials:
- Email: admin@thestepperslife.com (admin)
- Email: organizer@thestepperslife.com (organizer)
- Email: restaurant@thestepperslife.com (restaurateur)
- Email: vendor@thestepperslife.com (vendor)
- Email: customer@thestepperslife.com (customer)
- Password: Bobby321!

🌐 Verify at:
- https://stepperslife.com/events
- https://stepperslife.com/classes
- https://stepperslife.com/restaurants
- https://stepperslife.com/marketplace
`);
    }

    return { success, results, errors };
  },
});

/**
 * Individual seed runners for running specific seeds only
 */
export const runSeedUsers = internalMutation({
  args: {},
  handler: async () => {
    // Note: We can't directly call since seedUsers is already an internalMutation
    // This is just for documentation - use seedUsers.seedUsers directly
    return { message: "Use: npx convex run --no-push admin/seedUsers:seedUsers {}" };
  },
});

export const runSeedEvents = internalMutation({
  args: {},
  handler: async () => {
    return { message: "Use: npx convex run --no-push admin/seedEvents:seedEvents {}" };
  },
});

export const runSeedClasses = internalMutation({
  args: {},
  handler: async () => {
    return { message: "Use: npx convex run --no-push admin/seedClasses:seedClasses {}" };
  },
});

export const runSeedRestaurants = internalMutation({
  args: {},
  handler: async () => {
    return { message: "Use: npx convex run --no-push admin/seedRestaurants:seedRestaurants {}" };
  },
});

export const runSeedVendor = internalMutation({
  args: {},
  handler: async () => {
    return { message: "Use: npx convex run --no-push admin/seedVendor:seedVendor {}" };
  },
});
