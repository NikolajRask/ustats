/** Resolve an ISO 3166-1 alpha-2 code to an English country name. */
export function countryDisplayName(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized || normalized === "(NONE)") return code;
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(normalized) ?? code
    );
  } catch {
    return code;
  }
}
