const KEY = "padaraksha_settings"

export interface FactorySettings {
  articleNumberPrefix: string
}

const DEFAULTS: FactorySettings = {
  articleNumberPrefix: "",
}

export function getSettings(): FactorySettings {
  if (typeof window === "undefined") return DEFAULTS
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export function saveSettings(patch: Partial<FactorySettings>): void {
  localStorage.setItem(KEY, JSON.stringify({ ...getSettings(), ...patch }))
}
