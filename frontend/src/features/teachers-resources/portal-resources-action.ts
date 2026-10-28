"use server";

import {
  loadSchoolPortalResources,
  loadTeacherPortalResources,
  type PortalResourcesPayload,
} from "./portal-resources-data";

export type { PortalResourcesPayload };

export async function loadSchoolPortalResourcesAction(): Promise<PortalResourcesPayload> {
  return loadSchoolPortalResources();
}

export async function loadTeacherPortalResourcesAction(): Promise<PortalResourcesPayload> {
  return loadTeacherPortalResources();
}
