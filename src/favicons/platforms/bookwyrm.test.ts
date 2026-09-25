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
  describe('resolve', () => {
    describe('happy paths', () => {
      it('should resolve the avatar from the profile page', () => {
        const result = bookwyrmHandler.resolve('https://books.example.com/user/reader', profileHtml)
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://books.example.com/images/avatars/abc.jpeg' },
        ]

        expect(result).toEqual(expected)
      })

      it('should skip an image whose class only starts with avatar', () => {
        const content = `
          <img
            class="avatar-placeholder"
            src="https://books.example.com/static/images/placeholder.png"
          >
          <img
            class="avatar image is-96x96"
            src="https://books.example.com/images/avatars/abc.jpeg"
          >
          ${sourceLink}
        `
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://books.example.com/images/avatars/abc.jpeg' },
        ]

        expect(bookwyrmHandler.resolve('https://books.example.com/user/reader', content)).toEqual(
          expected,
        )
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

      it('should return a ref for another user subpage', () => {
        const value = 'https://books.example.com/user/reader/reviews'
        const expected: Array<DiscoverRef> = [{ platform: 'bookwyrm', id: 'reader', url: value }]

        expect(bookwyrmHandler.resolve(value, profileHtml)).toEqual(expected)
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

      it('should return empty array for a page outside a user', () => {
        expect(bookwyrmHandler.resolve('https://books.example.com/about', profileHtml)).toEqual([])
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

  it('should reject when the actor JSON is invalid', () => {
    const context = createContext({
      [actorJsonUrl]: 'not json',
    })
    const throwing = () => bookwyrmEnricher(createRef(shelfUrl, 'reader'), context)

    expect(throwing()).rejects.toThrow('JSON Parse error: Unexpected identifier "not"')
  })

  it('should reject when fetch throws', () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const throwing = () => bookwyrmEnricher(createRef(shelfUrl, 'reader'), { fetchFn })

    expect(throwing()).rejects.toThrow('Network error')
  })

  it('should reject when the response is not 2xx', () => {
    const throwing = () => bookwyrmEnricher(createRef(shelfUrl, 'reader'), createContext({}))
    const expected = 'Unexpected status 404 from https://books.example.com/user/reader.json'

    expect(throwing()).rejects.toThrow(expected)
  })
})
