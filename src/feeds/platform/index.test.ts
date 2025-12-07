import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn } from '../../common/types.js'
import { discoverPlatformUris } from './index.js'
import type { PlatformHandler } from './types.js'

const createMockFetch = (body = ''): DiscoverFetchFn => {
  return async () => ({ body, headers: new Headers(), url: '', status: 200, statusText: 'OK' })
}

describe('discoverPlatformUris', () => {
  it('should return URIs from matching handler', async () => {
    const handler: PlatformHandler = {
      match: (url) => new URL(url).hostname === 'example.com',
      resolve: async () => ['https://example.com/feed.xml'],
    }
    const value = await discoverPlatformUris(
      'https://example.com/page',
      { handlers: [handler] },
      createMockFetch(),
    )

    expect(value).toEqual(['https://example.com/feed.xml'])
  })

  it('should return empty array when no handler matches', async () => {
    const handler: PlatformHandler = {
      match: () => false,
      resolve: async () => ['https://example.com/feed.xml'],
    }
    const value = await discoverPlatformUris(
      'https://other.com/page',
      { handlers: [handler] },
      createMockFetch(),
    )

    expect(value).toEqual([])
  })

  it('should only use first matching handler', async () => {
    const handler1: PlatformHandler = {
      match: () => true,
      resolve: async () => ['https://example.com/feed1.xml'],
    }
    const handler2: PlatformHandler = {
      match: () => true,
      resolve: async () => ['https://example.com/feed2.xml'],
    }
    const value = await discoverPlatformUris(
      'https://example.com/page',
      { handlers: [handler1, handler2] },
      createMockFetch(),
    )

    expect(value).toEqual(['https://example.com/feed1.xml'])
  })

  it('should pass fetchFn to handler resolve', async () => {
    let receivedFetchFn: DiscoverFetchFn | undefined
    const handler: PlatformHandler = {
      match: () => true,
      resolve: async (_url, fetchFn) => {
        receivedFetchFn = fetchFn

        return []
      },
    }
    const mockFetch = createMockFetch()

    await discoverPlatformUris('https://example.com/page', { handlers: [handler] }, mockFetch)

    expect(receivedFetchFn).toBe(mockFetch)
  })

  it('should return multiple URIs from handler', async () => {
    const handler: PlatformHandler = {
      match: () => true,
      resolve: async () => [
        'https://example.com/feed1.xml',
        'https://example.com/feed2.xml',
        'https://example.com/feed3.xml',
      ],
    }
    const value = await discoverPlatformUris(
      'https://example.com/page',
      { handlers: [handler] },
      createMockFetch(),
    )

    expect(value).toEqual([
      'https://example.com/feed1.xml',
      'https://example.com/feed2.xml',
      'https://example.com/feed3.xml',
    ])
  })
})
