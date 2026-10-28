"use server";

import { loadStudentPortalResources, type PortalResourcesPayload } from "./portal-resources-data";

export async function loadStudentPortalResourcesAction(): Promise<PortalResourcesPayload> {
  return loadStudentPortalResources();
}
