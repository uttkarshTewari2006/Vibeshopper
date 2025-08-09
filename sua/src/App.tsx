import { usePopularProducts, ProductCard } from "@shopify/shop-minis-react";
import { RotatingCart } from "./components/RotatingCart";
import { useAsyncStorage } from "@shopify/shop-minis-react";

export function App() {
  const { products } = usePopularProducts();
  // Removed fal-ai client configuration to avoid using process.env in the browser

  const { getItem, setItem, removeItem } = useAsyncStorage();

  // Interface for items with id property
  interface ItemWithId {
    id: string;
  }

  const addItemsToStorage = async (items: ItemWithId[]) => {
    try {
      // Get existing stored items
      const existingItemsString = await getItem({ key: "stored_products" });
      const existingItems = existingItemsString
        ? JSON.parse(existingItemsString)
        : [];

      // For each item, fetch the full product details using the useProduct hook
      const productPromises = items.map(async (item) => {
        // Note: In a real implementation, useProduct should be called at component level
        // This is a simplified approach - normally you'd manage this state differently
        try {
          // For now, we'll store the basic item info and id
          // In a real app, you'd want to fetch full product details
          return {
            ...item, // Include any additional properties from the item (including id)
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          console.error(`Failed to process item with id ${item.id}:`, error);
          return null;
        }
      });

      const productResults = await Promise.all(productPromises);
      const validProducts = productResults.filter(
        (product) => product !== null
      );

      // Merge with existing items, avoiding duplicates
      const existingIds = new Set(existingItems.map((item: any) => item.id));
      const newProducts = validProducts.filter(
        (product) => !existingIds.has(product.id)
      );

      const updatedItems = [...existingItems, ...newProducts];

      // Store the updated items array
      await setItem({
        key: "stored_products",
        value: JSON.stringify(updatedItems),
      });

      console.log(
        `Successfully added ${newProducts.length} new items to storage`
      );
      return { success: true, addedCount: newProducts.length };
    } catch (error) {
      console.error("Error adding items to storage:", error);
      return { success: false, error: error.message };
    }
  };

  // Utility function to retrieve stored items
  const getStoredItems = async () => {
    try {
      const storedItemsString = await getItem({ key: "stored_products" });
      return storedItemsString ? JSON.parse(storedItemsString) : [];
    } catch (error) {
      console.error("Error retrieving stored items:", error);
      return [];
    }
  };

  // Utility function to clear all stored items
  const clearStoredItems = async () => {
    try {
      await removeItem({ key: "stored_products" });
      console.log("All stored items cleared");
      return { success: true };
    } catch (error) {
      console.error("Error clearing stored items:", error);
      return { success: false, error: error.message };
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md">
        <RotatingCart
          heightClassName="h-80"
          radius={2.0}
          speed={0.9}
          scale={1.0}
        />
      </div>
    </div>
  );
}
