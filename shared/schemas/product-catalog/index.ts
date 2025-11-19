/**
 * Product Catalog Schemas
 * Модульная структура для Product Catalog feature
 */

// Tables
export { productCatalog } from "./catalog.schema";
export { productPriceHistory } from "./price-history.schema";
export { priceSearchReports } from "./search-reports.schema";

// Types
export type { ProductCatalog, InsertProductCatalog } from "./catalog.schema";
export type { ProductPriceHistory, InsertProductPriceHistory } from "./price-history.schema";
export type { PriceSearchReport, InsertPriceSearchReport } from "./search-reports.schema";
