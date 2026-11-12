import {
  composeQuery,
  decodePercent,
  encodePathSegment,
  escapeRegex,
  getQueryParam,
  isHttpUrl,
  isString,
  parseUrl,
  stripWww,
  t,
  trimObject,
} from 'trousse'
import locales from '../../../locales.json' with { type: 'json' }
import type { DiscoverUriEntry, DiscoverUriHint } from '../../types.js'
import { composeHint, getPlatformDomain } from '../../utils.js'

export type PlatformFeedTemplate = {
  key: string
  // A feed URL with `{name}` placeholders, each one host label, path segment or query value, and
  // `{scheme}` for a feed served under the page's own scheme. A template opening with `{root}`
  // takes the scheme, the host and an optional base path, as `https://example.com/forum`. A
  // `{name*}` path placeholder takes one or more segments, filled from `name` as `docs/api`.
  template: string
  format?: DiscoverUriHint['format']
}

// A value left undefined is no value, so the row it would fill is skipped.
export type PlatformFeedParams = Record<string, string | undefined>

export type PlatformFeedTableOptions = {
  // The hosts a `{host}` placeholder stands for, with every host under `domains`. `getFeedHint`
  // claims a host under `domains` only for a single tenant label.
  hosts?: Array<string>
  // The domains a `{domain}` placeholder stands for. A pattern stands for a family of domains, such
  // as `/^blogspot\.(?:com|com\.[a-z]{2})$/`, anchored at both ends.
  domains?: Array<string | RegExp>
  // Whether `www` can be a tenant, so `www.example.com` matches a `{user}.example.com` row.
  isWwwTenant?: boolean
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
  getFeedHint: (url: string) => DiscoverUriHint | undefined
  forUrl: (url: string) => Pick<PlatformFeedTable, 'getFeedUrl' | 'getFeedEntry'> | undefined
}

type CompiledTemplate = {
  key: string
  format?: DiscoverUriHint['format']
  queryCount: number
  // The placeholder names the template fills.
  names: Array<string>
  isFeedUrl: (url: URL) => boolean
  isFeedUrlWithoutWww: (url: URL) => boolean
  getUrl: (params?: PlatformFeedParams) => string
}

const templateRegex = /^(https?|\{scheme\}):\/\/([^/?#]+)(\/[^?#]*)?(?:\?([^#]*))?$/i
const placeholderRegex = /\{(\w+\*?)\}/g
const trailingSlashRegex = /\/$/
const anchorsRegex = /^\^|\$$/g

const rootPlaceholder = '{root}'
const multiSegmentCapture = '[^/]+(?:/[^/]+)*'

const isMultiSegment = (placeholder: string): boolean => {
  return placeholder.endsWith('*')
}

// A `{name*}` value is one or more segments joined by `/`, and one with an empty segment is no
// value, as no feed URL claimed by the row carries one.
const getPlaceholderValue = (
  params: PlatformFeedParams,
  placeholder: string,
): string | undefined => {
  if (!isMultiSegment(placeholder)) {
    return params[placeholder]
  }

  const value = params[placeholder.slice(0, -1)]

  if (value === undefined || value.split('/').some((segment) => !segment)) {
    return
  }

  return value
}

const encodePath = (value: string, placeholder: string): string => {
  if (!isMultiSegment(placeholder)) {
    return encodePathSegment(value)
  }

  return value.split('/').map(encodePathSegment).join('/')
}

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
  const isRootTemplate = template.startsWith(rootPlaceholder)
  // A `{root}` template reads as one on `{host}`: a tenant serves from its origin.
  const match = templateRegex.exec(
    isRootTemplate ? template.replace(rootPlaceholder, 'https://{host}') : template,
  )

  if (!match) {
    throw new Error(t(locales.errors.invalidFeedTemplate, { template }))
  }

  const [, scheme, host, path = '', queryText = ''] = match
  const query = [...new URLSearchParams(queryText)]
  // A name with no value, such as `?rss`, is a flag, built with no value.
  const flags = new Set(query.filter(([, value]) => !value).map(([name]) => name))
  const hosts = options.hosts ?? []
  const domains = (options.domains ?? []).map((domain) => {
    return isString(domain) ? escapeRegex(domain) : `(?:${domain.source.replace(anchorsRegex, '')})`
  })
  const domainSource = `(?:${domains.join('|')})`

  const hasHosts = hosts.length > 0 || domains.length > 0

  if (
    (!isRootTemplate && host.includes('{host}') && !hasHosts) ||
    (host.includes('{domain}') && domains.length === 0)
  ) {
    throw new Error(t(locales.errors.missingFeedHosts, { key }))
  }

  const names = [...template.matchAll(placeholderRegex)].map(([, name]) => name)
  const multiSegmentCaptures = Object.fromEntries(
    names.filter(isMultiSegment).map((name) => [name, multiSegmentCapture]),
  )

  // Matched on the decoded path without its trailing slash.
  const pathSource = toRegexSource(
    path.replace(trailingSlashRegex, ''),
    '[^/]+',
    multiSegmentCaptures,
    true,
  )
  const toHostPathRegex = (normalize: (value: string) => string): RegExp => {
    const hostSources = [
      ...hosts.map((value) => escapeRegex(normalize(value))),
      ...(domains.length > 0 ? [`[^./]+\\.${domainSource}`] : []),
    ]
    const hostSource = toRegexSource(normalize(host), '[^.]+', {
      host: `(?:${hostSources.join('|')})`,
      domain: domainSource,
    })

    return new RegExp(`^${hostSource}${pathSource}$`, 'i')
  }
  const asGivenRegex = toHostPathRegex((value) => value)
  const withoutWwwRegex = toHostPathRegex(stripWww)
  const queryRegexes = query.map(([name, value]): [string, RegExp] => {
    return [name, new RegExp(`^${toRegexSource(value, '.+')}$`, 'i')]
  })

  const matchesUrl = (url: URL, hostPathRegex: RegExp, hostname: string): boolean => {
    // A `{root}` table without hosts serves any site, so nothing in its URL names the platform.
    if (isRootTemplate && !hasHosts) {
      return false
    }

    const pathname = decodePath(url.pathname).replace(trailingSlashRegex, '')

    if (!hostPathRegex.test(hostname + pathname)) {
      return false
    }

    return queryRegexes.every(([name, regex]) => {
      const value = getQueryParam(url, name, { preserveEmptyValues: flags.has(name) })

      return value !== undefined && regex.test(value)
    })
  }

  const isFeedUrl = (url: URL): boolean => {
    return matchesUrl(url, asGivenRegex, url.hostname)
  }

  const isFeedUrlWithoutWww = (url: URL): boolean => {
    return matchesUrl(url, withoutWwwRegex, stripWww(url.hostname))
  }

  // A placeholder with no value stays in the URL, as in trousse's `t`.
  const getUrl = (params: PlatformFeedParams = {}): string => {
    const fillPlaceholders = (
      text: string,
      encode = (value: string, _name: string) => value,
    ): string => {
      return text.replace(placeholderRegex, (placeholder, name: string) => {
        const value = getPlaceholderValue(params, name)

        return value === undefined ? placeholder : encode(value, name)
      })
    }
    const builtQuery = composeQuery(
      Object.fromEntries(
        query.map(([name, value]) => [name, flags.has(name) ? true : fillPlaceholders(value)]),
      ),
    )

    // A root is written as given, without the trailing slash the path brings.
    const origin = isRootTemplate
      ? fillPlaceholders(rootPlaceholder).replace(trailingSlashRegex, '')
      : `${fillPlaceholders(scheme)}://${fillPlaceholders(host)}`

    return `${origin}${fillPlaceholders(path, encodePath)}${builtQuery}`
  }

  return { key, format, queryCount: query.length, names, isFeedUrl, isFeedUrlWithoutWww, getUrl }
}

// One table of a handler's feed URLs, keyed by hint key. `getFeedUrl` writes a feed from the values
// a page gave, `getFeedEntry` adds its hint, and `getFeedHint` reads a URL back to the feed's hint.
export const definePlatformFeeds = (
  templates: Array<PlatformFeedTemplate>,
  options: PlatformFeedTableOptions = {},
): PlatformFeedTable => {
  const compiled = templates.map((template) => compileTemplate(template, options))
  // A template with more query parameters is the more specific one, so it is read first. At the
  // same count the earlier row wins, so a `{name*}` row goes after the rows its paths overlap.
  const bySpecificity = [...compiled].sort((a, b) => b.queryCount - a.queryCount)

  const getFeedUrl: PlatformFeedTable['getFeedUrl'] = (key, params, format) => {
    const candidates = compiled.filter((candidate) => {
      return candidate.key === key && (format === undefined || candidate.format === format)
    })
    // A key with several shapes builds the first one whose placeholders the values fill.
    const template =
      candidates.find((candidate) =>
        candidate.names.every((name) => getPlaceholderValue(params ?? {}, name) !== undefined),
      ) ?? candidates[0]

    if (!template) {
      throw new Error(t(locales.errors.missingFeedTemplate, { key }))
    }

    return template.getUrl(params)
  }

  const getFeedEntry: PlatformFeedTable['getFeedEntry'] = (key, params, format) => {
    return { uri: getFeedUrl(key, params, format), hint: composeHint(key, format) }
  }

  const getFeedHint: PlatformFeedTable['getFeedHint'] = (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !isHttpUrl(parsedUrl)) {
      return
    }

    // With `www` a tenant, a host as given wins, so `www.example.com` is the tenant `www` and
    // `www.alice.example.com` falls back to the host without `www`.
    if (options.isWwwTenant) {
      const template = bySpecificity.find((candidate) => candidate.isFeedUrl(parsedUrl))

      if (template) {
        return composeHint(template.key, template.format)
      }
    }

    const template = bySpecificity.find((candidate) => candidate.isFeedUrlWithoutWww(parsedUrl))

    if (!template) {
      return
    }

    return composeHint(template.key, template.format)
  }

  // The table for one page: `{scheme}`, `{host}` and `{root}` come from the page URL, and `{domain}`
  // from the entry of `domains` its host is under. A value the handler passes wins, so a handler
  // passes a root with the base path the page names.
  const forUrl: PlatformFeedTable['forUrl'] = (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !isHttpUrl(parsedUrl)) {
      return
    }

    const urlParams: PlatformFeedParams = {
      scheme: parsedUrl.protocol.slice(0, -1),
      host: parsedUrl.host,
      root: parsedUrl.origin,
      domain: getPlatformDomain(parsedUrl, options.domains ?? []),
    }
    // An undefined value the handler passes leaves the one of the page in place.
    const withUrlParams = (params: PlatformFeedParams = {}): PlatformFeedParams => {
      return { ...urlParams, ...trimObject(params) }
    }

    return {
      getFeedUrl: (key, params, format) => getFeedUrl(key, withUrlParams(params), format),
      getFeedEntry: (key, params, format) => getFeedEntry(key, withUrlParams(params), format),
    }
  }

  return { getFeedUrl, getFeedEntry, getFeedHint, forUrl }
}
