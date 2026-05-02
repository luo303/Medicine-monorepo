import InstitutionsClient from "@/features/basic-data/components/institutions-client";
import { getMedicalInstitutions } from "@/features/basic-data/server/basic-data-server";

export default async function InstitutionsPage() {
  const institutions = await getMedicalInstitutions();

  return <InstitutionsClient institutions={institutions} />;
}
