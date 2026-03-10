export const deduplicateResults = <T extends { url: string }>(results: Array<T>): Array<T> => {
  const seen = new Set<string>()

  return results.filter((result) => {
    if (seen.has(result.url)) {
      return false
    }

    seen.add(result.url)

    return true
  })
}
