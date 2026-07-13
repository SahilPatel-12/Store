# Shop Page Localization Implementation Plan

This implementation plan maps out the localization strategy for the Shop Page (Phase 3B).

## 1. Shop Page Overview

* **Route**: `/shop` (handled client-side by setting `currentPage` state to `'shop'`).
* **Component**: [ShopPage](file:///Applications/Store/Store/src/components/ShopPage.tsx)
* **Child Components**: None (fully self-contained component).
* **Dynamic Data Sources**: Dynamic product translation records are fetched directly from the Supabase view layer (`localized_website_pooja_products`).

---

## 2. Hardcoded String Inventory

We have discovered **18** user-facing hardcoded English strings in [ShopPage.tsx](file:///Applications/Store/Store/src/components/ShopPage.tsx).

### A. Fallback Banner
1. `"The Divine Shop"` (Line 371)
2. `"Explore our curated collections of authentic, priest-energized spiritual items designed to invite divine energy, focus, and peace into your sacred space."` (Line 374)

### B. Carousel Alt Text
3. `` `Shop banner ${idx + 1}` `` (Line 242)

### C. Search & Toolbar Options
4. `"Search by product name, benefits, or type..."` (Line 433)
5. `"Popularity"` (Line 481)
6. `"Top Rated"` (Line 482)
7. `"Price: Low to High"` (Line 483)
8. `"Price: High to Low"` (Line 484)
9. `"All Items"` (Line 118)

### D. Empty State
10. `"No divine items found"` (Line 540)
11. `"No items match your selected criteria. Try broadening your search or choosing another category."` (Line 542)
12. `"Reset Search & Categories"` (Line 550)

### E. Product Action Controls & Badges
13. `"OFF"` (Line 642)
14. `"SOLD OUT"` (Line 663)
15. `"{qty} in Cart"` (Line 810)
16. `"Add To Cart"` (Line 866)
17. `"Out of Stock"` (Line 886)

### F. Recently Viewed Section
18. `"Recently Viewed"` (Line 909)

* **Total Strings Found**: 18 strings.

---

## 3. Dynamic Content Protection

The following dynamic fields must remain protected and fetched exclusively from the database view (`localized_website_pooja_products`) on mount and transition. They must **never** be hardcoded or migrated to translation JSON:
* Product Name (`product.name`)
* Subtitle (`product.subtitle`)
* Description (`product.description`)
* Price (`product.price`)
* Original Price (`product.originalPrice`)
* Discount (`discount` computed value)
* Reviews & Ratings (`product.rating`)
* Images & Gallery (`product.image`)
* Specifications & Benefits (`product.benefits`)

---

## 4. Static UI Localization Plan

All 18 static strings listed in the inventory will be removed from the React code and placed in the translation files `src/locales/en/shop.json` and `src/locales/hi/shop.json` under the `shop` namespace.

---

## 5. Component Structure Preservation

Localization is strictly a display-layer enhancement. It must **NOT** change the application architecture.

Do **NOT**:
* Split `ShopPage.tsx` into new React components.
* Move JSX into new files.
* Reorder hooks inside [ShopPage.tsx](file:///Applications/Store/Store/src/components/ShopPage.tsx).
* Change React state variables or hooks.
* Change `useEffect` logic or dependencies.
* Change `useMemo` blocks.
* Change `useCallback` hook references.
* Modify event handlers or click handlers.
* Modify product filtering logic or search behaviors.
* Modify sorting logic or index matching.
* Modify category listing and mapping behaviors.
* Modify pagination configurations.
* Modify recently viewed localStorage persistence logic.
* Modify cart addition or updates behavior.
* Optimize unrelated sections of the codebase.
* Refactor unrelated segments of the file.

Only the following changes are permitted:
* Import `useTranslation` hook inside [ShopPage.tsx](file:///Applications/Store/Store/src/components/ShopPage.tsx).
* Connect the existing Phase 1 localization foundation.
* Replace the 18 hardcoded UI strings with `t('...')` translation keys.
* Create `shop.json` translation namespace files.
* Add the minimum required hook wiring for localization.

---

## 6. Proposed Namespace Structure

```json
{
  "banner": {
    "alt": "Shop banner {{index}}",
    "title": "The Divine Shop",
    "description": "Explore our curated collections of authentic, priest-energized spiritual items designed to invite divine energy, focus, and peace into your sacred space."
  },
  "toolbar": {
    "searchPlaceholder": "Search by product name, benefits, or type...",
    "sortOptions": {
      "popularity": "Popularity",
      "rating": "Top Rated",
      "priceAsc": "Price: Low to High",
      "priceDesc": "Price: High to Low"
    },
    "categories": {
      "allItems": "All Items"
    }
  },
  "emptyState": {
    "title": "No divine items found",
    "description": "No items match your selected criteria. Try broadening your search or choosing another category.",
    "resetButton": "Reset Search & Categories"
  },
  "product": {
    "off": "OFF",
    "soldOut": "SOLD OUT",
    "inCart": "{{count}} in Cart",
    "addToCart": "Add To Cart",
    "outOfStock": "Out of Stock"
  },
  "recentlyViewed": {
    "title": "Recently Viewed"
  }
}
```

---

## 7. Safety Matrix

### Allowed Changes
- Statically import and register `shop.json` in [i18next.ts](file:///Applications/Store/Store/src/lib/i18next.ts) to reuse the Phase 1 static translation foundation.
- Creation of `src/locales/en/shop.json` and `src/locales/hi/shop.json`.
- Hook usage `const { t } = useTranslation('shop');` inside [ShopPage.tsx](file:///Applications/Store/Store/src/components/ShopPage.tsx).
- Replacing the 18 hardcoded text strings in [ShopPage.tsx](file:///Applications/Store/Store/src/components/ShopPage.tsx) with `t('...')` key calls.

### Forbidden Changes
- Introducing duplicate language states, namespace loading useEffect functions, or local loading states.
- Modifying dynamic product loading queries, arrays, or fields.
- Re-sorting or changing categories retrieval and parsing methods.
- Modifying wishlist logic, cart actions, or recently-viewed localStorage synchronization methods.
- Restructuring the layout structure or CSS classes of the shop page.

---

## 8. Verification Plan

* **Build**: Verify clean compilation using `npm run build`.
* **TypeScript**: Run `npx tsc --noEmit` to verify type safety.
* **Runtime**: Test local page rendering using `npm run dev`.
* **Namespace Parity**: Ensure that key lists and nested blocks in `en/shop.json` and `hi/shop.json` are 100% matched.
* **English Leakage**: Perform post-implementation text scans of the shop page component.
* **Dynamic Content**: Confirm that dynamic fields (such as product name, images, and price) continue to render directly from database-level data.
* **Commerce Verification**: Verify cart additions and wishlist buttons still operate correctly.

---

## 9. Completion Criteria

* **Remaining hardcoded Shop Page English strings** = 0
* **Dynamic product translations** remain dynamically queried from Supabase view.
* **Namespace parity** = 100%
* **Build** = PASS
* **TypeScript** = PASS
* **Runtime** = PASS
* **Business logic** unchanged
* **Product queries** unchanged
* **Database / SQL updates** = NONE
* **No remaining Shop Page English leakage**
* **Component structure preserved**
