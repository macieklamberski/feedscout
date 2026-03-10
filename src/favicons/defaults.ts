export const defaultIconRels = [
  'icon',
  'shortcut',
  'apple-touch-icon',
  'apple-touch-icon-precomposed',
]

export const matchesIconRel = (rel: string): boolean => {
  const words = rel.toLowerCase().split(/\s+/)

  return words.some((word) => {
    return defaultIconRels.includes(word)
  })
}
