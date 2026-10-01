import { getPathSegments, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers page, pageQuery.
// Handler needed for: home.

// PmWiki names a group with a leading capital, so the first such segment ends the script path.
const groupRegex = /^\p{Lu}[\p{L}\d_]*(?:-[\p{L}\d_]+)*$/u
const pageNameSeparatorRegex = /[./]/

export type PmwikiUrl =
  | { kind: 'page'; scriptPath: string; group: string }
  | { kind: 'home'; scriptPath: string }

// Every skin template carries the directive comment, and PmWiki prints it into the page.
export const isPmwikiHtml = (content: string): boolean => {
  return content.includes('<!--HTMLHeader-->')
}

export const parsePmwikiUrl = (url: string): PmwikiUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const [nameGroup] = parsedUrl.searchParams.get('n')?.split(pageNameSeparatorRegex) ?? []

  if (nameGroup) {
    return { kind: 'page', scriptPath: parsedUrl.pathname, group: nameGroup }
  }

  const segments = getPathSegments(url)
  const groupIndex = segments.findIndex((segment) => groupRegex.test(segment))
  const group = segments[groupIndex]

  if (!group) {
    return { kind: 'home', scriptPath: parsedUrl.pathname }
  }

  return { kind: 'page', scriptPath: `/${segments.slice(0, groupIndex).join('/')}`, group }
}

export const pmwikiHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isPmwikiHtml })) {
      return false
    }

    return parsePmwikiUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePmwikiUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    // The query form answers under clean URLs, path info and the bare script alike.
    const scriptUrl = `${origin}${parsed.scriptPath}`
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'page') {
      const groupChanges = `${parsed.group}.RecentChanges`

      uris.push(
        {
          uri: `${scriptUrl}?${new URLSearchParams({ n: groupChanges, action: 'rss' })}`,
          hint: composeHint('pmwiki:group-changes', 'rss'),
        },
        {
          uri: `${scriptUrl}?${new URLSearchParams({ n: groupChanges, action: 'atom' })}`,
          hint: composeHint('pmwiki:group-changes', 'atom'),
        },
      )
    }

    uris.push(
      {
        uri: `${scriptUrl}?${new URLSearchParams({ n: 'Site.AllRecentChanges', action: 'rss' })}`,
        hint: composeHint('pmwiki:site-changes', 'rss'),
      },
      {
        uri: `${scriptUrl}?${new URLSearchParams({ n: 'Site.AllRecentChanges', action: 'atom' })}`,
        hint: composeHint('pmwiki:site-changes', 'atom'),
      },
    )

    return uris
  },
}
