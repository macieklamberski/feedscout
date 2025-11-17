export const normalizeMimeType = (type: string): string => {
  return type.split(';')[0].trim().toLowerCase()
}

export const includesAnyOf = (
  value: string,
  patterns: Array<string>,
  parser?: (value: string) => string,
): boolean => {
  const parsedValue = parser ? parser(value) : value?.toLowerCase()
  const normalizedPatterns = patterns.map((pattern) => pattern.toLowerCase())
  return normalizedPatterns.some((pattern) => parsedValue?.includes(pattern))
}

export const isAnyOf = (
  value: string,
  patterns: Array<string>,
  parser?: (value: string) => string,
): boolean => {
  const parsedValue = parser ? parser(value) : value?.toLowerCase()?.trim()
  return patterns.some((pattern) => parsedValue === pattern.toLowerCase().trim())
}
