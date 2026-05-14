"use client";

import { CheckCircle2, PackageCheck, PlusCircle, XCircle } from "lucide-react";
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

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [courierByOrder, setCourierByOrder] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [productNotice, setProductNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function load() {
    Promise.all([
      fetch("/api/admin/dashboard"),
      fetch("/api/orders"),
      fetch("/api/admin/couriers")
    ])
      .then(async ([dashboardResponse, ordersResponse, couriersResponse]) => {
        const dashboardPayload = await dashboardResponse.json();
        const ordersPayload = await ordersResponse.json();
        const couriersPayload = await couriersResponse.json();

        if (!dashboardResponse.ok || !ordersResponse.ok || !couriersResponse.ok) {
          setError(
            dashboardPayload.error ?? ordersPayload.error ?? couriersPayload.error
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

  if (error) {
    return <EmptyState title="Panel administrativo no disponible">{error}</EmptyState>;
  }

  if (!dashboard) {
    return <EmptyState title="Cargando dashboard" />;
  }

  const cards = [
    ["Ingresos", formatCurrency(dashboard.totals.revenue)],
    ["Pedidos", dashboard.totals.totalOrders.toString()],
    ["Pendientes", dashboard.totals.pendingOrders.toString()],
    ["Entregados", dashboard.totals.deliveredOrders.toString()]
  ];

  return (
    <section className="dashboard-layout">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Administrador general</p>
          <h1>Operación de la tienda</h1>
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
            <input name="categoryName" placeholder="Alimentos" required />
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

      <div className="dashboard-grid">
        <section className="analytics-panel">
          <h2>Ventas por día</h2>
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
          <h2>Bajo stock</h2>
          <div className="compact-list">
            {dashboard.lowStockProducts.map((product) => (
              <div key={product.id}>
                <span>{product.name}</span>
                <strong>{product.stock}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="analytics-panel">
        <h2>Pedidos recientes</h2>
        <div className="order-list">
          {orders.slice(0, 8).map((order) => (
            <article className="order-card" key={order.id}>
              <div>
                <div className="product-card-top">
                  <span>{order.customer.fullName}</span>
                  <StatusPill status={order.status} />
                </div>
                <h3>Pedido #{order.id.slice(-6)}</h3>
                <p>{formatCurrency(order.total)}</p>
              </div>
              <div className="action-cluster">
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
                  type="button"
                  aria-label="Aprobar"
                  disabled={isPending}
                  onClick={() => changeStatus(order.id, "APPROVED")}
                >
                  <CheckCircle2 size={17} />
                </button>
                <button
                  type="button"
                  aria-label="Enviar"
                  disabled={isPending}
                  onClick={() => changeStatus(order.id, "SHIPPED")}
                >
                  <PackageCheck size={17} />
                </button>
                <button
                  type="button"
                  aria-label="Cancelar"
                  disabled={isPending}
                  onClick={() => changeStatus(order.id, "CANCELLED")}
                >
                  <XCircle size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
