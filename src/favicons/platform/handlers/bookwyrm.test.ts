import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { bookwyrmHandler } from './bookwyrm.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

const sourceLink = '<a href="https://github.com/bookwyrm-social/bookwyrm">GitHub</a>'
const profileHtml = `
  <html>
    <head>
      <meta
        name="og:image"
        content="https://books.example.com/images/previews/avatars/1-abc.jpg"
      >
    </head>
    <body>
      <img
        class="image logo"
        src="https://books.example.com/static/images/logo-small.png"
      >
      <img
        class="avatar image is-96x96"
        src="https://books.example.com/images/avatars/abc.jpeg"
        alt="avatar for reader"
      >
      <meta
        itemprop="image"
        content="/images/avatars/abc.jpeg"
      >
      ${sourceLink}
    </body>
  </html>
`
const relativeAvatarHtml = `
  <img
    class="avatar image is-96x96"
    src="/images/avatars/abc.jpeg"
  >
  ${sourceLink}
`
const defaultAvatarHtml = `
  <img
    class="avatar image is-96x96"
    src="https://books.example.com/static/images/default_avi.jpg"
  >
  ${sourceLink}
`
const shelfHtml = `
  <img
    class="book-cover"
    src="https://books.example.com/images/covers/book.jpg"
  >
  ${sourceLink}
`
const actorJsonUrl = 'https://books.example.com/user/reader.json'

describe('bookwyrmHandler', () => {
  describe('match', () => {
    it('should match a profile page', () => {
      expect(bookwyrmHandler.match('https://books.example.com/user/reader', profileHtml)).toBe(true)
    })

    it('should match a profile page with a trailing slash', () => {
      expect(bookwyrmHandler.match('https://books.example.com/user/reader/', profileHtml)).toBe(
        true,
      )
    })

    it('should match the all-books page', () => {
      expect(bookwyrmHandler.match('https://books.example.com/user/reader/books', shelfHtml)).toBe(
        true,
      )
    })

    it('should match a shelf page', () => {
      const value = 'https://books.example.com/user/reader/books/to-read'

      expect(bookwyrmHandler.match(value, shelfHtml)).toBe(true)
    })

    it('should match a shelf page under the shelf path', () => {
      const value = 'https://books.example.com/user/reader/shelf/read'

      expect(bookwyrmHandler.match(value, shelfHtml)).toBe(true)
    })

    it('should match a remote user profile', () => {
      const value = 'https://books.example.com/user/reader@remote.example.org'

      expect(bookwyrmHandler.match(value, profileHtml)).toBe(true)
    })

    it('should match with the generator meta tag', () => {
      const value = '<meta name="generator" content="BookWyrm">'

      expect(bookwyrmHandler.match('https://books.example.com/user/reader', value)).toBe(true)
    })

    it('should not match without BookWyrm markers', () => {
      const value = '<img class="avatar" src="https://example.com/avatar.jpg">'

      expect(bookwyrmHandler.match('https://example.com/user/reader', value)).toBe(false)
    })

    it('should not match without content', () => {
      expect(bookwyrmHandler.match('https://books.example.com/user/reader')).toBe(false)
    })

    it('should not match other user subpages', () => {
      const value = 'https://books.example.com/user/reader/followers'

      expect(bookwyrmHandler.match(value, profileHtml)).toBe(false)
    })

    it('should not match a shelf feed', () => {
      const value = 'https://books.example.com/user/reader/books/read/rss'

      expect(bookwyrmHandler.match(value, profileHtml)).toBe(false)
    })

    it('should not match non-user paths', () => {
      expect(bookwyrmHandler.match('https://books.example.com/book/123', profileHtml)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(bookwyrmHandler.match('not-a-url', profileHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should resolve the avatar from the profile page', async () => {
        const result = await bookwyrmHandler.resolve(
          'https://books.example.com/user/reader',
          profileHtml,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://books.example.com/images/avatars/abc.jpeg' },
        ]

        expect(result).toEqual(expected)
      })

      it('should resolve a relative avatar against the page URL', async () => {
        const result = await bookwyrmHandler.resolve(
          'https://books.example.com/user/reader',
          relativeAvatarHtml,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://books.example.com/images/avatars/abc.jpeg' },
        ]

        expect(result).toEqual(expected)
      })

      it('should resolve the avatar from the actor JSON on a shelf page', async () => {
        const mockFetch = createMockFetch({
          [actorJsonUrl]: JSON.stringify({
            type: 'Person',
            icon: {
              type: 'Image',
              url: 'https://books.example.com/images/avatars/abc.jpeg',
            },
          }),
        })
        const result = await bookwyrmHandler.resolve(
          'https://books.example.com/user/reader/books/read',
          shelfHtml,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://books.example.com/images/avatars/abc.jpeg' },
        ]

        expect(result).toEqual(expected)
      })

      it('should resolve the avatar from the actor JSON without content', async () => {
        const mockFetch = createMockFetch({
          [actorJsonUrl]: JSON.stringify({
            icon: {
              url: 'https://books.example.com/images/avatars/abc.jpeg',
            },
          }),
        })
        const result = await bookwyrmHandler.resolve(
          'https://books.example.com/user/reader',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://books.example.com/images/avatars/abc.jpeg' },
        ]

        expect(result).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for the default avatar on the page', async () => {
        const mockFetch = createMockFetch({})
        const result = await bookwyrmHandler.resolve(
          'https://books.example.com/user/reader',
          defaultAvatarHtml,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for the default avatar in the actor JSON', async () => {
        const mockFetch = createMockFetch({
          [actorJsonUrl]: JSON.stringify({
            icon: {
              url: 'https://books.example.com/static/images/default_avi.jpg',
            },
          }),
        })
        const result = await bookwyrmHandler.resolve(
          'https://books.example.com/user/reader/books/read',
          shelfHtml,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when the actor JSON has no icon', async () => {
        const mockFetch = createMockFetch({
          [actorJsonUrl]: JSON.stringify({ type: 'Person' }),
        })
        const result = await bookwyrmHandler.resolve(
          'https://books.example.com/user/reader/books/read',
          shelfHtml,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when the actor JSON is invalid', async () => {
        const mockFetch = createMockFetch({
          [actorJsonUrl]: 'not json',
        })
        const result = await bookwyrmHandler.resolve(
          'https://books.example.com/user/reader/books/read',
          shelfHtml,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when fetch throws', async () => {
        const mockFetch: DiscoverFetchFn = () => {
          throw new Error('Network error')
        }
        const result = await bookwyrmHandler.resolve(
          'https://books.example.com/user/reader/books/read',
          shelfHtml,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array without an avatar and fetchFn', async () => {
        const result = await bookwyrmHandler.resolve(
          'https://books.example.com/user/reader/books/read',
          shelfHtml,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for non-user paths', async () => {
        const result = await bookwyrmHandler.resolve(
          'https://books.example.com/book/123',
          profileHtml,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for invalid URL', async () => {
        const result = await bookwyrmHandler.resolve('not-a-url', profileHtml)

        expect(result).toEqual([])
      })
    })
  })
})
