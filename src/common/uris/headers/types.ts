import type { LinkSelector } from '../../types.js'

export type HeadersMethodOptions = {
  baseUrl?: string
  linkSelectors: ReadonlyArray<LinkSelector>
}
