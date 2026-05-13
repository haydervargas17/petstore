import clsx from "clsx";

const labels: Record<string, string> = {
  available: "Disponible",
  out_of_stock: "Agotado",
  discounted: "Descuento",
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  SHIPPED: "Enviado",
  ON_THE_WAY: "En camino",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  ASSIGNED: "Asignado",
  INCIDENT_REPORTED: "Incidencia"
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={clsx("status-pill", `status-${status.toLowerCase()}`)}>
      {labels[status] ?? status}
    </span>
  );
}
