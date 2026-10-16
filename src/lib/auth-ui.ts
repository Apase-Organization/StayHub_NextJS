export function displayPlace(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function authResponseSucceeded(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  return (
    "success" in value &&
    value.success === true &&
    "data" in value &&
    "errorCode" in value &&
    value.errorCode === null &&
    "message" in value &&
    typeof value.message === "string"
  );
}
