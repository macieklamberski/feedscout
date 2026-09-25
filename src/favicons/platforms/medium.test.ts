import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { mediumEnricher, mediumHandler } from './medium.js'

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const createRef = (url: string, id: string): DiscoverRef => {
  return { platform: 'medium', id, url }
}

const createFeed = (imageUrl?: string): string => {
  const image = imageUrl
    ? `<image><url>${imageUrl}</url><title>Stories on Medium</title></image>`
    : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>Stories on Medium</title>
        <link>https://medium.com/@alice</link>
        ${image}
        <generator>Medium</generator>
      </channel>
    </rss>
  `
}

describe('mediumHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(mediumHandler.match('https://medium.com/@alice')).toBe(true)
    })

    it('should match profile article URLs', () => {
      expect(mediumHandler.match('https://medium.com/@alice/hello-world-1a2b3c')).toBe(true)
    })

    it('should match publication URLs', () => {
      expect(mediumHandler.match('https://medium.com/the-startup')).toBe(true)
    })

    it('should match www.medium.com URLs', () => {
      expect(mediumHandler.match('https://www.medium.com/@alice')).toBe(true)
    })

    it('should not match tag pages', () => {
      expect(mediumHandler.match('https://medium.com/tag/javascript')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(mediumHandler.match('https://medium.com/search')).toBe(false)
      expect(mediumHandler.match('https://medium.com/me')).toBe(false)
    })

    it('should not match feed URLs', () => {
      expect(mediumHandler.match('https://medium.com/feed/the-startup')).toBe(false)
    })

    it('should not match medium.com root URL', () => {
      expect(mediumHandler.match('https://medium.com')).toBe(false)
      expect(mediumHandler.match('https://medium.com/')).toBe(false)
    })

    it('should not match medium.com subdomains', () => {
      expect(mediumHandler.match('https://alice.medium.com')).toBe(false)
    })

    it('should not match custom domains', () => {
      expect(mediumHandler.match('https://example.com/@alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(mediumHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return a ref for a profile', async () => {
      const url = 'https://medium.com/@alice'
      const expected: Array<DiscoverRef> = [{ platform: 'medium', id: '@alice', url }]

      expect(await mediumHandler.resolve(url)).toEqual(expected)
    })

    it('should return a profile ref for a profile article', async () => {
      const url = 'https://medium.com/@alice/hello-world-1a2b3c'
      const expected: Array<DiscoverRef> = [{ platform: 'medium', id: '@alice', url }]

      expect(await mediumHandler.resolve(url)).toEqual(expected)
    })

    it('should return a ref for a publication', async () => {
      const url = 'https://medium.com/the-startup'
      const expected: Array<DiscoverRef> = [{ platform: 'medium', id: 'the-startup', url }]

      expect(await mediumHandler.resolve(url)).toEqual(expected)
    })

    it('should return empty array for tag pages', async () => {
      expect(await mediumHandler.resolve('https://medium.com/tag/javascript')).toEqual([])
    })

    it('should return empty array for custom domains', async () => {
      expect(await mediumHandler.resolve('https://example.com/@alice')).toEqual([])
    })
  })
})

describe('mediumEnricher', () => {
  it('should return profile avatar from the user feed', async () => {
    const context = createContext({
      'https://medium.com/feed/@alice': createFeed(
        'https://cdn-images-1.medium.com/fit/c/150/150/1*abc123.jpeg',
      ),
    })
    const ref = createRef('https://medium.com/@alice', '@alice')
    const expected = ['https://cdn-images-1.medium.com/fit/c/150/150/1*abc123.jpeg']

    expect(await mediumEnricher(ref, context)).toEqual(expected)
  })

  it('should return publication icon from the publication feed', async () => {
    const context = createContext({
      'https://medium.com/feed/the-startup': createFeed(
        'https://cdn-images-1.medium.com/fit/c/150/150/0*def456.jpeg',
      ),
    })
    const ref = createRef('https://medium.com/the-startup', 'the-startup')
    const expected = ['https://cdn-images-1.medium.com/fit/c/150/150/0*def456.jpeg']

    expect(await mediumEnricher(ref, context)).toEqual(expected)
  })

  it('should return undefined for a ref of another platform', async () => {
    const ref: DiscoverRef = {
      platform: 'bluesky',
      id: 'alice',
      url: 'https://bsky.app/profile/alice',
    }

    expect(await mediumEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array for the generic wordmark', async () => {
    const context = createContext({
      'https://medium.com/feed/design-bootcamp': createFeed(
        'https://cdn-images-1.medium.com/proxy/1*TGH72Nnw24QL3iV9IOm4VA.png',
      ),
    })
    const ref = createRef('https://medium.com/design-bootcamp', 'design-bootcamp')

    expect(await mediumEnricher(ref, context)).toEqual([])
  })

  it('should return empty array for the generic wordmark in a square crop', async () => {
    const context = createContext({
      'https://medium.com/feed/design-bootcamp': createFeed(
        'https://cdn-images-1.medium.com/fit/c/150/150/1*TGH72Nnw24QL3iV9IOm4VA.png',
      ),
    })
    const ref = createRef('https://medium.com/design-bootcamp', 'design-bootcamp')

    expect(await mediumEnricher(ref, context)).toEqual([])
  })

  it('should return empty array for a non-square image', async () => {
    const context = createContext({
      'https://medium.com/feed/the-startup': createFeed(
        'https://cdn-images-1.medium.com/fit/c/300/100/0*def456.jpeg',
      ),
    })
    const ref = createRef('https://medium.com/the-startup', 'the-startup')

    expect(await mediumEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when the feed has no image', async () => {
    const context = createContext({
      'https://medium.com/feed/@alice': createFeed(),
    })
    const ref = createRef('https://medium.com/@alice', '@alice')

    expect(await mediumEnricher(ref, context)).toEqual([])
  })

  it('should reject when the feed is invalid', async () => {
    const context = createContext({
      'https://medium.com/feed/@alice': '<html><body>Not Found</body></html>',
    })
    const ref = createRef('https://medium.com/@alice', '@alice')

    await expect(mediumEnricher(ref, context)).rejects.toThrow()
  })

  it('should reject when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const ref = createRef('https://medium.com/@alice', '@alice')

    await expect(mediumEnricher(ref, { fetchFn })).rejects.toThrow()
  })

  it('should reject when the response is not 2xx', async () => {
    const ref = createRef('https://medium.com/@alice', '@alice')

    await expect(mediumEnricher(ref, createContext({}))).rejects.toThrow()
  })
})
