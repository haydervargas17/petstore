import { AppShell } from "@/shared/components/AppShell";
import { ProductCatalog } from "@/modules/catalog/components/ProductCatalog";

export default function Home() {
  return (
    <AppShell active="catalog">
      <ProductCatalog />
    </AppShell>
  );
}
