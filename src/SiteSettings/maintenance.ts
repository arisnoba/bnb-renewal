export const maintenanceDefaults = {
  message:
    '더 안정적인 서비스 제공을 위해 잠시 점검을 진행하고 있습니다. 이용에 불편을 드려 죄송합니다.',
  title: '사이트 점검 중입니다.',
}

export type MaintenanceSettings = {
  maintenanceMessage?: null | string
  maintenanceMode?: boolean | null
  maintenanceTitle?: null | string
}

function trimmedText(value: null | string | undefined, fallback: string) {
  const text = typeof value === 'string' ? value.trim() : ''

  return text || fallback
}

export function isMaintenanceModeEnabled(settings: MaintenanceSettings | null | undefined) {
  return settings?.maintenanceMode === true
}

export function maintenanceMessage(settings: MaintenanceSettings | null | undefined) {
  return trimmedText(settings?.maintenanceMessage, maintenanceDefaults.message)
}

export function maintenanceTitle(settings: MaintenanceSettings | null | undefined) {
  return trimmedText(settings?.maintenanceTitle, maintenanceDefaults.title)
}
