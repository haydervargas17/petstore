import type { ProductListItem } from "@/shared/types/domain";

export const demoProducts: ProductListItem[] = [
  {
    id: "demo-food",
    name: "Alimento premium para perro",
    slug: "alimento-premium-perro",
    description: "Croquetas balanceadas para perros adultos, con proteína animal y fibra digestiva.",
    imageUrl:
      "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=900&q=80",
    category: "Alimentos",
    categorySlug: "alimentos",
    price: 89000,
    discount: 12000,
    finalPrice: 77000,
    stock: 18,
    status: "discounted"
  },
  {
    id: "demo-cat-litter",
    name: "Arena sanitaria aglomerante",
    slug: "arena-sanitaria-aglomerante",
    description: "Arena de rápida absorción con control de olores para gatos de interior.",
    imageUrl:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=80",
    category: "Gatos",
    categorySlug: "gatos",
    price: 42000,
    discount: 0,
    finalPrice: 42000,
    stock: 8,
    status: "available"
  },
  {
    id: "demo-toy",
    name: "Juguete mordedor resistente",
    slug: "juguete-mordedor-resistente",
    description: "Mordedor flexible para reducir ansiedad y fortalecer mandíbula.",
    imageUrl:
      "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?auto=format&fit=crop&w=900&q=80",
    category: "Accesorios",
    categorySlug: "accesorios",
    price: 26000,
    discount: 0,
    finalPrice: 26000,
    stock: 0,
    status: "out_of_stock"
  }
];
