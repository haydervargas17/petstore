"use client";

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
  items: { id: string; productName: string; quantity: number }[];
  createdAt: string;
};

type OrdersResponse = ApiEnvelope<{ orders: Order[] }>;

export function CustomerDashboard() {
  const [orders, setOrders] = useState<Order[] | null>(null);
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
      <EmptyState title="Necesitas una sesión de cliente">
        <Link href="/login">Iniciar sesión</Link>
      </EmptyState>
    );
  }

  if (!orders) {
    return <EmptyState title="Cargando tus pedidos" />;
  }

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
        <EmptyState title="Aún no tienes pedidos">
          <Link href="/">Explorar catálogo</Link>
        </EmptyState>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div>
                <div className="product-card-top">
                  <span>{new Date(order.createdAt).toLocaleDateString("es-CO")}</span>
                  <StatusPill status={order.status} />
                </div>
                <h2>Pedido #{order.id.slice(-6)}</h2>
                <p>{order.deliveryAddress}</p>
                <ul>
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity} x {item.productName}
                    </li>
                  ))}
                </ul>
              </div>
              <strong>{formatCurrency(order.total)}</strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
