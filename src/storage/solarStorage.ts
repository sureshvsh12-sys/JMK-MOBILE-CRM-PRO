import AsyncStorage from "@react-native-async-storage/async-storage";

export type SolarStatus =
  | "New Lead"
  | "Site Visit"
  | "Quotation"
  | "Approved"
  | "Installation"
  | "Completed"
  | "Cancelled";

export type SolarProject = {
  id: string;
  customerName: string;
  mobile: string;
  address: string;
  systemSizeKw: number;
  projectValue: number;
  advanceAmount: number;
  balanceAmount: number;
  status: SolarStatus;
  nextFollowUp: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type SolarProjectInput = Omit<
  SolarProject,
  "id" | "balanceAmount" | "createdAt" | "updatedAt"
>;

const STORAGE_KEY = "jmk_mobile_solar_projects";

function normalizeProject(project: SolarProject): SolarProject {
  const projectValue = Number(project.projectValue) || 0;
  const advanceAmount = Number(project.advanceAmount) || 0;

  return {
    ...project,
    systemSizeKw: Number(project.systemSizeKw) || 0,
    projectValue,
    advanceAmount,
    balanceAmount: Math.max(projectValue - advanceAmount, 0),
  };
}

export async function getSolarProjects(): Promise<SolarProject[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as SolarProject[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeProject)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

async function saveSolarProjects(projects: SolarProject[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export async function getSolarProjectById(
  id: string
): Promise<SolarProject | undefined> {
  const projects = await getSolarProjects();
  return projects.find((project) => project.id === id);
}

export async function createSolarProject(
  input: SolarProjectInput
): Promise<SolarProject> {
  const projects = await getSolarProjects();
  const now = new Date().toISOString();
  const projectValue = Number(input.projectValue) || 0;
  const advanceAmount = Number(input.advanceAmount) || 0;

  const project: SolarProject = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    systemSizeKw: Number(input.systemSizeKw) || 0,
    projectValue,
    advanceAmount,
    balanceAmount: Math.max(projectValue - advanceAmount, 0),
    createdAt: now,
    updatedAt: now,
  };

  await saveSolarProjects([project, ...projects]);
  return project;
}

export async function updateSolarProject(
  id: string,
  input: SolarProjectInput
): Promise<SolarProject | undefined> {
  const projects = await getSolarProjects();
  const index = projects.findIndex((project) => project.id === id);
  if (index < 0) return undefined;

  const projectValue = Number(input.projectValue) || 0;
  const advanceAmount = Number(input.advanceAmount) || 0;
  const updated: SolarProject = {
    ...projects[index],
    ...input,
    systemSizeKw: Number(input.systemSizeKw) || 0,
    projectValue,
    advanceAmount,
    balanceAmount: Math.max(projectValue - advanceAmount, 0),
    updatedAt: new Date().toISOString(),
  };

  projects[index] = updated;
  await saveSolarProjects(projects);
  return updated;
}

export async function deleteSolarProject(id: string): Promise<void> {
  const projects = await getSolarProjects();
  await saveSolarProjects(projects.filter((project) => project.id !== id));
}
