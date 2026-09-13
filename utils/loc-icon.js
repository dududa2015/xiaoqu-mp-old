const LOC_ICON_DEFAULT = -1

const LOC_ICON_MAP_PATHS = [
  '/images/controls/location-64.png',
  '/images/controls/location-fill-64.png',
  '/images/controls/location-north-line-fill-64.png',
]

const LOC_ICON_DEFAULT_CHIP = '/images/controls/location-fill-64.png'

const MAP_CENTER_OFFSET_DEFAULT = [0.5, 0.5]
const MAP_CENTER_OFFSET_LOC_ICON = [0.5, 0.35]

function normalizeLocIconIndex(raw) {
  if (raw === '' || raw === undefined || raw === null) {
    return LOC_ICON_DEFAULT
  }
  const index = parseInt(raw, 10)
  if (Number.isNaN(index) || index < 0) {
    return LOC_ICON_DEFAULT
  }
  if (index >= LOC_ICON_MAP_PATHS.length) {
    return LOC_ICON_DEFAULT
  }
  return index
}

function isCustomLocIconIndex(index) {
  return index >= 0 && index < LOC_ICON_MAP_PATHS.length
}

function getLocIconPath(index) {
  const normalized = normalizeLocIconIndex(index)
  if (!isCustomLocIconIndex(normalized)) {
    return null
  }
  return LOC_ICON_MAP_PATHS[normalized]
}

function getLocIconPickerList() {
  return LOC_ICON_MAP_PATHS.map((url) => ({ url }))
}

module.exports = {
  LOC_ICON_DEFAULT,
  LOC_ICON_DEFAULT_CHIP,
  LOC_ICON_MAP_PATHS,
  MAP_CENTER_OFFSET_DEFAULT,
  MAP_CENTER_OFFSET_LOC_ICON,
  normalizeLocIconIndex,
  isCustomLocIconIndex,
  getLocIconPath,
  getLocIconPickerList,
}
