"use client";

import { CheckCircle2, Clock3, PackageSearch, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/shared/components/EmptyState";
import { StatusPill } from "@/shared/components/StatusPill";
import { formatCurrency } from "@/shared/lib/money";
import type { ApiEnvelope } from "@/shared/types/domain";

type Order = {
  id: string;
  status: string;
  total: number;
  deliveryAddress: string;
  deliveryCode: string | null;
  items: { id: string; productName: string; quantity: number }[];
  createdAt: string;
};

type OrdersResponse = ApiEnvelope<{ orders: Order[] }>;
type OrderFilter = "all" | "active" | "delivered";

export function CustomerDashboard() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          setError(payload.error);
          return;
        }
        setOrders((payload as OrdersResponse).data.orders);
      })
      .catch(() => setError("No se pudo cargar el historial"));
  }, []);

  if (error) {
    return (
      <EmptyState title="Necesitas una sesion de cliente">
        <Link href="/login">Iniciar sesion</Link>
      </EmptyState>
    );
  }

  if (!orders) {
    return <EmptyState title="Cargando tus pedidos" />;
  }

  const activeOrders = orders.filter(
    (order) => !["DELIVERED", "CANCELLED", "REJECTED"].includes(order.status)
  );
  const deliveredOrders = orders.filter((order) => order.status === "DELIVERED");
  const totalSpent = deliveredOrders.reduce((sum, order) => sum + order.total, 0);
  const visibleOrders =
    filter === "active"
      ? activeOrders
      : filter === "delivered"
        ? deliveredOrders
        : orders;

  return (
    <section className="page-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Cliente</p>
          <h1>Mis pedidos</h1>
        </div>
        <Link className="primary-link" href="/">
          Comprar
        </Link>
      </div>

      {orders.length === 0 ? (
        <EmptyState title="Aun no tienes pedidos">
          <Link href="/">Explorar catalogo</Link>
        </EmptyState>
      ) : (
        <div className="profile-dashboard">
          <div className="profile-summary-grid">
            <div className="profile-summary-card">
              <ShoppingBag size={20} />
              <span>Pedidos</span>
              <strong>{orders.length}</strong>
            </div>
            <div className="profile-summary-card">
              <Clock3 size={20} />
              <span>Activos</span>
              <strong>{activeOrders.length}</strong>
            </div>
            <div className="profile-summary-card">
              <CheckCircle2 size={20} />
              <span>Entregados</span>
              <strong>{deliveredOrders.length}</strong>
            </div>
            <div className="profile-summary-card">
              <PackageSearch size={20} />
              <span>Comprado</span>
              <strong>{formatCurrency(totalSpent)}</strong>
            </div>
          </div>

          <div className="dashboard-tabs" aria-label="Filtrar pedidos">
            {[
              ["all", "Todos"],
              ["active", "En proceso"],
              ["delivered", "Entregados"]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filter === value ? "is-active" : undefined}
                onClick={() => setFilter(value as OrderFilter)}
              >
                {label}
              </button>
            ))}
          </div>

          {visibleOrders.length === 0 ? (
            <EmptyState title="No hay pedidos en este filtro" />
          ) : (
            <div className="order-list customer-order-list">
              {visibleOrders.map((order) => (
                <article className="order-card customer-order-card" key={order.id}>
                  <div>
                    <div className="product-card-top">
                      <span>{new Date(order.createdAt).toLocaleDateString("es-CO")}</span>
                      <StatusPill status={order.status} />
                    </div>
                    <h2>Pedido #{order.id.slice(-6)}</h2>
                    <p>{order.deliveryAddress}</p>
                    {order.deliveryCode ? (
                      <div className="delivery-code-box">
                        <span>Codigo para entregar al repartidor</span>
                        <strong>{order.deliveryCode}</strong>
                      </div>
                    ) : null}
                    <ul>
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.quantity} x {item.productName}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="order-total-block">
                    <span>Total</span>
                    <strong>{formatCurrency(order.total)}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
