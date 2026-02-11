/** Map i18n language code to Intl locale string for date formatting. */
export function getDateLocale(language: string): string {
  return language === "ru" ? "ru-RU" : "en-US";
}
