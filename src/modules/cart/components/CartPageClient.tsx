"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { EmptyState } from "@/shared/components/EmptyState";
import { useToast } from "@/shared/components/ToastProvider";
import { formatCurrency } from "@/shared/lib/money";
import type { ApiEnvelope, ProductListItem } from "@/shared/types/domain";

type CartItem = {
  id: string;
  product: ProductListItem;
  quantity: number;
  total: number;
};

type Cart = {
  id: string;
  items: CartItem[];
  total: number;
};

type CartResponse = ApiEnvelope<{ cart: Cart }>;

export function CartPageClient() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  function loadCart() {
    fetch("/api/cart")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          setError(payload.error);
          return;
        }
        setCart((payload as CartResponse).data.cart);
      })
      .catch(() => setError("No se pudo cargar el carrito"));
  }

  useEffect(loadCart, []);

  function updateItem(itemId: string, quantity: number) {
    startTransition(async () => {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: quantity <= 0 ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: quantity <= 0 ? undefined : JSON.stringify({ quantity })
      });
      const payload = await response.json();
      if (!response.ok) {
        showToast(payload.error ?? "No se pudo actualizar el carrito", "error");
        return;
      }
      setCart((payload as CartResponse).data.cart);
      showToast(
        quantity <= 0 ? "Producto eliminado del carrito" : "Carrito actualizado",
        "success"
      );
    });
  }

  function confirmOrder() {
    setVerificationCode(null);
    startTransition(async () => {
      const response = await fetch("/api/orders", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        showToast(payload.error ?? "No se pudo confirmar el pedido", "error");
        return;
      }
      setCart({ id: "empty", items: [], total: 0 });
      setVerificationCode(payload.data.verificationCode);
      showToast(payload.message ?? "Pedido creado correctamente", "success");
    });
  }

  if (error && !cart) {
    return (
      <EmptyState title="Inicia sesión para gestionar tu carrito">
        <Link href="/login">Entrar con mi cuenta</Link>
      </EmptyState>
    );
  }

  if (!cart) {
    return <EmptyState title="Cargando carrito" />;
  }

  if (cart.items.length === 0) {
    return (
      <div className="page-panel">
        {verificationCode ? (
          <div className="success-panel">
            <span>Codigo de entrega para dar al repartidor</span>
            <strong>{verificationCode}</strong>
            <p>Guardalo: el repartidor lo pedira al momento de entregar el pedido.</p>
          </div>
        ) : null}
        <EmptyState title="Tu carrito está vacío">
          <Link href="/">Ver catálogo</Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <section className="page-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Compra activa</p>
          <h1>Carrito</h1>
        </div>
        <strong>{formatCurrency(cart.total)}</strong>
      </div>

      <div className="cart-list">
        {cart.items.map((item) => (
          <article className="cart-row" key={item.id}>
            <img src={item.product.imageUrl} alt={item.product.name} />
            <div>
              <h2>{item.product.name}</h2>
              <span>{formatCurrency(item.product.finalPrice)}</span>
            </div>
            <div className="quantity-control">
              <button
                type="button"
                aria-label="Restar"
                onClick={() => updateItem(item.id, item.quantity - 1)}
              >
                <Minus size={16} />
              </button>
              <strong>{item.quantity}</strong>
              <button
                type="button"
                aria-label="Sumar"
                onClick={() => updateItem(item.id, item.quantity + 1)}
              >
                <Plus size={16} />
              </button>
            </div>
            <strong>{formatCurrency(item.total)}</strong>
            <button
              type="button"
              className="icon-danger"
              aria-label="Eliminar"
              onClick={() => updateItem(item.id, 0)}
            >
              <Trash2 size={17} />
            </button>
          </article>
        ))}
      </div>

      <div className="checkout-row">
        <Link className="secondary-button" href="/">
          Seguir comprando
        </Link>
        <button
          className="primary-button"
          type="button"
          disabled={isPending}
          onClick={confirmOrder}
        >
          Confirmar pedido
        </button>
      </div>
    </section>
  );
}
