import type { ElectricityBillMetadata } from "@/types/electricity-bill"

const parseBillNumber = (value: unknown) => {
  const parsed = Number.parseFloat(String(value ?? ""))
  return Number.isFinite(parsed) ? parsed : 0
}

/** Actual unit price = total bill amount / higher of kWh or kVAh. */
export const calculateElectricityUnitPrice = (
  metadata: Pick<ElectricityBillMetadata, "totalAmount" | "unitKwh" | "unitKvah">
) => {
  const totalAmount = parseBillNumber(metadata.totalAmount)
  const billedUnits = Math.max(
    parseBillNumber(metadata.unitKwh),
    parseBillNumber(metadata.unitKvah)
  )

  return totalAmount > 0 && billedUnits > 0 ? totalAmount / billedUnits : 0
}

