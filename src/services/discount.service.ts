import { prisma } from "@/lib/prisma";

export async function validateDiscount(code: string, subtotal: number) {
  const discount = await prisma.discountCode.findUnique({
    where: { code: code.toUpperCase() },
  });
  const now = new Date();

  if (
    !discount?.isActive ||
    (discount.startDate && discount.startDate > now) ||
    (discount.endDate && discount.endDate < now) ||
    (discount.usageLimit !== null &&
      discount.usedCount >= discount.usageLimit) ||
    Number(discount.minimumAmount) > subtotal
  ) {
    return null;
  }

  const value = Number(discount.value);
  const cap = discount.cap === null ? undefined : Number(discount.cap);
  const discountAmount =
    discount.type === "PERCENT"
      ? Math.min((subtotal * value) / 100, cap ?? Infinity)
      : Math.min(value, subtotal);

  return { discount, discountAmount };
}
