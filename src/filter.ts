import type {Product, ProductType} from './store/model';

export function filterProducts(
  products: Product[],
  types: ProductType[] | null,
  sets: string[] | null
): Product[] {
  return products.filter(p => {
    if (types && types.length > 0 && !types.includes(p.type)) return false;
    // If sets filter is active and product HAS a set that doesn't match, exclude it.
    // Products with no set field are never excluded by the set filter.
    if (sets && sets.length > 0 && p.set && !sets.includes(p.set)) return false;
    return true;
  });
}
