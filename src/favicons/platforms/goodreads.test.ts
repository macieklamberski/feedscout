import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import {
  type GoodreadsUrl,
  goodreadsEnricher,
  goodreadsHandler,
  parseGoodreadsUrl,
} from './goodreads.js'

describe('parseGoodreadsUrl', () => {
  it('should return the user for a user page with a slug', () => {
    const value = 'https://www.goodreads.com/user/show/1-alice-smith'
    const expected: GoodreadsUrl = { kind: 'user', userId: '1' }

    expect(parseGoodreadsUrl(value)).toEqual(expected)
  })

  it('should return the user for a user page with a slug with a capitalized user segment', () => {
    const value = 'https://www.goodreads.com/User/show/1-alice-smith'
    const expected: GoodreadsUrl = { kind: 'user', userId: '1' }

    expect(parseGoodreadsUrl(value)).toEqual(expected)
  })

  it('should return the user for a user page with a slug with a capitalized show segment', () => {
    const value = 'https://www.goodreads.com/user/Show/1-alice-smith'
    const expected: GoodreadsUrl = { kind: 'user', userId: '1' }

    expect(parseGoodreadsUrl(value)).toEqual(expected)
  })

  it('should return the user for a user page with a numeric id only', () => {
    const expected: GoodreadsUrl = { kind: 'user', userId: '4082853' }

    expect(parseGoodreadsUrl('https://www.goodreads.com/user/show/4082853')).toEqual(expected)
  })

  it('should return the user on the bare host', () => {
    const expected: GoodreadsUrl = { kind: 'user', userId: '1' }

    expect(parseGoodreadsUrl('https://goodreads.com/user/show/1')).toEqual(expected)
  })

  it('should return the reviews for a review list page with a slug', () => {
    const value = 'https://www.goodreads.com/review/list/1-alice-smith'
    const expected: GoodreadsUrl = { kind: 'reviews', userId: '1' }

    expect(parseGoodreadsUrl(value)).toEqual(expected)
  })

  it('should return the reviews for a review list page with a capitalized review segment', () => {
    const value = 'https://www.goodreads.com/Review/list/1-alice-smith'
    const expected: GoodreadsUrl = { kind: 'reviews', userId: '1' }

    expect(parseGoodreadsUrl(value)).toEqual(expected)
  })

  it('should return the reviews for a review list page with a capitalized list segment', () => {
    const value = 'https://www.goodreads.com/review/List/1-alice-smith'
    const expected: GoodreadsUrl = { kind: 'reviews', userId: '1' }

    expect(parseGoodreadsUrl(value)).toEqual(expected)
  })

  it('should return the reviews for a review list page with a numeric id only', () => {
    const expected: GoodreadsUrl = { kind: 'reviews', userId: '4082853' }

    expect(parseGoodreadsUrl('https://www.goodreads.com/review/list/4082853')).toEqual(expected)
  })

  it('should return the shelf of a review list page', () => {
    const value = 'https://www.goodreads.com/review/list/1-alice?shelf=read'
    const expected: GoodreadsUrl = { kind: 'reviews', userId: '1', shelf: 'read' }

    expect(parseGoodreadsUrl(value)).toEqual(expected)
  })

  it('should return undefined for a user page with a non-numeric id', () => {
    expect(parseGoodreadsUrl('https://www.goodreads.com/user/show/abc-alice')).toBeUndefined()
  })

  it('should return undefined for a review list page with a non-numeric id', () => {
    expect(parseGoodreadsUrl('https://www.goodreads.com/review/list/abc-alice')).toBeUndefined()
  })

  const otherPageValues: Array<string> = [
    'https://www.goodreads.com/book/show/5907.The_Hobbit',
    'https://www.goodreads.com/author/show/3354.Haruki_Murakami',
    'https://www.goodreads.com/genres/fiction',
    'https://www.goodreads.com/list/show/1.Best_Books_Ever',
    'https://www.goodreads.com/choiceawards',
  ]

  it.each(otherPageValues)('should return undefined for %s', (value) => {
    expect(parseGoodreadsUrl(value)).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseGoodreadsUrl('https://www.goodreads.com')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseGoodreadsUrl('https://example.com/user/show/1')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseGoodreadsUrl('not-a-url')).toBeUndefined()
  })
})

const avatarUrl = 'https://images.gr-assets.com/users/1506617226p8/1.jpg'

const userPage = `
  <meta
    property="og:image"
    content="https://images.gr-assets.com/users/1506617226p5/1.jpg"
  />
  <img
    alt="Alice Smith"
    class="profilePictureIcon circularIcon circularIcon--huge"
    src="https://images.gr-assets.com/users/1506617226p6/1.jpg"
  />
`

const userPageWithoutPhoto = `
  <meta
    property="og:image"
    content="https://s.gr-assets.com/assets/nophoto/user/u_200x266-e183445fd1a1b5cc7075bb1cf7043306.png"
  />
  <img
    alt="Carol Smith"
    class="profilePictureIcon circularIcon circularIcon--huge"
    src="https://s.gr-assets.com/assets/nophoto/user/u_225x300-c928cbb998d4ac6dd1f0f66f31f74b81.png"
  />
`

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const createRef = (id: string): DiscoverRef => {
  return { platform: 'goodreads', id, url: `https://www.goodreads.com/user/show/${id}` }
}

describe('goodreadsHandler', () => {
  describe('match', () => {
    it('should match a user page with a slug', () => {
      const value = 'https://www.goodreads.com/user/show/1-alice-smith'

      expect(goodreadsHandler.match(value)).toBe(true)
    })

    it('should not match a review list page', () => {
      expect(goodreadsHandler.match('https://www.goodreads.com/review/list/1')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return the largest variant of the avatar', () => {
        const value = 'https://www.goodreads.com/user/show/1-alice-smith'
        const expected = [{ uri: avatarUrl }]

        expect(goodreadsHandler.resolve(value, userPage)).toEqual(expected)
      })

      it('should return the avatar from unquoted attributes', () => {
        const value = 'https://www.goodreads.com/user/show/1-alice-smith'
        const content = `
          <img
            class=profilePictureIcon
            src=https://images.gr-assets.com/users/1506617226p6/1.jpg
          />
        `
        const expected = [{ uri: avatarUrl }]

        expect(goodreadsHandler.resolve(value, content)).toEqual(expected)
      })

      it('should return the largest variant of og:image when the page has no avatar image', () => {
        const value = 'https://www.goodreads.com/user/show/1-alice-smith'
        const content = `
          <meta
            property="og:image"
            content="https://images.gr-assets.com/users/1506617226p5/1.jpg"
          />
        `
        const expected = [{ uri: avatarUrl }]

        expect(goodreadsHandler.resolve(value, content)).toEqual(expected)
      })

      it('should return a ref to the user when content is absent', () => {
        const value = 'https://www.goodreads.com/user/show/1-alice-smith'
        const expected = [{ platform: 'goodreads', id: '1', url: value }]

        expect(goodreadsHandler.resolve(value)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for a user without a photo', () => {
        const value = 'https://www.goodreads.com/user/show/10'

        expect(goodreadsHandler.resolve(value, userPageWithoutPhoto)).toEqual([])
      })

      it('should return empty array for a page without an avatar', () => {
        const value = 'https://www.goodreads.com/user/show/1'

        expect(goodreadsHandler.resolve(value, '<html></html>')).toEqual([])
      })

      it('should return empty array for an unmatched URL', () => {
        const value = 'https://www.goodreads.com/review/list/1'

        expect(goodreadsHandler.resolve(value, userPage)).toEqual([])
      })
    })
  })
})

describe('goodreadsEnricher', () => {
  it('should return the avatar from the user page', async () => {
    const context = createContext({ 'https://www.goodreads.com/user/show/1': userPage })

    expect(await goodreadsEnricher(createRef('1'), context)).toEqual([avatarUrl])
  })

  it('should return undefined for a ref of another platform', async () => {
    const ref: DiscoverRef = {
      platform: 'mastodon',
      id: 'example',
      url: 'https://example.com/@example',
    }

    expect(await goodreadsEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array for a user without a photo', async () => {
    const responses = { 'https://www.goodreads.com/user/show/10': userPageWithoutPhoto }
    const context = createContext(responses)

    expect(await goodreadsEnricher(createRef('10'), context)).toEqual([])
  })

  it('should reject when the body is a stream', () => {
    const fetchFn: FetchFn = async (url) => ({
      headers: new Headers(),
      body: new ReadableStream(),
      url,
      status: 200,
    })
    const throwing = () => goodreadsEnricher(createRef('1'), { fetchFn })

    expect(throwing()).rejects.toThrow('Unexpected stream body')
  })

  it('should reject when fetch throws', () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const throwing = () => goodreadsEnricher(createRef('1'), { fetchFn })

    expect(throwing()).rejects.toThrow('Network error')
  })

  it('should reject when the response is not 2xx', () => {
    const throwing = () => goodreadsEnricher(createRef('1'), createContext({}))
    const expected = 'Unexpected status 404 from https://www.goodreads.com/user/show/1'

    expect(throwing()).rejects.toThrow(expected)
  })
})
