"use client";

import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  PlusCircle,
  RotateCw,
  XCircle
} from "lucide-react";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { EmptyState } from "@/shared/components/EmptyState";
import { StatusPill } from "@/shared/components/StatusPill";
import { formatCurrency } from "@/shared/lib/money";
import { PRODUCT_CATEGORIES } from "@/shared/lib/product-categories";
import type { ApiEnvelope } from "@/shared/types/domain";

type Dashboard = {
  totals: {
    revenue: number;
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
  };
  lowStockProducts: { id: string; name: string; stock: number; minStock: number }[];
  topProducts: { productId: string; productName: string; quantity: number; total: number }[];
  salesByDay: { day: string; total: number; orders: number }[];
};

type Order = {
  id: string;
  status: string;
  total: number;
  customer: { fullName: string; phone: string };
  items: { id: string; productName: string; quantity: number }[];
  createdAt: string;
};

type Courier = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
};

type Product = {
  id: string;
  name: string;
  category: string;
  stock: number;
};

type AdminView = "summary" | "orders" | "create" | "stock";

export function AdminDashboard() {
  const [activeView, setActiveView] = useState<AdminView>("summary");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [courierByOrder, setCourierByOrder] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [productNotice, setProductNotice] = useState<string | null>(null);
  const [stockNotice, setStockNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function load() {
    Promise.all([
      fetch("/api/admin/dashboard"),
      fetch("/api/orders"),
      fetch("/api/admin/couriers"),
      fetch("/api/products")
    ])
      .then(async ([
        dashboardResponse,
        ordersResponse,
        couriersResponse,
        productsResponse
      ]) => {
        const dashboardPayload = await dashboardResponse.json();
        const ordersPayload = await ordersResponse.json();
        const couriersPayload = await couriersResponse.json();
        const productsPayload = await productsResponse.json();

        if (
          !dashboardResponse.ok ||
          !ordersResponse.ok ||
          !couriersResponse.ok ||
          !productsResponse.ok
        ) {
          setError(
            dashboardPayload.error ??
              ordersPayload.error ??
              couriersPayload.error ??
              productsPayload.error
          );
          return;
        }

        setDashboard(
          (dashboardPayload as ApiEnvelope<{ dashboard: Dashboard }>).data.dashboard
        );
        setOrders((ordersPayload as ApiEnvelope<{ orders: Order[] }>).data.orders);
        setCouriers(
          (couriersPayload as ApiEnvelope<{ couriers: Courier[] }>).data.couriers
        );
        setProducts(
          (productsPayload as ApiEnvelope<{ products: Product[] }>).data.products
        );
      })
      .catch(() => setError("No se pudo cargar el panel"));
  }

  useEffect(load, []);

  function changeStatus(orderId: string, status: string) {
    startTransition(async () => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          courierId:
            status === "SHIPPED"
              ? courierByOrder[orderId] || couriers[0]?.id
              : undefined
        })
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload.error);
        return;
      }

      load();
    });
  }

  function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setProductNotice(null);
    setStockNotice(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const discountPercentage = formData.get("discountPercentage");
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          description: formData.get("description"),
          imageUrl: formData.get("imageUrl"),
          categoryName: formData.get("categoryName"),
          price: formData.get("price"),
          stock: formData.get("stock"),
          minStock: formData.get("minStock"),
          discountPercentage:
            discountPercentage && String(discountPercentage).trim().length > 0
              ? discountPercentage
              : undefined
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "No se pudo crear el producto");
        return;
      }

      form.reset();
      setProductNotice("Producto creado y publicado en el catalogo");
      load();
    });
  }

  function restockExistingProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setProductNotice(null);
    setStockNotice(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const productId = String(formData.get("productId") ?? "");

    startTransition(async () => {
      const response = await fetch(`/api/products/${productId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: formData.get("quantity"),
          reason: formData.get("reason") || "Reabastecimiento"
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "No se pudo actualizar el stock");
        return;
      }

      form.reset();
      setStockNotice("Stock actualizado");
      load();
    });
  }

  if (error) {
    return <EmptyState title="Panel administrativo no disponible">{error}</EmptyState>;
  }

  if (!dashboard) {
    return <EmptyState title="Cargando dashboard" />;
  }

  function renderOrderActions(order: Order) {
    if (order.status === "DELIVERED") {
      return <span className="closed-order-note">Venta entregada</span>;
    }

    if (["CANCELLED", "REJECTED"].includes(order.status)) {
      return <span className="closed-order-note">Pedido cerrado</span>;
    }

    if (["SHIPPED", "ON_THE_WAY"].includes(order.status)) {
      return <span className="closed-order-note">En manos del repartidor</span>;
    }

    if (order.status === "PENDING") {
      return (
        <>
          <button
            className="status-action approve-action"
            type="button"
            disabled={isPending}
            onClick={() => changeStatus(order.id, "APPROVED")}
          >
            <CheckCircle2 size={17} />
            <span>Aprobar</span>
          </button>
          <button
            className="status-action cancel-action"
            type="button"
            disabled={isPending}
            onClick={() => changeStatus(order.id, "CANCELLED")}
          >
            <XCircle size={17} />
            <span>Cancelar</span>
          </button>
        </>
      );
    }

    return (
      <>
        <select
          aria-label="Repartidor"
          value={courierByOrder[order.id] ?? couriers[0]?.id ?? ""}
          onChange={(event) =>
            setCourierByOrder((current) => ({
              ...current,
              [order.id]: event.target.value
            }))
          }
        >
          {couriers.map((courier) => (
            <option key={courier.id} value={courier.id}>
              {courier.fullName}
            </option>
          ))}
        </select>
        <button
          className="status-action send-action"
          type="button"
          disabled={isPending || couriers.length === 0}
          onClick={() => changeStatus(order.id, "SHIPPED")}
        >
          <PackageCheck size={17} />
          <span>Asignar envio</span>
        </button>
        <button
          className="status-action cancel-action"
          type="button"
          disabled={isPending}
          onClick={() => changeStatus(order.id, "CANCELLED")}
        >
          <XCircle size={17} />
          <span>Cancelar</span>
        </button>
      </>
    );
  }

  const pendingOrders = orders.filter((order) => order.status === "PENDING").length;
  const approvedOrders = orders.filter((order) => order.status === "APPROVED").length;
  const activeShipments = orders.filter((order) =>
    ["SHIPPED", "ON_THE_WAY"].includes(order.status)
  ).length;

  const cards = [
    ["Ingresos", formatCurrency(dashboard.totals.revenue)],
    ["Pedidos", dashboard.totals.totalOrders.toString()],
    ["Pendientes", dashboard.totals.pendingOrders.toString()],
    ["Entregados", dashboard.totals.deliveredOrders.toString()]
  ];

  const adminViews = [
    {
      key: "summary",
      label: "Resumen",
      detail: "Ventas, stock y productos",
      icon: BarChart3
    },
    {
      key: "orders",
      label: "Pedidos",
      detail: `${pendingOrders + approvedOrders + activeShipments} requieren seguimiento`,
      icon: ClipboardList
    },
    {
      key: "create",
      label: "Crear producto",
      detail: "Publicar un nuevo insumo",
      icon: PlusCircle
    },
    {
      key: "stock",
      label: "Reabastecer",
      detail: "Subir stock existente",
      icon: RotateCw
    }
  ] satisfies {
    key: AdminView;
    label: string;
    detail: string;
    icon: typeof BarChart3;
  }[];

  return (
    <section className="dashboard-layout">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Administrador general</p>
          <h1>Operacion de la tienda</h1>
        </div>
      </div>

      <div className="stat-grid">
        {cards.map(([label, value]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="admin-workspace">
        <nav className="admin-workspace-nav" aria-label="Modulos administrativos">
          {adminViews.map((view) => {
            const Icon = view.icon;
            return (
              <button
                key={view.key}
                type="button"
                className={activeView === view.key ? "is-active" : undefined}
                onClick={() => setActiveView(view.key)}
              >
                <Icon size={18} />
                <span>{view.label}</span>
                <small>{view.detail}</small>
              </button>
            );
          })}
        </nav>

        {activeView === "summary" ? (
          <div className="dashboard-grid">
            <section className="analytics-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Rendimiento</p>
                  <h2>Ventas por dia</h2>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dashboard.salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="total" fill="#1f8a70" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className="analytics-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Inventario</p>
                  <h2>Bajo stock</h2>
                </div>
              </div>
              <div className="compact-list">
                {dashboard.lowStockProducts.length === 0 ? (
                  <p>Sin alertas de stock.</p>
                ) : (
                  dashboard.lowStockProducts.map((product) => (
                    <div key={product.id}>
                      <span>{product.name}</span>
                      <strong>{product.stock}</strong>
                    </div>
                  ))
                )}
              </div>
              <div className="panel-divider" />
              <div className="panel-heading compact-heading">
                <div>
                  <p className="eyebrow">Ventas</p>
                  <h2>Mas vendidos</h2>
                </div>
              </div>
              <div className="compact-list">
                {dashboard.topProducts.length === 0 ? (
                  <p>Aun no hay ventas entregadas.</p>
                ) : (
                  dashboard.topProducts.map((product) => (
                    <div key={product.productId}>
                      <span>{product.productName}</span>
                      <strong>{product.quantity}</strong>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : null}

        {activeView === "orders" ? (
          <section className="analytics-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Flujo de pedidos</p>
                <h2>Pedidos recientes</h2>
              </div>
            </div>
            <div className="order-list">
              {orders.slice(0, 10).map((order) => (
                <article className="order-card" key={order.id}>
                  <div>
                    <div className="product-card-top">
                      <span>{order.customer.fullName}</span>
                      <StatusPill status={order.status} />
                    </div>
                    <h3>Pedido #{order.id.slice(-6)}</h3>
                    <p>{formatCurrency(order.total)}</p>
                  </div>
                  <div className="action-cluster">{renderOrderActions(order)}</div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeView === "create" ? (
          <section className="analytics-panel product-manager">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Catalogo</p>
                <h2>Crear producto</h2>
              </div>
              {productNotice ? <span className="success-chip">{productNotice}</span> : null}
            </div>
            <form className="product-form" onSubmit={createProduct}>
              <label>
                Nombre
                <input name="name" placeholder="Alimento natural para gato" required />
              </label>
              <label>
                Categoria
                <select name="categoryName" required defaultValue="">
                  <option value="" disabled>
                    Selecciona tipo
                  </option>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Precio
                <input name="price" type="number" min="1" step="100" required />
              </label>
              <label>
                Stock
                <input name="stock" type="number" min="0" step="1" required />
              </label>
              <label>
                Stock minimo
                <input name="minStock" type="number" min="0" step="1" defaultValue="5" />
              </label>
              <label>
                Descuento %
                <input name="discountPercentage" type="number" min="0" max="95" step="1" />
              </label>
              <label className="wide-field">
                Imagen
                <input name="imageUrl" type="url" placeholder="https://..." required />
              </label>
              <label className="wide-field">
                Descripcion
                <textarea
                  name="description"
                  minLength={10}
                  placeholder="Detalle comercial del producto"
                  required
                />
              </label>
              <button className="primary-button" type="submit" disabled={isPending}>
                <PlusCircle size={18} />
                <span>{isPending ? "Creando..." : "Publicar producto"}</span>
              </button>
            </form>
          </section>
        ) : null}

        {activeView === "stock" ? (
          <section className="analytics-panel stock-manager">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Inventario</p>
                <h2>Reabastecer producto existente</h2>
              </div>
              {stockNotice ? <span className="success-chip">{stockNotice}</span> : null}
            </div>
            <form className="product-form restock-form" onSubmit={restockExistingProduct}>
              <label className="wide-field">
                Producto
                <select name="productId" required defaultValue="">
                  <option value="" disabled>
                    Selecciona producto
                  </option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.category} - stock {product.stock}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Cantidad
                <input name="quantity" type="number" min="1" step="1" required />
              </label>
              <label className="wide-field">
                Motivo
                <input name="reason" placeholder="Compra a proveedor" />
              </label>
              <button className="primary-button" type="submit" disabled={isPending}>
                <RotateCw size={18} />
                <span>{isPending ? "Actualizando..." : "Subir stock"}</span>
              </button>
            </form>
          </section>
        ) : null}
      </div>
    </section>
  );
}
