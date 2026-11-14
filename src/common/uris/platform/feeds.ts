import {
  composeQuery,
  decodePercent,
  encodePathSegment,
  escapeRegex,
  getQueryParam,
  getSubdomain,
  isHttpUrl,
  isString,
  parseUrl,
  stripWww,
  t,
  trimObject,
} from 'trousse'
import locales from '../../../locales.json' with { type: 'json' }
import type { DiscoverUriEntry, DiscoverUriHint } from '../../types.js'
import { composeHint } from '../../utils.js'

export type PlatformFeedTemplate = {
  key: string
  // A feed URL with `{name}` placeholders, each one host label, path segment or query value, and
  // `{scheme}` for a feed served under the page's own scheme. A template opening with `{root}`
  // takes the scheme, the host and an optional base path, as `https://example.com/forum`. A
  // `{name*}` path placeholder takes one or more segments, filled from `name` as `docs/api`.
  template: string
  format?: DiscoverUriHint['format']
  // Another spelling of one feed, such as a legacy host. Its canonical row is the nearest row above
  // it with the same key, format and value placeholders and no `isAlias`, and the table throws when
  // there is none. `{scheme}`, `{host}`, `{root}` and `{domain}` are no value placeholders.
  isAlias?: boolean
}

// A value left undefined is no value, so the row it would fill is skipped.
export type PlatformFeedParams = Record<string, string | undefined>

export type PlatformFeedTableOptions = {
  // The hosts a `{host}` placeholder stands for, with every host under `domains`. `getFeedHint`
  // claims a host under `domains` only for a single tenant label.
  // A pattern stands for one name across suffixes, such as `/^example\.(?:com|de)$/`, anchored at
  // both ends, and matches the host as given or without `www`.
  hosts?: Array<string | RegExp>
  // The domains a `{domain}` placeholder stands for. A pattern stands for a family of domains, such
  // as `/^blogspot\.(?:com|com\.[a-z]{2})$/`, anchored at both ends.
  domains?: Array<string | RegExp>
  // Whether `www` can be a tenant, so `www.example.com` matches a `{user}.example.com` row.
  isWwwTenant?: boolean
  // Whether `www` in front of a tenant label is dropped, so `www.alice.example.com` matches as
  // `alice.example.com`.
  isWwwTenantPrefix?: boolean
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
  isFeedUrlWithOptionalWww: (url: URL) => boolean
  getUrl: (params?: PlatformFeedParams) => string
}

const templateRegex = /^(https?|\{scheme\}):\/\/([^/?#]+)(\/[^?#]*)?(?:\?([^#]*))?$/i
const placeholderRegex = /\{(\w+\*?)\}/g
const trailingSlashRegex = /\/$/
const nonAsciiRegex = /\P{ASCII}+/gu
const leadingSlashesRegex = /^\/{2,}/
const anchorsRegex = /^\^|\$$/g

const rootPlaceholder = '{root}'
// The placeholders `forUrl` fills from the page URL, which two spellings of one feed may differ in.
const pageNames = ['scheme', 'host', 'root', 'domain']
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

// The value placeholders of a template, which tell the feeds under one key apart.
const getValueNames = (template: string): string => {
  const names = [...template.matchAll(placeholderRegex)].map(([, name]) => name)

  return [...new Set(names.filter((name) => !pageNames.includes(name)))]
    .sort((a, b) => a.localeCompare(b))
    .join(' ')
}

// A host or domain entry as a regex source: a string as a literal, a pattern without its anchors.
const toEntrySource = (entry: string | RegExp): string => {
  return isString(entry) ? escapeRegex(entry) : `(?:${entry.source.replace(anchorsRegex, '')})`
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
  const hosts = options.hosts ?? []
  const domains = (options.domains ?? []).map((domain) => toEntrySource(domain))
  const domainSource = `(?:${domains.join('|')})`
  // One host label other than `www` unless `www` is a tenant.
  const tenantSource = options.isWwwTenant ? '[^./]+' : '(?!www\\.)[^./]+'

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
  // A fixed host matches with or without `www` in front, a tenant label only with
  // `isWwwTenantPrefix`, so `www.alice.example.com` is otherwise no tenant's host.
  const toHostPathRegex = (isWwwOptional: boolean): RegExp => {
    const wwwSource = isWwwOptional ? '(?:www\\.)?' : ''
    const tenantWwwSource = options.isWwwTenantPrefix ? wwwSource : ''
    const normalize = (value: string): string => (isWwwOptional ? stripWww(value) : value)
    const hostSources = [
      ...hosts.map((value) => {
        return `${wwwSource}${toEntrySource(isString(value) ? normalize(value) : value)}`
      }),
      ...(domains.length > 0 ? [`${tenantWwwSource}${tenantSource}\\.${domainSource}`] : []),
    ]
    const isFixedHost = !host.startsWith('{') || host.startsWith('{domain}')
    const fixedPrefixSource = isFixedHost ? wwwSource : ''
    const isTenantHost = !isFixedHost && !host.startsWith('{host}')
    const tenantPrefixSource = isTenantHost ? tenantWwwSource : ''
    const hostSource = toRegexSource(normalize(host), tenantSource, {
      host: `(?:${hostSources.join('|')})`,
      domain: domainSource,
    })

    return new RegExp(`^${fixedPrefixSource}${tenantPrefixSource}${hostSource}${pathSource}$`, 'i')
  }
  const asGivenRegex = toHostPathRegex(false)
  const optionalWwwRegex = toHostPathRegex(true)
  const queryRegexes = query.map(([name, value]): [string, RegExp] => {
    return [name, new RegExp(`^${toRegexSource(value, '.+')}$`, 'i')]
  })

  const matchesUrl = (url: URL, hostPathRegex: RegExp): boolean => {
    // A `{root}` table without hosts serves any site, so nothing in its URL names the platform.
    if (isRootTemplate && !hasHosts) {
      return false
    }

    // A doubled slash after the host names the same feed: pages link `host//feed` for `host/feed`.
    const path = url.pathname.replace(leadingSlashesRegex, '/')
    const pathname = decodePath(path).replace(trailingSlashRegex, '')

    if (!hostPathRegex.test(url.hostname + pathname)) {
      return false
    }

    return queryRegexes.every(([name, regex]) => {
      const value = getQueryParam(url, name)

      return value !== undefined && regex.test(value)
    })
  }

  const isFeedUrl = (url: URL): boolean => {
    return matchesUrl(url, asGivenRegex)
  }

  const isFeedUrlWithOptionalWww = (url: URL): boolean => {
    return matchesUrl(url, optionalWwwRegex)
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
    const queryParams = Object.fromEntries(
      query.map(([name, value]) => [name, fillPlaceholders(value)]),
    )
    // Pages link a query value percent-encoded, as `?tag=%E6%8A%80%E8%A1%93` for `技術`.
    const builtQuery = composeQuery(queryParams).replace(nonAsciiRegex, encodeURIComponent)

    // A root is written as given, without the trailing slash the path brings.
    const origin = isRootTemplate
      ? fillPlaceholders(rootPlaceholder).replace(trailingSlashRegex, '')
      : `${fillPlaceholders(scheme)}://${fillPlaceholders(host)}`

    return `${origin}${fillPlaceholders(path, encodePath)}${builtQuery}`
  }

  return {
    key,
    format,
    queryCount: query.length,
    names,
    isFeedUrl,
    isFeedUrlWithOptionalWww,
    getUrl,
  }
}

// One table of a handler's feed URLs, keyed by hint key. `getFeedUrl` writes a feed from the values
// a page gave, `getFeedEntry` adds its hint, and `getFeedHint` reads a URL back to the feed's hint.
export const definePlatformFeeds = (
  templates: Array<PlatformFeedTemplate>,
  options: PlatformFeedTableOptions = {},
): PlatformFeedTable => {
  for (const [index, { key, format, template, isAlias }] of templates.entries()) {
    if (!isAlias) {
      continue
    }

    const valueNames = getValueNames(template)
    const hasCanonical = templates.slice(0, index).some((row) => {
      return (
        !row.isAlias &&
        row.key === key &&
        row.format === format &&
        getValueNames(row.template) === valueNames
      )
    })

    if (!hasCanonical) {
      throw new Error(t(locales.errors.missingCanonicalFeedTemplate, { key }))
    }
  }

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

    // With `www` a tenant, a host as given wins, so `www.example.com` is the tenant `www`.
    if (options.isWwwTenant) {
      const template = bySpecificity.find((candidate) => candidate.isFeedUrl(parsedUrl))

      if (template) {
        return composeHint(template.key, template.format)
      }
    }

    const template = bySpecificity.find((candidate) => {
      return candidate.isFeedUrlWithOptionalWww(parsedUrl)
    })

    if (!template) {
      return
    }

    return composeHint(template.key, template.format)
  }

  // The table for one page: `{scheme}`, `{host}` and `{root}` come from the page URL, and `{domain}`
  // is its host without the subdomain under `domains`, `example.co.uk` for `alice.example.co.uk`. A
  // value the handler passes wins, so a handler passes a root with the base path the page names.
  const forUrl: PlatformFeedTable['forUrl'] = (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !isHttpUrl(parsedUrl)) {
      return
    }

    const subdomain = getSubdomain(parsedUrl, options.domains ?? [])
    const urlParams: PlatformFeedParams = {
      scheme: parsedUrl.protocol.slice(0, -1),
      host: parsedUrl.host,
      root: parsedUrl.origin,
      domain: subdomain ? parsedUrl.hostname.slice(subdomain.length + 1) : undefined,
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
