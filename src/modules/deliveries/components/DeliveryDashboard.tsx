"use client";

import { Check, Navigation, TriangleAlert } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { EmptyState } from "@/shared/components/EmptyState";
import { StatusPill } from "@/shared/components/StatusPill";
import { formatCurrency } from "@/shared/lib/money";
import type { ApiEnvelope } from "@/shared/types/domain";

type Delivery = {
  id: string;
  status: string;
  incidentNote: string | null;
  order: {
    id: string;
    status: string;
    total: number;
    deliveryAddress: string;
    customerPhone: string;
    customerName: string;
    items: { id: string; productName: string; quantity: number }[];
  };
};

export function DeliveryDashboard() {
  const [deliveries, setDeliveries] = useState<Delivery[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [codeByDelivery, setCodeByDelivery] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function load() {
    fetch("/api/deliveries/assigned")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          setError(payload.error);
          return;
        }
        setDeliveries(
          (payload as ApiEnvelope<{ deliveries: Delivery[] }>).data.deliveries
        );
      })
      .catch(() => setError("No se pudieron cargar los domicilios"));
  }

  useEffect(load, []);

  function updateDelivery(deliveryId: string, action: "start" | "incident") {
    startTransition(async () => {
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          incidentNote: action === "incident" ? "Incidencia reportada por repartidor" : undefined
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

  function verify(deliveryId: string) {
    startTransition(async () => {
      const response = await fetch(`/api/deliveries/${deliveryId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeByDelivery[deliveryId] })
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload.error);
        return;
      }

      load();
    });
  }

  if (error) {
    return <EmptyState title="Panel de repartidor no disponible">{error}</EmptyState>;
  }

  if (!deliveries) {
    return <EmptyState title="Cargando domicilios" />;
  }

  const activeDeliveries = deliveries.filter(
    (delivery) => delivery.status !== "DELIVERED"
  );
  const completedDeliveries = deliveries.filter(
    (delivery) => delivery.status === "DELIVERED"
  );

  return (
    <section className="page-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Repartidor</p>
          <h1>Pedidos pendientes</h1>
        </div>
      </div>

      {activeDeliveries.length === 0 ? (
        <EmptyState title="No tienes pedidos pendientes" />
      ) : (
        <div className="order-list">
          {activeDeliveries.map((delivery) => (
            <article className="order-card delivery-card" key={delivery.id}>
              <div>
                <div className="product-card-top">
                  <span>{delivery.order.customerName}</span>
                  <StatusPill status={delivery.status} />
                </div>
                <h2>{delivery.order.deliveryAddress}</h2>
                <p>{delivery.order.customerPhone}</p>
                <ul>
                  {delivery.order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity} x {item.productName}
                    </li>
                  ))}
                </ul>
                <strong>{formatCurrency(delivery.order.total)}</strong>
              </div>

              <div className="delivery-actions">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => updateDelivery(delivery.id, "start")}
                >
                  <Navigation size={17} />
                  <span>En camino</span>
                </button>
                <label>
                  Código
                  <input
                    value={codeByDelivery[delivery.id] ?? ""}
                    onChange={(event) =>
                      setCodeByDelivery((current) => ({
                        ...current,
                        [delivery.id]: event.target.value
                      }))
                    }
                    inputMode="numeric"
                    maxLength={6}
                  />
                </label>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => verify(delivery.id)}
                >
                  <Check size={17} />
                  <span>Completar entrega</span>
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => updateDelivery(delivery.id, "incident")}
                >
                  <TriangleAlert size={17} />
                  <span>Incidencia</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {completedDeliveries.length > 0 ? (
        <section className="completed-deliveries">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Historial</p>
              <h2>Entregas completadas</h2>
            </div>
          </div>
          <div className="compact-list">
            {completedDeliveries.slice(0, 6).map((delivery) => (
              <div key={delivery.id}>
                <span>{delivery.order.customerName}</span>
                <strong>{formatCurrency(delivery.order.total)}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
