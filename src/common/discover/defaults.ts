import { parseFeed } from 'feedsmith'
import type { DiscoverFetchFn, DiscoverResolveSiteUrlFn, DiscoverResolveUrlFn } from '../types.js'
import { getFeedSiteUrl } from './utils.js'

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
  try {
    return new URL(url, baseUrl).href
  } catch {
    return
  }
}

// TODO: parseFeed is called here and again in discoverUrisFromFeed for the favicons
// discoverer. Consider caching the parsed result to avoid double parsing.
export const defaultResolveSiteUrlFn: DiscoverResolveSiteUrlFn = (input, resolveUrlFn) => {
  if (!input.content) {
    return
  }

  try {
    let siteUrl = getFeedSiteUrl(parseFeed(input.content))

    // Fall back to origin if no site URL found in feed metadata.
    if (!siteUrl) {
      try {
        siteUrl = new URL(input.url).origin
      } catch {}
    } else {
      // Resolve relative site URLs against the feed URL.
      siteUrl = resolveUrlFn(siteUrl, input.url)
    }

    // Avoid re-fetching the same URL.
    if (siteUrl && new URL(siteUrl).href === new URL(input.url).href) {
      return
    }

    return siteUrl
  } catch {}
}
