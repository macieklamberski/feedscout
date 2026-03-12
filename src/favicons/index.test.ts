import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverResult } from '../common/types.js'
import { discoverFavicons } from './index.js'
import type { FaviconResult } from './types.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    url,
    body: responses[url] ?? '',
    headers: new Headers(),
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

describe('discoverFavicons', () => {
  it('should discover favicons from html link tags', async () => {
    const html = '<link rel="icon" href="/favicon.ico">'
    const mockFetch = createMockFetch({
      'https://example.com': html,
      'https://example.com/favicon.ico': 'binary',
    })
    const value = await discoverFavicons('https://example.com', {
      methods: ['html'],
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'html' },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover favicons from headers', async () => {
    const fetchFn: DiscoverFetchFn = async (url: string) => ({
      url,
      body: '',
      headers: new Headers({
        link: '</favicon.png>; rel="icon"',
      }),
      status: 200,
      statusText: 'OK',
    })
    const value = await discoverFavicons('https://example.com', {
      methods: ['headers'],
      fetchFn,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.png', isValid: true, method: 'headers' },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover favicons from guess paths', async () => {
    const mockFetch = createMockFetch({
      'https://example.com': '',
      'https://example.com/favicon.ico': 'binary',
      'https://example.com/favicon.png': 'binary',
    })
    const value = await discoverFavicons('https://example.com', {
      methods: ['guess'],
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'guess' },
      { url: 'https://example.com/favicon.png', isValid: true, method: 'guess' },
    ]

    expect(value).toEqual(expected)
  })

  it('should use all default methods', async () => {
    const html = '<link rel="apple-touch-icon" href="/apple-touch-icon.png">'
    const mockFetch = createMockFetch({
      'https://example.com': html,
      'https://example.com/apple-touch-icon.png': 'binary',
      'https://example.com/favicon.ico': 'binary',
    })
    const value = await discoverFavicons('https://example.com', { fetchFn: mockFetch })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/apple-touch-icon.png', isValid: true, method: 'html' },
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'guess' },
    ]

    expect(value).toEqual(expected)
  })

  it('should deduplicate URLs across methods', async () => {
    const html = '<link rel="icon" href="/favicon.ico">'
    const mockFetch = createMockFetch({
      'https://example.com': html,
      'https://example.com/favicon.ico': 'binary',
    })
    const value = await discoverFavicons('https://example.com', {
      methods: ['html', 'guess'],
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'html' },
    ]

    expect(value).toEqual(expected)
  })

  it('should filter out invalid URLs', async () => {
    const mockFetch = createMockFetch({
      'https://example.com': '',
      'https://example.com/favicon.ico': 'binary',
    })
    const value = await discoverFavicons('https://example.com', {
      methods: { guess: { uris: ['/favicon.ico', '/nonexistent.png'] } },
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'guess' },
    ]

    expect(value).toEqual(expected)
  })

  it('should return invalid results when includeInvalid is true', async () => {
    const mockFetch = createMockFetch({
      'https://example.com': '',
      'https://example.com/favicon.ico': 'binary',
    })
    const value = await discoverFavicons('https://example.com', {
      methods: { guess: { uris: ['/favicon.ico', '/missing.png'] } },
      fetchFn: mockFetch,
      includeInvalid: true,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'guess' },
      { url: 'https://example.com/missing.png', isValid: false, method: 'guess' },
    ]

    expect(value).toEqual(expected)
  })

  it('should work with input object containing content', async () => {
    const html = '<link rel="icon" href="https://example.com/favicon.ico">'
    const mockFetch = createMockFetch({
      'https://example.com/favicon.ico': 'binary',
    })
    const value = await discoverFavicons(
      { url: 'https://example.com', content: html },
      { methods: ['html'], fetchFn: mockFetch },
    )
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'html' },
    ]

    expect(value).toEqual(expected)
  })

  it('should return empty array when no favicons found', async () => {
    const mockFetch = createMockFetch({
      'https://example.com': '<html></html>',
    })
    const value = await discoverFavicons('https://example.com', {
      methods: ['html'],
      fetchFn: mockFetch,
    })

    expect(value).toEqual([])
  })

  it('should use custom guess paths', async () => {
    const mockFetch = createMockFetch({
      'https://example.com': '',
      'https://example.com/custom-icon.png': 'binary',
    })
    const value = await discoverFavicons('https://example.com', {
      methods: { guess: { uris: ['/custom-icon.png'] } },
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/custom-icon.png', isValid: true, method: 'guess' },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover favicon from github platform handler', async () => {
    const mockFetch = createMockFetch({
      'https://github.com/octocat': '<html></html>',
      'https://github.com/octocat.png': 'binary',
    })
    const value = await discoverFavicons('https://github.com/octocat', {
      methods: ['platform'],
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://github.com/octocat.png', isValid: true, method: 'platform' },
    ]

    expect(value).toEqual(expected)
  })

  it('should return empty array for invalid URLs', async () => {
    const mockFetch = createMockFetch({})
    const value = await discoverFavicons('not-a-valid-url', {
      methods: ['html'],
      fetchFn: mockFetch,
    })

    expect(value).toEqual([])
  })
})
