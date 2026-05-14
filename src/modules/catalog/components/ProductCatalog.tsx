"use client";

import {
  BadgePercent,
  Boxes,
  ChevronRight,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  X
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { StatusPill } from "@/shared/components/StatusPill";
import { formatCurrency } from "@/shared/lib/money";
import type { ApiEnvelope, ProductListItem } from "@/shared/types/domain";
import { demoProducts } from "../data/demo-products";

type ProductResponse = ApiEnvelope<{
  products: ProductListItem[];
}>;

type SortMode = "featured" | "price_asc" | "price_desc" | "stock";

export function ProductCatalog() {
  const [products, setProducts] = useState<ProductListItem[]>(demoProducts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("featured");
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

  const categoryStats = useMemo(
    () =>
      categories.map((item) => ({
        name: item,
        count: products.filter((product) => product.category === item).length
      })),
    [categories, products]
  );

  const featuredProduct =
    products.find((product) => product.discount > 0) ?? products[0] ?? demoProducts[0];
  const discountedProducts = products.filter((product) => product.discount > 0);
  const availableProducts = products.filter((product) => product.stock > 0);
  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= 5
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = products.filter((product) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery);
      const matchesCategory = category === "all" || product.category === category;
      const matchesAvailability =
        availability === "all" || product.status === availability;

      return matchesQuery && matchesCategory && matchesAvailability;
    });

    return [...result].sort((a, b) => {
      if (sortMode === "price_asc") {
        return a.finalPrice - b.finalPrice;
      }
      if (sortMode === "price_desc") {
        return b.finalPrice - a.finalPrice;
      }
      if (sortMode === "stock") {
        return b.stock - a.stock;
      }
      return b.discount - a.discount || b.stock - a.stock;
    });
  }, [availability, category, products, query, sortMode]);

  const hasFilters =
    query.trim().length > 0 || category !== "all" || availability !== "all";

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

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setAvailability("all");
    setSortMode("featured");
  }

  return (
    <section className="catalog-layout marketplace-layout">
      <div
        className="market-hero"
        style={{ backgroundImage: `url(${featuredProduct.imageUrl})` }}
      >
        <div className="market-hero-content">
          <p className="eyebrow">Marketplace Pet Store</p>
          <h1>Todo para comprar, pedir y recibir en casa sin friccion.</h1>
          <p>
            Explora productos por categoria, encuentra ofertas activas y agrega al
            carrito con stock visible en tiempo real.
          </p>
          <div className="market-hero-actions">
            <a className="primary-link" href="#catalog-products">
              <span>Ver productos</span>
              <ChevronRight size={18} />
            </a>
            <span className="hero-trust-chip">
              <ShieldCheck size={16} />
              Compra validada por pedido
            </span>
          </div>
        </div>
        <div className="market-hero-stats" aria-label="Resumen del catalogo">
          <div>
            <strong>{products.length}</strong>
            <span>productos</span>
          </div>
          <div>
            <strong>{availableProducts.length}</strong>
            <span>disponibles</span>
          </div>
          <div>
            <strong>{discountedProducts.length}</strong>
            <span>ofertas</span>
          </div>
        </div>
      </div>

      <div className="market-strip" aria-label="Beneficios de compra">
        <div>
          <PackageCheck size={18} />
          <span>Stock visible antes de comprar</span>
        </div>
        <div>
          <BadgePercent size={18} />
          <span>Descuentos aplicados en catalogo</span>
        </div>
        <div>
          <Boxes size={18} />
          <span>{lowStockProducts.length} productos con stock bajo</span>
        </div>
      </div>

      <div className="catalog-heading marketplace-heading">
        <div>
          <p className="eyebrow">Catalogo publico</p>
          <h1>Encuentra el producto ideal por categoria, precio y disponibilidad.</h1>
        </div>
        <div className="catalog-summary">
          <strong>{filteredProducts.length}</strong>
          <span>resultados</span>
        </div>
      </div>

      <div className="category-rail" aria-label="Categorias">
        <button
          type="button"
          className={category === "all" ? "is-active" : undefined}
          onClick={() => setCategory("all")}
        >
          <Sparkles size={17} />
          <span>Todo</span>
          <strong>{products.length}</strong>
        </button>
        {categoryStats.map((item) => (
          <button
            key={item.name}
            type="button"
            className={category === item.name ? "is-active" : undefined}
            onClick={() => setCategory(item.name)}
          >
            <PackageCheck size={17} />
            <span>{item.name}</span>
            <strong>{item.count}</strong>
          </button>
        ))}
      </div>

      <div className="filters-bar marketplace-filters">
        <label className="search-field">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar producto, categoria o necesidad"
          />
        </label>

        <label className="sort-field">
          <SlidersHorizontal size={17} />
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
          >
            <option value="featured">Destacados primero</option>
            <option value="price_asc">Menor precio</option>
            <option value="price_desc">Mayor precio</option>
            <option value="stock">Mayor stock</option>
          </select>
        </label>

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

        {hasFilters ? (
          <button className="clear-filter-button" type="button" onClick={clearFilters}>
            <X size={16} />
            <span>Limpiar</span>
          </button>
        ) : null}
      </div>

      {notice ? <p className="inline-notice marketplace-notice">{notice}</p> : null}

      <div className="product-grid marketplace-grid" id="catalog-products">
        {filteredProducts.length === 0 ? (
          <div className="empty-state marketplace-empty">
            <h2>No encontramos productos con esos filtros</h2>
            <p>Prueba otra busqueda o vuelve al catalogo completo.</p>
            <button className="secondary-button" type="button" onClick={clearFilters}>
              Limpiar filtros
            </button>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <article className="product-card marketplace-card" key={product.id}>
              <div className="product-media">
                <img src={product.imageUrl} alt={product.name} />
                <div className="product-media-overlay">
                  <span>{product.category}</span>
                  {product.discount > 0 ? (
                    <strong>-{product.discount}%</strong>
                  ) : (
                    <strong>{product.stock > 0 ? "Listo" : "Agotado"}</strong>
                  )}
                </div>
              </div>
              <div className="product-card-body">
                <div className="product-card-top">
                  <StatusPill status={product.status} />
                  <span>{product.stock} disp.</span>
                </div>
                <h2>{product.name}</h2>
                <p>{product.description}</p>
                <div className="product-purchase-row">
                  <div className="price-stack">
                    {product.discount > 0 ? (
                      <span className="old-price">{formatCurrency(product.price)}</span>
                    ) : null}
                    <strong>{formatCurrency(product.finalPrice)}</strong>
                  </div>
                  <span className="stock-chip">
                    {product.stock <= 0
                      ? "Sin stock"
                      : product.stock <= 5
                        ? "Ultimas unidades"
                        : "Disponible"}
                  </span>
                </div>
                <button
                  className="primary-button"
                  type="button"
                  disabled={product.stock <= 0 || isPending}
                  onClick={() => addToCart(product.id)}
                >
                  <ShoppingCart size={18} />
                  <span>{product.stock <= 0 ? "Agotado" : "Agregar"}</span>
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
