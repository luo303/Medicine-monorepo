import { Suspense } from "react";
import ReportsLoading from "@/app/(main)/reports/loading";
import { getMedicalInstitutions } from "@/features/basic-data/server/basic-data-server";
import { getInventories } from "@/features/inventory/server/inventory-server";
import { NewOrderClient } from "@/features/sales/components/new-order-client";
import { getSalesOrders } from "@/features/sales/server/sales-server";

async function NewSalesOrderLoader() {
  const [orders, institutions, inventories] = await Promise.all([
    getSalesOrders(),
    getMedicalInstitutions(),
    getInventories()
  ]);

  const institutionOptions = institutions.map(inst => ({
    approval_no: inst.approval_no,
    name: inst.name
  }));

  return <NewOrderClient orders={orders} institutions={institutionOptions} inventories={inventories} />;
}

export default async function NewSalesOrderPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <NewSalesOrderLoader />
    </Suspense>
  );
}
