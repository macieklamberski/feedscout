import {
  composeQuery,
  decodePercent,
  encodePathSegment,
  escapeRegex,
  getQueryParam,
  isHttpUrl,
  parseUrl,
  stripWww,
  t,
} from 'trousse'
import locales from '../../../locales.json' with { type: 'json' }
import type { DiscoverUriEntry, DiscoverUriHint } from '../../types.js'
import { composeHint } from '../../utils.js'

export type PlatformFeedTemplate = {
  key: string
  // A feed URL with `{name}` placeholders, each one host label, path segment or query value, and
  // `{scheme}` for a feed served under the page's own scheme.
  template: string
  format?: DiscoverUriHint['format']
}

export type PlatformFeedParams = Record<string, string>

export type PlatformFeedTableOptions = {
  // The hosts a `{host}` placeholder stands for, with every host under `domains`.
  hosts?: Array<string>
  // The domains a `{domain}` placeholder stands for.
  domains?: Array<string>
}

export type PlatformFeedTable = {
  getFeedUrl: (
    key: string,
    params?: PlatformFeedParams,
    format?: DiscoverUriHint['format'],
  ) => string
  getFeedEntry: (
    key: string,
    params?: PlatformFeedParams,
    format?: DiscoverUriHint['format'],
  ) => DiscoverUriEntry
  getFeedKey: (url: string) => string | undefined
  getFeedFormat: (url: string) => DiscoverUriHint['format'] | undefined
}

type CompiledTemplate = {
  key: string
  format?: DiscoverUriHint['format']
  queryCount: number
  // The placeholder names the template fills.
  names: Array<string>
  isFeedUrl: (url: URL) => boolean
  getUrl: (params?: PlatformFeedParams) => string
}

const templateRegex = /^(https?|\{scheme\}):\/\/([^/?#]+)(\/[^?#]*)?(?:\?([^#]*))?$/i
const placeholderRegex = /\{(\w+)\}/g
const trailingSlashRegex = /\/$/

// A path decoded segment by segment, so `%40` and `@` compare equal. A decoded `%` and `/` are
// written back as `%25` and `%2F`, so `%252F` stays apart from `%2F` and no segment splits.
const decodePath = (path: string): string => {
  if (!path.includes('%')) {
    return path
  }

  return path
    .split('/')
    .map((segment) => decodePercent(segment).replaceAll('%', '%25').replaceAll('/', '%2F'))
    .join('/')
}

// A placeholder becomes the capture, the text around it a literal, decoded for a path so an
// encoded brace in it stays a literal.
const toRegexSource = (
  text: string,
  capture: string,
  captures: Record<string, string> = {},
  isPath = false,
): string => {
  return text
    .split(placeholderRegex)
    .map((piece, index) => {
      if (index % 2 === 1) {
        return captures[piece] ?? capture
      }

      return escapeRegex(isPath ? decodePath(piece) : piece)
    })
    .join('')
}

// A template as two functions: whether a URL is this feed, and the feed URL for a page's values.
const compileTemplate = (
  { key, format, template }: PlatformFeedTemplate,
  options: PlatformFeedTableOptions,
): CompiledTemplate => {
  const match = templateRegex.exec(template)

  if (!match) {
    throw new Error(t(locales.errors.invalidFeedTemplate, { template }))
  }

  const [, scheme, host, path = '', queryText = ''] = match
  const query = [...new URLSearchParams(queryText)]
  const hosts = (options.hosts ?? []).map((value) => escapeRegex(stripWww(value)))
  const domains = (options.domains ?? []).map(escapeRegex)
  const domainSource = `(?:${domains.join('|')})`
  const hostSources = [...hosts, ...(domains.length > 0 ? [`(?:[^/]+\\.)?${domainSource}`] : [])]

  if (
    (host.includes('{host}') && hostSources.length === 0) ||
    (host.includes('{domain}') && domains.length === 0)
  ) {
    throw new Error(t(locales.errors.missingFeedHosts, { key }))
  }

  // Matched on the host without `www` and the decoded path without its trailing slash.
  const hostSource = toRegexSource(stripWww(host), '[^.]+', {
    host: `(?:${hostSources.join('|')})`,
    domain: domainSource,
  })
  const pathSource = toRegexSource(path.replace(trailingSlashRegex, ''), '[^/]+', {}, true)
  const hostPathRegex = new RegExp(`^${hostSource}${pathSource}$`, 'i')
  const queryRegexes = query.map(([name, value]): [string, RegExp] => {
    return [name, new RegExp(`^${toRegexSource(value, '.+')}$`, 'i')]
  })

  const isFeedUrl = (url: URL): boolean => {
    const pathname = decodePath(url.pathname).replace(trailingSlashRegex, '')

    if (!hostPathRegex.test(stripWww(url.hostname) + pathname)) {
      return false
    }

    return queryRegexes.every(([name, regex]) => {
      const value = getQueryParam(url, name)

      return value !== undefined && regex.test(value)
    })
  }

  // A placeholder with no value stays in the URL, as in trousse's `t`.
  const getUrl = (params: PlatformFeedParams = {}): string => {
    const fillPlaceholders = (text: string, encode = (value: string) => value): string => {
      return text.replace(placeholderRegex, (placeholder, name: string) => {
        return Object.hasOwn(params, name) ? encode(params[name]) : placeholder
      })
    }
    const builtQuery = composeQuery(
      Object.fromEntries(query.map(([name, value]) => [name, fillPlaceholders(value)])),
    )

    return `${fillPlaceholders(scheme)}://${fillPlaceholders(host)}${fillPlaceholders(path, encodePathSegment)}${builtQuery}`
  }

  const names = [...template.matchAll(placeholderRegex)].map(([, name]) => name)

  return { key, format, queryCount: query.length, names, isFeedUrl, getUrl }
}

// One table of a handler's feed URLs, keyed by hint key. `getFeedUrl` writes a feed from the values
// a page gave, `getFeedEntry` adds its hint, and `getFeedKey` and `getFeedFormat` read a URL back
// to the feed's key and format.
export const definePlatformFeeds = (
  templates: Array<PlatformFeedTemplate>,
  options: PlatformFeedTableOptions = {},
): PlatformFeedTable => {
  const compiled = templates.map((template) => compileTemplate(template, options))
  // A template with more query parameters is the more specific one, so it is read first.
  const bySpecificity = [...compiled].sort((a, b) => b.queryCount - a.queryCount)

  const getFeedUrl: PlatformFeedTable['getFeedUrl'] = (key, params, format) => {
    const candidates = compiled.filter((candidate) => {
      return candidate.key === key && (format === undefined || candidate.format === format)
    })
    // A key with several shapes builds the first one whose placeholders the values fill.
    const template =
      candidates.find((candidate) =>
        candidate.names.every((name) => params?.[name] !== undefined),
      ) ?? candidates[0]

    if (!template) {
      throw new Error(t(locales.errors.missingFeedTemplate, { key }))
    }

    return template.getUrl(params)
  }

  const getFeedEntry: PlatformFeedTable['getFeedEntry'] = (key, params, format) => {
    return { uri: getFeedUrl(key, params, format), hint: composeHint(key, format) }
  }

  const findTemplate = (url: string): CompiledTemplate | undefined => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !isHttpUrl(parsedUrl)) {
      return
    }

    return bySpecificity.find((candidate) => candidate.isFeedUrl(parsedUrl))
  }

  const getFeedKey: PlatformFeedTable['getFeedKey'] = (url) => {
    return findTemplate(url)?.key
  }

  const getFeedFormat: PlatformFeedTable['getFeedFormat'] = (url) => {
    return findTemplate(url)?.format
  }

  return { getFeedUrl, getFeedEntry, getFeedKey, getFeedFormat }
}
