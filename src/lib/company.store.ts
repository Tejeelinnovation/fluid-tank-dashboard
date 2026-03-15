import "server-only";
import { readCompanies, writeCompanies, slugify, type Company } from "./dbCompanies";

export type BasicCompany = {
  id: string;
  name: string;
  logoUrl?: string;
};

export async function getCompanies(): Promise<BasicCompany[]> {
  const { companies } = await readCompanies();

  return companies.map((company) => ({
    id: company.id,
    name: company.name,
    logoUrl: company.logoUrl,
  }));
}

export async function addCompany(
  input: Omit<BasicCompany, "id">
): Promise<BasicCompany> {
  const { companies } = await readCompanies();

  const newCompany: Company = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    slug: slugify(input.name),
    logoUrl: input.logoUrl?.trim() || "",
    companyLoginId: "",
    passwordHash: "",
    tanksCount: 0,
    tankCapacities: [],
    csvPath: "",
    dataMode: "generated",
    createdAt: new Date().toISOString(),
  };

  companies.unshift(newCompany);
  await writeCompanies({ companies });

  return {
    id: newCompany.id,
    name: newCompany.name,
    logoUrl: newCompany.logoUrl,
  };
}

export async function deleteCompany(id: string) {
  const { companies } = await readCompanies();

  await writeCompanies({
    companies: companies.filter((company) => company.id !== id),
  });
}