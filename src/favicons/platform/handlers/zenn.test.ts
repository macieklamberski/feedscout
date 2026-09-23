import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { zennHandler } from './zenn.js'

const createPage = (image: string): string => {
  return `<html><head><meta property="og:image" content="${image}" data-next-head=""/></head></html>`
}

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

describe('zennHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(zennHandler.match('https://zenn.dev/alice')).toBe(true)
    })

    it('should match profile URLs with trailing slash', () => {
      expect(zennHandler.match('https://zenn.dev/alice/')).toBe(true)
    })

    it('should match www.zenn.dev profile URLs', () => {
      expect(zennHandler.match('https://www.zenn.dev/alice')).toBe(true)
    })

    it('should match publication URLs', () => {
      expect(zennHandler.match('https://zenn.dev/p/acme')).toBe(true)
    })

    it('should match long publication URLs', () => {
      expect(zennHandler.match('https://zenn.dev/publications/acme')).toBe(true)
    })

    it('should match topic URLs', () => {
      expect(zennHandler.match('https://zenn.dev/topics/rust')).toBe(true)
    })

    it('should not match article URLs', () => {
      expect(zennHandler.match('https://zenn.dev/alice/articles/intro-to-rust')).toBe(false)
    })

    it('should not match topic feed URLs', () => {
      expect(zennHandler.match('https://zenn.dev/topics/rust/feed')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(zennHandler.match('https://zenn.dev/search')).toBe(false)
      expect(zennHandler.match('https://zenn.dev/topics')).toBe(false)
    })

    it('should not match root URL', () => {
      expect(zennHandler.match('https://zenn.dev/')).toBe(false)
    })

    it('should not match non-Zenn URLs', () => {
      expect(zennHandler.match('https://example.com/alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(zennHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return avatar from profile page', async () => {
        const content = createPage('https://static.zenn.studio/user-upload/avatar/9965dabc76.jpeg')
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://static.zenn.studio/user-upload/avatar/9965dabc76.jpeg' },
        ]

        expect(await zennHandler.resolve('https://zenn.dev/alice', content)).toEqual(expected)
      })

      it('should return avatar from publication page', async () => {
        const content = createPage('https://static.zenn.studio/user-upload/avatar/6399678e6b.jpeg')
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://static.zenn.studio/user-upload/avatar/6399678e6b.jpeg' },
        ]

        expect(await zennHandler.resolve('https://zenn.dev/p/acme', content)).toEqual(expected)
      })

      it('should return image from topic page', async () => {
        const content = createPage('https://static.zenn.studio/user-upload/topics/ba09661577.png')
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://static.zenn.studio/user-upload/topics/ba09661577.png' },
        ]

        expect(await zennHandler.resolve('https://zenn.dev/topics/rust', content)).toEqual(expected)
      })

      it('should fetch the page when content is not provided', async () => {
        const mockFetch = createMockFetch({
          'https://zenn.dev/alice': createPage(
            'https://static.zenn.studio/user-upload/avatar/9965dabc76.jpeg',
          ),
        })
        const result = await zennHandler.resolve(
          'https://zenn.dev/alice',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://static.zenn.studio/user-upload/avatar/9965dabc76.jpeg' },
        ]

        expect(result).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for the logo served by a missing publication', async () => {
        const content = createPage('https://static.zenn.studio/images/logo-only-dark.png')

        expect(await zennHandler.resolve('https://zenn.dev/p/acme', content)).toEqual([])
      })

      it('should return empty array for the placeholder of a topic without image', async () => {
        const content = createPage('https://zenn.dev/images/topic.png')

        expect(await zennHandler.resolve('https://zenn.dev/topics/rust', content)).toEqual([])
      })

      it('should return empty array when og:image is missing', async () => {
        const content = '<html><head><title>alice | Zenn</title></head></html>'

        expect(await zennHandler.resolve('https://zenn.dev/alice', content)).toEqual([])
      })

      it('should return empty array when og:image is empty', async () => {
        const content = createPage('')

        expect(await zennHandler.resolve('https://zenn.dev/alice', content)).toEqual([])
      })

      it('should return empty array when og:image is not a URL', async () => {
        const content = createPage('avatar.jpeg')

        expect(await zennHandler.resolve('https://zenn.dev/alice', content)).toEqual([])
      })

      it('should return empty array when neither content nor fetchFn is provided', async () => {
        expect(await zennHandler.resolve('https://zenn.dev/alice')).toEqual([])
      })

      it('should return empty array when fetch throws', async () => {
        const mockFetch: DiscoverFetchFn = () => {
          throw new Error('Network error')
        }
        const result = await zennHandler.resolve(
          'https://zenn.dev/alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })
    })
  })
})
