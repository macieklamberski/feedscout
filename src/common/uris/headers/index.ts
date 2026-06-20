import LinkHeader from 'http-link-header'
import { matchesAnyOfLinkSelectors } from '../../../common/utils.js'
import type { HeadersMethodOptions } from './types.js'

// RFC 8288 uses double-quoted strings, which the parser already unwraps. Strip a
// surrounding single-quote pair too, since some servers use them non-standardly.
const stripQuotes = (value: string): string => {
  const first = value[0]

  if (value.length >= 2 && (first === '"' || first === "'") && value[value.length - 1] === first) {
    return value.slice(1, -1)
  }

  return value
}

export const discoverUrisFromHeaders = (
  headers: Headers,
  options: HeadersMethodOptions,
): Array<string> => {
  const linkHeader = headers.get('link')

  if (!linkHeader) {
    return []
  }

  // LinkHeader.parse handles RFC 8288 quoting/escaping (so a decoy `rel=` inside a
  // quoted value can't be read as the rel) and throws on malformed input.
  let refs: ReturnType<typeof LinkHeader.parse>['refs']

  try {
    refs = LinkHeader.parse(linkHeader).refs
  } catch {
    return []
  }

  const uris = new Set<string>()

  for (const ref of refs) {
    const rel = ref.rel ? stripQuotes(ref.rel) : undefined
    const type = ref.type ? stripQuotes(ref.type) : undefined

    if (rel && matchesAnyOfLinkSelectors(rel, type, options.linkSelectors)) {
      uris.add(ref.uri)
    }
  }

  return [...uris]
}
