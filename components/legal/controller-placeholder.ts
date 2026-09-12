import { COMPANY_NAME, PRODUCT_NAME } from "@/lib/brand";

/** Responsável pelo tratamento de dados (LGPD). */
export const DATA_CONTROLLER = {
  tradeName: PRODUCT_NAME,
  companyName: COMPANY_NAME,
  legalName: "54.595.080 IVAN ROBERTO MARTINS BARBOSA",
  documentId: "54.595.080/0001-02",
  /** Só cidade/UF — sem rua, número ou CEP em páginas públicas. */
  headquarters: "Santos/SP, Brasil",
  contactEmail: "privacidade@modernxlab.com.br",
} as const;

export const LEGAL_LAST_UPDATED = "12 de setembro de 2026";
