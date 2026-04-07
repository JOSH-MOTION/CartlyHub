import { create } from "zustand";
import { persist } from "zustand/middleware";

const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, variant, quantity = 1) => {
        const items = get().items;
        const existingItemIndex = items.findIndex(
          (item) =>
            item.product.id === product.id && item.variant.id === variant.id,
        );

        if (existingItemIndex > -1) {
          const newItems = [...items];
          newItems[existingItemIndex].quantity += quantity;
          set({ items: newItems });
        } else {
          set({ items: [...items, { product, variant, quantity }] });
        }
      },
      removeItem: (productId, variantId) => {
        set({
          items: get().items.filter(
            (item) =>
              !(item.product.id === productId && item.variant.id === variantId),
          ),
        });
      },
      updateQuantity: (productId, variantId, quantity) => {
        if (quantity < 1) return;
        const newItems = get().items.map((item) =>
          item.product.id === productId && item.variant.id === variantId
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
