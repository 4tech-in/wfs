"use client"

import * as React from "react"

interface StoredBillAccounts {
  names: string[]
  numbers: string[]
}

interface LegacySavedBillAccount {
  name?: unknown
  number?: unknown
}

const STORAGE_KEY = "saved-bill-account-values"
const LEGACY_STORAGE_KEY = "saved-bill-accounts"

const normalizeValues = (values: unknown) => {
  if (!Array.isArray(values)) return []
  return Array.from(
    new Set(values.filter((value): value is string => typeof value === "string").map((value) => value.trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b))
}

function readAccounts(): StoredBillAccounts {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    const names = normalizeValues(parsed?.names)
    const numbers = normalizeValues(parsed?.numbers)

    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "[]")
    if (Array.isArray(legacy)) {
      names.push(...normalizeValues(legacy.map((account: LegacySavedBillAccount) => account?.name)))
      numbers.push(...normalizeValues(legacy.map((account: LegacySavedBillAccount) => account?.number)))
    }

    return { names: normalizeValues(names), numbers: normalizeValues(numbers) }
  } catch {
    return { names: [], numbers: [] }
  }
}

export function useSavedBillAccounts() {
  const [savedValues, setSavedValues] = React.useState<StoredBillAccounts>({ names: [], numbers: [] })

  React.useEffect(() => {
    const initialLoad = window.setTimeout(() => setSavedValues(readAccounts()), 0)

    const syncAccounts = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === LEGACY_STORAGE_KEY) {
        setSavedValues(readAccounts())
      }
    }

    window.addEventListener("storage", syncAccounts)
    return () => {
      window.clearTimeout(initialLoad)
      window.removeEventListener("storage", syncAccounts)
    }
  }, [])

  const saveValue = React.useCallback((type: keyof StoredBillAccounts, value: string) => {
    const normalizedValue = value.trim()
    if (!normalizedValue) return false

    setSavedValues((current) => {
      const next = {
        ...current,
        [type]: normalizeValues([...current[type], normalizedValue]),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
    return true
  }, [])

  const saveAccountName = React.useCallback((name: string) => saveValue("names", name), [saveValue])
  const saveAccountNumber = React.useCallback((number: string) => saveValue("numbers", number), [saveValue])

  return {
    accountNames: savedValues.names,
    accountNumbers: savedValues.numbers,
    saveAccountName,
    saveAccountNumber,
  }
}
