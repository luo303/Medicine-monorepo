import InstitutionsClient from "@/features/basic-data/components/institutions-client";
import { getMedicalInstitutions } from "@/features/basic-data/server/basic-data-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function InstitutionsLoader() {
  const institutions = await getMedicalInstitutions();
  return <InstitutionsClient institutions={institutions} />;
}
export default async function InstitutionsPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <InstitutionsLoader />
    </Suspense>
  );
}
