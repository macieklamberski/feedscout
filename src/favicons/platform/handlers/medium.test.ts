import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { mediumHandler } from './medium.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
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
    describe('happy paths', () => {
      it('should return profile avatar from the user feed', async () => {
        const mockFetch = createMockFetch({
          'https://medium.com/feed/@alice': createFeed(
            'https://cdn-images-1.medium.com/fit/c/150/150/1*abc123.jpeg',
          ),
        })
        const result = await mediumHandler.resolve(
          'https://medium.com/@alice',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://cdn-images-1.medium.com/fit/c/150/150/1*abc123.jpeg' },
        ]

        expect(result).toEqual(expected)
      })

      it('should return publication icon from the publication feed', async () => {
        const mockFetch = createMockFetch({
          'https://medium.com/feed/the-startup': createFeed(
            'https://cdn-images-1.medium.com/fit/c/150/150/0*def456.jpeg',
          ),
        })
        const result = await mediumHandler.resolve(
          'https://medium.com/the-startup',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://cdn-images-1.medium.com/fit/c/150/150/0*def456.jpeg' },
        ]

        expect(result).toEqual(expected)
      })

      it('should return profile avatar from an article URL', async () => {
        const mockFetch = createMockFetch({
          'https://medium.com/feed/@alice': createFeed(
            'https://cdn-images-1.medium.com/fit/c/150/150/1*abc123.jpeg',
          ),
        })
        const result = await mediumHandler.resolve(
          'https://medium.com/@alice/hello-world-1a2b3c',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://cdn-images-1.medium.com/fit/c/150/150/1*abc123.jpeg' },
        ]

        expect(result).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for the generic wordmark', async () => {
        const mockFetch = createMockFetch({
          'https://medium.com/feed/design-bootcamp': createFeed(
            'https://cdn-images-1.medium.com/proxy/1*TGH72Nnw24QL3iV9IOm4VA.png',
          ),
        })
        const result = await mediumHandler.resolve(
          'https://medium.com/design-bootcamp',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for the generic wordmark in a square crop', async () => {
        const mockFetch = createMockFetch({
          'https://medium.com/feed/design-bootcamp': createFeed(
            'https://cdn-images-1.medium.com/fit/c/150/150/1*TGH72Nnw24QL3iV9IOm4VA.png',
          ),
        })
        const result = await mediumHandler.resolve(
          'https://medium.com/design-bootcamp',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for a non-square image', async () => {
        const mockFetch = createMockFetch({
          'https://medium.com/feed/the-startup': createFeed(
            'https://cdn-images-1.medium.com/fit/c/300/100/0*def456.jpeg',
          ),
        })
        const result = await mediumHandler.resolve(
          'https://medium.com/the-startup',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when the feed has no image', async () => {
        const mockFetch = createMockFetch({
          'https://medium.com/feed/@alice': createFeed(),
        })
        const result = await mediumHandler.resolve(
          'https://medium.com/@alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when the feed is invalid', async () => {
        const mockFetch = createMockFetch({
          'https://medium.com/feed/@alice': '<html><body>Not Found</body></html>',
        })
        const result = await mediumHandler.resolve(
          'https://medium.com/@alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when fetch throws', async () => {
        const mockFetch: DiscoverFetchFn = () => {
          throw new Error('Network error')
        }
        const result = await mediumHandler.resolve(
          'https://medium.com/@alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when fetchFn is not provided', async () => {
        const result = await mediumHandler.resolve('https://medium.com/@alice')

        expect(result).toEqual([])
      })

      it('should return empty array for tag pages', async () => {
        const mockFetch = createMockFetch({})
        const result = await mediumHandler.resolve(
          'https://medium.com/tag/javascript',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for custom domains', async () => {
        const mockFetch = createMockFetch({})
        const result = await mediumHandler.resolve(
          'https://example.com/@alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for invalid URL', async () => {
        const mockFetch = createMockFetch({})
        const result = await mediumHandler.resolve('not-a-url', undefined, undefined, mockFetch)

        expect(result).toEqual([])
      })
    })
  })
})
