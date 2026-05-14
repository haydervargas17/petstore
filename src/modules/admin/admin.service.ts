import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";

export async function getDashboardStats() {
  const [
    totalOrders,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    revenue,
    lowStockProducts,
    topProducts
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
    prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
    prisma.order.aggregate({
      where: { status: OrderStatus.DELIVERED },
      _sum: { total: true }
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        stock: { lte: 5 }
      },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true
      },
      orderBy: { stock: "asc" },
      take: 8
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      where: {
        order: { status: OrderStatus.DELIVERED }
      },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 6
    })
  ]);

  const salesByDay = await prisma.$queryRaw<
    { day: Date; total: Prisma.Decimal; orders: bigint }[]
  >`
    SELECT DATE_TRUNC('day', "createdAt") AS day,
           SUM(total) AS total,
           COUNT(*) AS orders
    FROM orders
    WHERE status = 'DELIVERED'
    GROUP BY day
    ORDER BY day DESC
    LIMIT 14
  `;

  return {
    totals: {
      revenue: Number(revenue._sum.total ?? 0),
      totalOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders
    },
    lowStockProducts,
    topProducts: topProducts.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item._sum.quantity ?? 0,
      total: Number(item._sum.total ?? 0)
    })),
    salesByDay: salesByDay
      .map((item) => ({
        day: item.day.toISOString().slice(0, 10),
        total: Number(item.total),
        orders: Number(item.orders)
      }))
      .reverse()
  };
}
