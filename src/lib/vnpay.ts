import { createHmac } from "node:crypto";

type VnpayParams = Record<string, string | number | undefined>;

export function buildPaymentUrl(params: VnpayParams) {
  const vnpParams: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: requiredEnv("VNPAY_TMN_CODE"),
    vnp_CurrCode: "VND",
    vnp_Locale: "vn",
    vnp_ReturnUrl: requiredEnv("VNPAY_RETURN_URL"),
    ...stringify(params),
  };

  const query = sortedQuery(vnpParams);
  return `${requiredEnv("VNPAY_PAY_URL")}?${query}&vnp_SecureHash=${sign(query)}`;
}

export function verifyIpn(query: VnpayParams, expectedAmount?: number) {
  const result = verify(query);
  if (!result.valid) return result;
  if (
    expectedAmount !== undefined &&
    Number(result.params.vnp_Amount) !== expectedAmount * 100
  ) {
    return { valid: false, params: result.params };
  }
  return result;
}

export function verifyReturn(query: VnpayParams) {
  return verify(query);
}

function verify(query: VnpayParams) {
  const { vnp_SecureHash: secureHash, ...rest } = stringify(query);
  delete rest.vnp_SecureHashType;
  const sorted = sortedQuery(rest);
  return { valid: secureHash === sign(sorted), params: rest };
}

function stringify(params: VnpayParams) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)])
  );
}

function sortedQuery(params: Record<string, string>) {
  return Object.keys(params)
    .sort()
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(params[key]).replace(/%20/g, "+")}`
    )
    .join("&");
}

function sign(data: string) {
  return createHmac("sha512", requiredEnv("VNPAY_HASH_SECRET"))
    .update(data, "utf8")
    .digest("hex");
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
