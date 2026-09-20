import { detectAtomFeed, detectJsonFeed, detectRdfFeed, detectRssFeed, parseFeed } from 'feedsmith'
import type { DiscoverFetchFn, DiscoverResolveSiteUrlFn, DiscoverResolveUrlFn } from '../types.js'
import { parseUrl } from '../utils.js'
import { attempt, getFeedSiteUrl } from './utils.js'

export const defaultFetchFn: DiscoverFetchFn = async (url, options) => {
  const response = await fetch(url, {
    method: options?.method ?? 'GET',
    headers: options?.headers,
  })

  return {
    headers: response.headers,
    body: await response.text(),
    url: response.url,
    status: response.status,
    statusText: response.statusText,
  }
}

export const defaultResolveUrlFn: DiscoverResolveUrlFn = (url, baseUrl) => {
  return new URL(url, baseUrl).href
}

// TODO: parseFeed is called here and again in discoverUrisFromFeed for the favicons
// discoverer. Consider caching the parsed result to avoid double parsing.
export const defaultResolveSiteUrlFn: DiscoverResolveSiteUrlFn = (input, resolveUrlFn) => {
  // Non-feed input is the usual case, since favicons and blogrolls are mostly discovered from an
  // HTML page, so it is answered by detection and not by a failed parse.
  // TODO: Replace the four detectors with Feedsmith's detectFeed once it is released:
  // https://github.com/macieklamberski/feedsmith/pull/382
  const isFeed =
    detectRssFeed(input.content) ||
    detectAtomFeed(input.content) ||
    detectRdfFeed(input.content) ||
    detectJsonFeed(input.content)

  if (!input.content || !isFeed) {
    return
  }

  // A feed that does not parse gives no site URL, and a site link that does not resolve falls
  // back to the origin below. Both stay quiet: this function has no onError to report to, and it
  // is public, so callers rely on it returning nothing in these cases.
  const parsed = attempt(() => parseFeed(input.content), undefined, 'resolveSiteUrlFn', undefined)

  if (!parsed) {
    return
  }

  const inputUrl = parseUrl(input.url)
  const feedSiteUrl = getFeedSiteUrl(parsed)
  // Resolve relative site URLs against the feed URL.
  const resolvedSiteUrl = feedSiteUrl
    ? attempt(() => resolveUrlFn(feedSiteUrl, input.url), undefined, 'resolveUrlFn', undefined)
    : undefined
  const siteUrl = resolvedSiteUrl ? parseUrl(resolvedSiteUrl) : undefined

  // Strip fragment - fragments are client-side only and irrelevant for fetching.
  if (siteUrl) {
    siteUrl.hash = ''
  }

  if (siteUrl && siteUrl.href !== inputUrl?.href) {
    return siteUrl.href
  }

  // Fall back to origin if no site URL found in feed metadata or if it resolves to the feed
  // URL itself, unless the origin is the input too, which would re-fetch the same URL.
  const originUrl = inputUrl ? parseUrl(inputUrl.origin) : undefined

  if (!originUrl || originUrl.href === inputUrl?.href) {
    return
  }

  return originUrl.origin
}
