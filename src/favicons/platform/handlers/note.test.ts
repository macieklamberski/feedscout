import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { noteHandler } from './note.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

const avatarUrl =
  'https://assets.st-note.com/production/uploads/images/1234/profile_abc.png?fit=bounds&format=jpeg&quality=85&width=330'
const profileContent = `<script>self.__next_f.push([1,"{\\"urlname\\":\\"alice\\",\\"profileImageUrl\\":\\"https://assets.st-note.com/production/uploads/images/1234/profile_abc.png?fit=bounds\\u0026format=jpeg\\u0026quality=85\\u0026width=330\\"}"])</script>`
const creatorsResponse = JSON.stringify({
  data: {
    urlname: 'alice',
    profileImageUrl: avatarUrl,
  },
})

describe('noteHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(noteHandler.match('https://note.com/alice')).toBe(true)
    })

    it('should match profile URLs with trailing slash', () => {
      expect(noteHandler.match('https://note.com/alice/')).toBe(true)
    })

    it('should match www.note.com profile URLs', () => {
      expect(noteHandler.match('https://www.note.com/alice')).toBe(true)
    })

    it('should match magazine URLs', () => {
      expect(noteHandler.match('https://note.com/alice/m/m1861fae39074')).toBe(true)
    })

    it('should not match hashtag pages', () => {
      expect(noteHandler.match('https://note.com/hashtag/design')).toBe(false)
      expect(noteHandler.match('https://note.com/tag/design')).toBe(false)
    })

    it('should not match article pages', () => {
      expect(noteHandler.match('https://note.com/alice/n/n1234567890ab')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(noteHandler.match('https://note.com/search')).toBe(false)
    })

    it('should not match root URL', () => {
      expect(noteHandler.match('https://note.com/')).toBe(false)
    })

    it('should not match non-note URLs', () => {
      expect(noteHandler.match('https://example.com/alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(noteHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return avatar from profile page payload', async () => {
        const mockFetch = createMockFetch({})
        const result = await noteHandler.resolve(
          'https://note.com/alice',
          profileContent,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [{ uri: avatarUrl }]

        expect(result).toEqual(expected)
      })

      it('should return avatar from creators API when profile page has no payload', async () => {
        const mockFetch = createMockFetch({
          'https://note.com/api/v2/creators/alice': creatorsResponse,
        })
        const result = await noteHandler.resolve(
          'https://note.com/alice',
          '<html></html>',
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [{ uri: avatarUrl }]

        expect(result).toEqual(expected)
      })

      it('should return avatar from creators API when content is absent', async () => {
        const mockFetch = createMockFetch({
          'https://note.com/api/v2/creators/alice': creatorsResponse,
        })
        const result = await noteHandler.resolve(
          'https://note.com/alice',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [{ uri: avatarUrl }]

        expect(result).toEqual(expected)
      })

      it('should return magazine owner avatar from creators API', async () => {
        const mockFetch = createMockFetch({
          'https://note.com/api/v2/creators/alice': creatorsResponse,
        })
        const result = await noteHandler.resolve(
          'https://note.com/alice/m/m1861fae39074',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [{ uri: avatarUrl }]

        expect(result).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for hashtag pages', async () => {
        const mockFetch = createMockFetch({})
        const result = await noteHandler.resolve(
          'https://note.com/hashtag/design',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when profileImageUrl is absent', async () => {
        const mockFetch = createMockFetch({
          'https://note.com/api/v2/creators/alice': JSON.stringify({ data: {} }),
        })
        const result = await noteHandler.resolve(
          'https://note.com/alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when creator is not found', async () => {
        const mockFetch = createMockFetch({
          'https://note.com/api/v2/creators/alice': JSON.stringify({
            data: 'リソースが見つかりません',
          }),
        })
        const result = await noteHandler.resolve(
          'https://note.com/alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when API returns invalid JSON', async () => {
        const mockFetch = createMockFetch({
          'https://note.com/api/v2/creators/alice': 'not-json',
        })
        const result = await noteHandler.resolve(
          'https://note.com/alice',
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
        const result = await noteHandler.resolve(
          'https://note.com/alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when fetchFn is not provided', async () => {
        const result = await noteHandler.resolve('https://note.com/alice')

        expect(result).toEqual([])
      })

      it('should return empty array for invalid URL', async () => {
        const mockFetch = createMockFetch({})
        const result = await noteHandler.resolve('not-a-url', undefined, undefined, mockFetch)

        expect(result).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should ignore page payload on magazine pages', async () => {
        const mockFetch = createMockFetch({})
        const result = await noteHandler.resolve(
          'https://note.com/alice/m/m1861fae39074',
          profileContent,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })
    })
  })
})
