"use client"

import * as React from "react"

interface StoredBillAccounts {
  names: string[]
  numbers: string[]
  accounts: SavedBillAccount[]
}

interface SavedBillAccount {
  name: string
  number: string
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

const normalizeAccounts = (values: unknown): SavedBillAccount[] => {
  if (!Array.isArray(values)) return []

  const accounts = new Map<string, SavedBillAccount>()
  values.forEach((value) => {
    const account = value as LegacySavedBillAccount
    const name = typeof account?.name === "string" ? account.name.trim() : ""
    const number = typeof account?.number === "string" ? account.number.trim() : ""
    if (name && number) {
      accounts.set(`${name.toLocaleLowerCase()}\u0000${number.toLocaleLowerCase()}`, { name, number })
    }
  })

  return Array.from(accounts.values()).sort((a, b) => a.name.localeCompare(b.name))
}

function readAccounts(): StoredBillAccounts {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    const names = normalizeValues(parsed?.names)
    const numbers = normalizeValues(parsed?.numbers)
    const accounts = normalizeAccounts(parsed?.accounts)

    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "[]")
    if (Array.isArray(legacy)) {
      names.push(...normalizeValues(legacy.map((account: LegacySavedBillAccount) => account?.name)))
      numbers.push(...normalizeValues(legacy.map((account: LegacySavedBillAccount) => account?.number)))
      accounts.push(...normalizeAccounts(legacy))
    }

    return {
      names: normalizeValues(names),
      numbers: normalizeValues(numbers),
      accounts: normalizeAccounts(accounts),
    }
  } catch {
    return { names: [], numbers: [], accounts: [] }
  }
}

export function useSavedBillAccounts() {
  const [savedValues, setSavedValues] = React.useState<StoredBillAccounts>({ names: [], numbers: [], accounts: [] })

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

  const saveValue = React.useCallback((type: "names" | "numbers", value: string) => {
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

  const saveAccount = React.useCallback((name: string, number: string) => {
    const normalizedName = name.trim()
    const normalizedNumber = number.trim()
    if (!normalizedName || !normalizedNumber) return false

    setSavedValues((current) => {
      const next = {
        names: normalizeValues([...current.names, normalizedName]),
        numbers: normalizeValues([...current.numbers, normalizedNumber]),
        accounts: normalizeAccounts([...current.accounts, { name: normalizedName, number: normalizedNumber }]),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
    return true
  }, [])

  const getAccountNumbers = React.useCallback(
    (name: string) =>
      normalizeValues(savedValues.accounts.filter(
        (account) => account.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase(),
      ).map((account) => account.number)),
    [savedValues.accounts],
  )

  return {
    accountNames: savedValues.names,
    accountNumbers: savedValues.numbers,
    saveAccountName,
    saveAccountNumber,
    saveAccount,
    getAccountNumbers,
  }
}
