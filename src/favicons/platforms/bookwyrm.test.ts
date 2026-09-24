import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, DiscoverUriEntry, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { bookwyrmEnricher, bookwyrmHandler } from './bookwyrm.js'

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
  return { platform: 'bookwyrm', id, url }
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
const noAvatarHtml = `
  <img
    class="book-cover"
    src="https://books.example.com/images/covers/book.jpg"
  >
  ${sourceLink}
`
const invalidAvatarHtml = `
  <img
    class="avatar image is-96x96"
    src="http://[invalid"
  >
  ${sourceLink}
`

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

    it('should match the all-books page', () => {
      const value = 'https://books.example.com/user/reader/books'

      expect(bookwyrmHandler.match(value, noAvatarHtml)).toBe(true)
    })

    it('should match a shelf page', () => {
      const value = 'https://books.example.com/user/reader/books/to-read'

      expect(bookwyrmHandler.match(value, noAvatarHtml)).toBe(true)
    })

    it('should match a shelf page under the shelf path', () => {
      const value = 'https://books.example.com/user/reader/shelf/read'

      expect(bookwyrmHandler.match(value, noAvatarHtml)).toBe(true)
    })

    it('should not match other user subpages', () => {
      const value = 'https://books.example.com/user/reader/followers'

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
      it('should resolve the avatar from the profile page', () => {
        const result = bookwyrmHandler.resolve('https://books.example.com/user/reader', profileHtml)
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://books.example.com/images/avatars/abc.jpeg' },
        ]

        expect(result).toEqual(expected)
      })

      it('should resolve a relative avatar against the page URL', () => {
        const result = bookwyrmHandler.resolve(
          'https://books.example.com/user/reader',
          relativeAvatarHtml,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://books.example.com/images/avatars/abc.jpeg' },
        ]

        expect(result).toEqual(expected)
      })

      it('should return a ref for a shelf page', () => {
        const value = 'https://books.example.com/user/reader/books/read'
        const expected: Array<DiscoverRef> = [{ platform: 'bookwyrm', id: 'reader', url: value }]

        expect(bookwyrmHandler.resolve(value, noAvatarHtml)).toEqual(expected)
      })

      it('should return a ref for the all-books page', () => {
        const value = 'https://books.example.com/user/reader/books'
        const expected: Array<DiscoverRef> = [{ platform: 'bookwyrm', id: 'reader', url: value }]

        expect(bookwyrmHandler.resolve(value, noAvatarHtml)).toEqual(expected)
      })

      it('should return a ref for a remote user shelf page', () => {
        const value = 'https://books.example.com/user/reader@remote.example.org/shelf/read'
        const expected: Array<DiscoverRef> = [
          { platform: 'bookwyrm', id: 'reader@remote.example.org', url: value },
        ]

        expect(bookwyrmHandler.resolve(value, noAvatarHtml)).toEqual(expected)
      })

      it('should return a ref for a profile page without an avatar', () => {
        const value = 'https://books.example.com/user/reader'
        const expected: Array<DiscoverRef> = [{ platform: 'bookwyrm', id: 'reader', url: value }]

        expect(bookwyrmHandler.resolve(value, noAvatarHtml)).toEqual(expected)
      })

      it('should return a ref for a profile page without content', () => {
        const value = 'https://books.example.com/user/reader'
        const expected: Array<DiscoverRef> = [{ platform: 'bookwyrm', id: 'reader', url: value }]

        expect(bookwyrmHandler.resolve(value)).toEqual(expected)
      })

      it('should return a ref instead of reading an avatar on a shelf page', () => {
        const value = 'https://books.example.com/user/reader/books/read'
        const expected: Array<DiscoverRef> = [{ platform: 'bookwyrm', id: 'reader', url: value }]

        expect(bookwyrmHandler.resolve(value, profileHtml)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for the default avatar', () => {
        const result = bookwyrmHandler.resolve(
          'https://books.example.com/user/reader',
          defaultAvatarHtml,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for an invalid avatar URL', () => {
        const result = bookwyrmHandler.resolve(
          'https://books.example.com/user/reader',
          invalidAvatarHtml,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for other user subpages', () => {
        const result = bookwyrmHandler.resolve(
          'https://books.example.com/user/reader/followers',
          profileHtml,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for invalid URL', () => {
        const result = bookwyrmHandler.resolve('not-a-url', profileHtml)

        expect(result).toEqual([])
      })
    })
  })
})

describe('bookwyrmEnricher', () => {
  const actorJsonUrl = 'https://books.example.com/user/reader.json'
  const shelfUrl = 'https://books.example.com/user/reader/books/read'

  it('should resolve the avatar from the actor JSON', async () => {
    const context = createContext({
      [actorJsonUrl]: JSON.stringify({
        type: 'Person',
        icon: {
          type: 'Image',
          url: 'https://books.example.com/images/avatars/abc.jpeg',
        },
      }),
    })
    const expected = ['https://books.example.com/images/avatars/abc.jpeg']

    expect(await bookwyrmEnricher(createRef(shelfUrl, 'reader'), context)).toEqual(expected)
  })

  it('should resolve the avatar of a remote user', async () => {
    const context = createContext({
      'https://books.example.com/user/reader@remote.example.org.json': JSON.stringify({
        icon: {
          url: 'https://remote.example.org/images/avatars/abc.jpeg',
        },
      }),
    })
    const ref = createRef(
      'https://books.example.com/user/reader@remote.example.org',
      'reader@remote.example.org',
    )
    const expected = ['https://remote.example.org/images/avatars/abc.jpeg']

    expect(await bookwyrmEnricher(ref, context)).toEqual(expected)
  })

  it('should return undefined for a ref of another platform', async () => {
    const ref: DiscoverRef = {
      platform: 'mastodon',
      id: 'reader',
      url: 'https://example.com/@reader',
    }

    expect(await bookwyrmEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array for the default avatar', async () => {
    const context = createContext({
      [actorJsonUrl]: JSON.stringify({
        icon: {
          url: 'https://books.example.com/static/images/default_avi.jpg',
        },
      }),
    })

    expect(await bookwyrmEnricher(createRef(shelfUrl, 'reader'), context)).toEqual([])
  })

  it('should return empty array when the actor JSON has no icon', async () => {
    const context = createContext({
      [actorJsonUrl]: JSON.stringify({ type: 'Person' }),
    })

    expect(await bookwyrmEnricher(createRef(shelfUrl, 'reader'), context)).toEqual([])
  })

  it('should return empty array when the actor JSON is invalid', async () => {
    const context = createContext({
      [actorJsonUrl]: 'not json',
    })

    expect(await bookwyrmEnricher(createRef(shelfUrl, 'reader'), context)).toEqual([])
  })

  it('should return empty array when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }

    expect(await bookwyrmEnricher(createRef(shelfUrl, 'reader'), { fetchFn })).toEqual([])
  })
})
