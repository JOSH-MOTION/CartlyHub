import { create } from "zustand";
import { persist } from "zustand/middleware";

const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, variant, quantity = 1, selections = []) => {
        const items = get().items;
        const existingItemIndex = items.findIndex(
          (item) =>
            item.product.id === product.id && 
            item.variant.id === variant.id &&
            JSON.stringify(item.selections) === JSON.stringify(selections),
        );

        if (existingItemIndex > -1) {
          const newItems = [...items];
          newItems[existingItemIndex].quantity += quantity;
          set({ items: newItems });
        } else {
          set({ items: [...items, { product, variant, quantity, selections }] });
        }
      },
      removeItem: (productId, variantId, selections = []) => {
        set({
          items: get().items.filter(
            (item) =>
              !(item.product.id === productId && 
                item.variant.id === variantId &&
                JSON.stringify(item.selections) === JSON.stringify(selections)),
          ),
        });
      },
      updateQuantity: (productId, variantId, quantity, selections = []) => {
        if (quantity < 1) return;
        const newItems = get().items.map((item) =>
          item.product.id === productId && 
          item.variant.id === variantId &&
          JSON.stringify(item.selections) === JSON.stringify(selections)
            ? { ...item, quantity }
            : item,
        );
        set({ items: newItems });
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => {
          const price = item.variant.price || item.product.basePrice;
          return total + price * item.quantity;
        }, 0);
      },
    }),
    {
      name: "carly-hub-cart",
    },
  ),
);

export default useCart;
