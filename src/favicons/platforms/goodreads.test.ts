import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, DiscoverUriEntry, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { goodreadsEnricher, goodreadsHandler } from './goodreads.js'

const avatarUrl = 'https://images.gr-assets.com/users/1506617226p8/1.jpg'

const userPage = `
  <meta
    property="og:image"
    content="https://images.gr-assets.com/users/1506617226p5/1.jpg"
  />
  <img
    alt="Otis Chandler"
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
    alt="Florence Chandler"
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
      const value = 'https://www.goodreads.com/user/show/1-otis-chandler'

      expect(goodreadsHandler.match(value)).toBe(true)
    })

    it('should match a user page without a slug', () => {
      expect(goodreadsHandler.match('https://www.goodreads.com/user/show/1')).toBe(true)
    })

    it('should match a user page on the bare host', () => {
      expect(goodreadsHandler.match('https://goodreads.com/user/show/1')).toBe(true)
    })

    it('should not match a review list page', () => {
      expect(goodreadsHandler.match('https://www.goodreads.com/review/list/1')).toBe(false)
    })

    it('should not match an author page', () => {
      expect(goodreadsHandler.match('https://www.goodreads.com/author/show/1.Example')).toBe(false)
    })

    it('should not match a user page with a non-numeric id', () => {
      expect(goodreadsHandler.match('https://www.goodreads.com/user/show/example')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(goodreadsHandler.match('https://example.com/user/show/1')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(goodreadsHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return the largest variant of the avatar', () => {
        const value = 'https://www.goodreads.com/user/show/1-otis-chandler'
        const expected: Array<DiscoverUriEntry> = [{ uri: avatarUrl }]

        expect(goodreadsHandler.resolve(value, userPage)).toEqual(expected)
      })

      it('should return the largest variant of og:image when the page has no avatar image', () => {
        const value = 'https://www.goodreads.com/user/show/1-otis-chandler'
        const content = `
          <meta
            property="og:image"
            content="https://images.gr-assets.com/users/1506617226p5/1.jpg"
          />
        `
        const expected: Array<DiscoverUriEntry> = [{ uri: avatarUrl }]

        expect(goodreadsHandler.resolve(value, content)).toEqual(expected)
      })

      it('should return a ref to the user when content is absent', () => {
        const value = 'https://www.goodreads.com/user/show/1-otis-chandler'
        const expected: Array<DiscoverRef> = [{ platform: 'goodreads', id: '1', url: value }]

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
      url: 'https://mastodon.social/@example',
    }

    expect(await goodreadsEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array for a user without a photo', async () => {
    const responses = { 'https://www.goodreads.com/user/show/10': userPageWithoutPhoto }
    const context = createContext(responses)

    expect(await goodreadsEnricher(createRef('10'), context)).toEqual([])
  })

  it('should return empty array when the user page has no avatar', async () => {
    expect(await goodreadsEnricher(createRef('1'), createContext({}))).toEqual([])
  })

  it('should return empty array when the body is a stream', async () => {
    const fetchFn: FetchFn = async (url) => ({
      headers: new Headers(),
      body: new ReadableStream(),
      url,
      status: 200,
    })

    expect(await goodreadsEnricher(createRef('1'), { fetchFn })).toEqual([])
  })

  it('should return empty array when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }

    expect(await goodreadsEnricher(createRef('1'), { fetchFn })).toEqual([])
  })
})
