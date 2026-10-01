import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn, FetchFnOptions } from '../../common/types.js'
import type { FeedEnricherContext } from '../types.js'
import {
  parseSimplecastUrl,
  type SimplecastUrl,
  simplecastEnricher,
  simplecastHandler,
} from './simplecast.js'

type Request = {
  url: string
  options?: FetchFnOptions
}

const searchUrl = 'https://api.simplecast.com/sites/search'
const podcastUrl = 'https://api.simplecast.com/podcasts/4e94872a-377f-464b-8974-b822f6c22343'

const aliceRef: DiscoverRef = {
  platform: 'simplecast',
  id: 'alice',
  url: 'https://alice.simplecast.com/episodes/pilot',
  hint: { key: 'simplecast:podcast', label: 'Podcast' },
}

const createContext = (
  responses: Record<string, { status?: number; body: string }>,
  requests: Array<Request> = [],
): FeedEnricherContext => {
  const fetchFn: FetchFn = (url, options) => {
    requests.push({ url, options })
    const response = responses[url]

    return {
      headers: new Headers(),
      body: response?.body ?? '',
      url,
      status: response ? (response.status ?? 200) : 404,
    }
  }

  return { fetchFn }
}

const searchBody = JSON.stringify({
  podcast: { id: '4e94872a-377f-464b-8974-b822f6c22343' },
})
const podcastBody = JSON.stringify({ feed_url: 'https://feeds.simplecast.com/KqgBcmTA' })

describe('parseSimplecastUrl', () => {
  it('should return the show for a show page', () => {
    const expected: SimplecastUrl = { kind: 'show', slug: 'alice' }

    expect(parseSimplecastUrl('https://alice.simplecast.com')).toEqual(expected)
  })

  it('should return the show for an episode page', () => {
    const expected: SimplecastUrl = { kind: 'show', slug: 'alice' }

    expect(parseSimplecastUrl('https://alice.simplecast.com/episodes/pilot')).toEqual(expected)
  })

  const rejectedValues: Array<string> = [
    'https://simplecast.com',
    'https://www.simplecast.com',
    'https://api.simplecast.com',
    'https://feeds.simplecast.com/KqgBcmTA',
    'https://player.simplecast.com/abc',
    'https://example.com',
  ]

  it.each(rejectedValues)('should return undefined for %s', (url) => {
    expect(parseSimplecastUrl(url)).toBeUndefined()
  })
})

describe('simplecastHandler', () => {
  describe('match', () => {
    it('should match a show page', () => {
      expect(simplecastHandler.match('https://alice.simplecast.com')).toBe(true)
    })

    it('should not match a Simplecast service host', () => {
      expect(simplecastHandler.match('https://api.simplecast.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return a ref for a show page', () => {
      expect(simplecastHandler.resolve('https://alice.simplecast.com/episodes/pilot')).toEqual([
        aliceRef,
      ])
    })

    it('should return empty array for the bare host', () => {
      expect(simplecastHandler.resolve('https://simplecast.com/')).toEqual([])
    })
  })
})

describe('simplecastEnricher', () => {
  describe('happy paths', () => {
    it('should return the feed URL of the podcast the page belongs to', async () => {
      const context = createContext({
        [searchUrl]: { body: searchBody },
        [podcastUrl]: { body: podcastBody },
      })

      expect(await simplecastEnricher(aliceRef, context)).toEqual([
        'https://feeds.simplecast.com/KqgBcmTA',
      ])
    })

    it('should post the page URL to the site search and read the podcast', async () => {
      const requests: Array<Request> = []
      const context = createContext(
        {
          [searchUrl]: { body: searchBody },
          [podcastUrl]: { body: podcastBody },
        },
        requests,
      )
      const expected: Array<Request> = [
        {
          url: searchUrl,
          options: {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{"url":"https://alice.simplecast.com/episodes/pilot"}',
          },
        },
        { url: podcastUrl, options: undefined },
      ]

      await simplecastEnricher(aliceRef, context)

      expect(requests).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a ref of another platform', async () => {
      const ref: DiscoverRef = { platform: 'devto', id: 'alice', url: 'https://dev.to/alice' }

      expect(await simplecastEnricher(ref, createContext({}))).toBeUndefined()
    })

    it('should reject when the site search does not know the page', async () => {
      const throwing = () => simplecastEnricher(aliceRef, createContext({}))
      const expected = `Unexpected status 404 from ${searchUrl}`

      await expect(throwing()).rejects.toThrow(expected)
    })

    it('should reject without reading the podcast when the site search fails', async () => {
      const requests: Array<Request> = []
      const context = createContext({ [searchUrl]: { status: 500, body: '' } }, requests)
      const throwing = () => simplecastEnricher(aliceRef, context)

      await expect(throwing()).rejects.toThrow(`Unexpected status 500 from ${searchUrl}`)
      expect(requests.map((request) => request.url)).toEqual([searchUrl])
    })

    it('should reject when the podcast request fails', async () => {
      const context = createContext({
        [searchUrl]: { body: searchBody },
        [podcastUrl]: { status: 500, body: '' },
      })
      const throwing = () => simplecastEnricher(aliceRef, context)

      await expect(throwing()).rejects.toThrow(`Unexpected status 500 from ${podcastUrl}`)
    })

    it('should reject when the site search returns invalid JSON', async () => {
      const context = createContext({ [searchUrl]: { body: 'not-json' } })
      const throwing = () => simplecastEnricher(aliceRef, context)

      await expect(throwing()).rejects.toThrow('JSON Parse error: Unexpected identifier "not"')
    })
  })

  describe('edge cases', () => {
    it('should return empty array without reading the podcast when the search has no id', async () => {
      const requests: Array<Request> = []
      const context = createContext({ [searchUrl]: { body: JSON.stringify({}) } }, requests)

      expect(await simplecastEnricher(aliceRef, context)).toEqual([])
      expect(requests.map((request) => request.url)).toEqual([searchUrl])
    })

    it('should return empty array when the podcast has no feed URL', async () => {
      const context = createContext({
        [searchUrl]: { body: searchBody },
        [podcastUrl]: { body: JSON.stringify({ feed_url: '' }) },
      })

      expect(await simplecastEnricher(aliceRef, context)).toEqual([])
    })
  })
})
