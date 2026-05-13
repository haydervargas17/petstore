"use client";

import { Search, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { formatCurrency } from "@/shared/lib/money";
import { StatusPill } from "@/shared/components/StatusPill";
import type { ApiEnvelope, ProductListItem } from "@/shared/types/domain";
import { demoProducts } from "../data/demo-products";

type ProductResponse = ApiEnvelope<{
  products: ProductListItem[];
}>;

export function ProductCatalog() {
  const [products, setProducts] = useState<ProductListItem[]>(demoProducts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/products", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as ProductResponse;
        if (payload.data.products.length > 0) {
          setProducts(payload.data.products);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))),
    [products]
  );

  const filteredProducts = products.filter((product) => {
    const matchesQuery =
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "all" || product.category === category;
    const matchesAvailability =
      availability === "all" || product.status === availability;

    return matchesQuery && matchesCategory && matchesAvailability;
  });

  function addToCart(productId: string) {
    setNotice(null);
    startTransition(async () => {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 })
      });

      if (response.status === 401 || response.status === 403) {
        window.location.href = "/login";
        return;
      }

      const payload = await response.json();
      setNotice(response.ok ? "Producto agregado al carrito" : payload.error);
    });
  }

  return (
    <section className="catalog-layout">
      <div className="catalog-heading">
        <div>
          <p className="eyebrow">Catálogo público</p>
          <h1>Productos para cuidar cada rutina de tu mascota</h1>
        </div>
        <div className="catalog-summary">
          <strong>{filteredProducts.length}</strong>
          <span>productos visibles</span>
        </div>
      </div>

      <div className="filters-bar">
        <label className="search-field">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar producto"
          />
        </label>

        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">Todas las categorías</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <div className="segmented-control" aria-label="Disponibilidad">
          {[
            ["all", "Todos"],
            ["available", "Disponibles"],
            ["discounted", "Ofertas"],
            ["out_of_stock", "Agotados"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={availability === value ? "is-active" : undefined}
              onClick={() => setAvailability(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {notice ? <p className="inline-notice">{notice}</p> : null}

      <div className="product-grid">
        {filteredProducts.map((product) => (
          <article className="product-card" key={product.id}>
            <img src={product.imageUrl} alt={product.name} />
            <div className="product-card-body">
              <div className="product-card-top">
                <span>{product.category}</span>
                <StatusPill status={product.status} />
              </div>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <div className="price-row">
                <div>
                  {product.discount > 0 ? (
                    <span className="old-price">{formatCurrency(product.price)}</span>
                  ) : null}
                  <strong>{formatCurrency(product.finalPrice)}</strong>
                </div>
                <span>{product.stock} disp.</span>
              </div>
              <button
                className="primary-button"
                type="button"
                disabled={product.stock <= 0 || isPending}
                onClick={() => addToCart(product.id)}
              >
                <ShoppingCart size={18} />
                <span>Agregar</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
