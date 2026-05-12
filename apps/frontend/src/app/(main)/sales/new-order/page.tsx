import { NewOrderClient } from "@/features/sales/components/new-order-client";
import { getMedicalInstitutions, getDrugs } from "@/features/basic-data/server/basic-data-server";
import { getSalesOrders } from "@/features/sales/server/sales-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function NewSalesOrderLoader() {
  const [orders, institutions, drugs] = await Promise.all([getSalesOrders(), getMedicalInstitutions(), getDrugs()]);
  const institutionOptions = institutions.map(inst => ({
    approval_no: inst.approval_no,
    name: inst.name
  }));

  const drugOptions = drugs.map(drug => ({
    approval_no: drug.approval_no,
    name: drug.name,
    price: "0"
  }));
  return <NewOrderClient orders={orders} institutions={institutionOptions} drugs={drugOptions} />;
}
export default async function NewSalesOrderPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <NewSalesOrderLoader />
    </Suspense>
  );
}
