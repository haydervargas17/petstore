"use client";

import {
  Check,
  CheckCircle2,
  Clock3,
  Navigation,
  PackageCheck,
  TriangleAlert
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { EmptyState } from "@/shared/components/EmptyState";
import { StatusPill } from "@/shared/components/StatusPill";
import { useToast } from "@/shared/components/ToastProvider";
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

type DeliveryFilter = "active" | "completed";

export function DeliveryDashboard() {
  const [deliveries, setDeliveries] = useState<Delivery[] | null>(null);
  const [filter, setFilter] = useState<DeliveryFilter>("active");
  const [error, setError] = useState<string | null>(null);
  const [codeByDelivery, setCodeByDelivery] = useState<Record<string, string>>({});
  const { showToast } = useToast();
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
        showToast(payload.error ?? "No se pudo actualizar la entrega", "error");
        return;
      }

      showToast(
        action === "incident" ? "Incidencia reportada" : "Entrega marcada en camino",
        "success"
      );
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
        showToast(payload.error ?? "Codigo de entrega invalido", "error");
        return;
      }

      showToast("Entrega completada correctamente", "success");
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
  const inRouteDeliveries = activeDeliveries.filter(
    (delivery) => delivery.status !== "ASSIGNED"
  );
  const visibleDeliveries =
    filter === "completed" ? completedDeliveries : activeDeliveries;

  return (
    <section className="page-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Repartidor</p>
          <h1>Pedidos pendientes</h1>
          <p className="section-note">
            El codigo lo recibe el cliente cuando confirma el pedido. Al entregar,
            pides ese codigo y lo escribes aqui para cerrar la venta.
          </p>
        </div>
      </div>

      <div className="profile-dashboard">
        <div className="profile-summary-grid">
          <div className="profile-summary-card">
            <PackageCheck size={20} />
            <span>Asignados</span>
            <strong>{activeDeliveries.length}</strong>
          </div>
          <div className="profile-summary-card">
            <Navigation size={20} />
            <span>En camino</span>
            <strong>{inRouteDeliveries.length}</strong>
          </div>
          <div className="profile-summary-card">
            <CheckCircle2 size={20} />
            <span>Entregados</span>
            <strong>{completedDeliveries.length}</strong>
          </div>
          <div className="profile-summary-card">
            <Clock3 size={20} />
            <span>Total cartera</span>
            <strong>
              {formatCurrency(
                activeDeliveries.reduce((sum, delivery) => sum + delivery.order.total, 0)
              )}
            </strong>
          </div>
        </div>

        <div className="dashboard-tabs" aria-label="Filtrar entregas">
          <button
            type="button"
            className={filter === "active" ? "is-active" : undefined}
            onClick={() => setFilter("active")}
          >
            Pendientes
          </button>
          <button
            type="button"
            className={filter === "completed" ? "is-active" : undefined}
            onClick={() => setFilter("completed")}
          >
            Completadas
          </button>
        </div>

        {visibleDeliveries.length === 0 ? (
          <EmptyState
            title={
              filter === "completed"
                ? "Aun no tienes entregas completadas"
                : "No tienes pedidos pendientes"
            }
          />
        ) : filter === "active" ? (
          <div className="order-list">
            {visibleDeliveries.map((delivery) => (
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
                  {delivery.status === "ASSIGNED" ? (
                    <button
                      className="delivery-start-button"
                      type="button"
                      disabled={isPending}
                      onClick={() => updateDelivery(delivery.id, "start")}
                    >
                      <Navigation size={17} />
                      <span>Marcar en camino</span>
                    </button>
                  ) : null}
                  <label>
                    Codigo del cliente
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
                      placeholder="6 digitos"
                    />
                    <span>Solo se completa si coincide con el codigo del pedido.</span>
                  </label>
                  <button
                    className="delivery-complete-button"
                    type="button"
                    disabled={isPending}
                    onClick={() => verify(delivery.id)}
                  >
                    <Check size={17} />
                    <span>Completar entrega</span>
                  </button>
                  <button
                    className="delivery-incident-button"
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
        ) : (
          <div className="completed-deliveries">
            <div className="compact-list">
              {visibleDeliveries.map((delivery) => (
                <div key={delivery.id}>
                  <span>{delivery.order.customerName}</span>
                  <strong>{formatCurrency(delivery.order.total)}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
