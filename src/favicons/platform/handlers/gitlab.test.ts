import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { gitlabHandler } from './gitlab.js'

const gitlabHtml = '<html><head><meta property="og:site_name" content="GitLab"></head></html>'
const gitlabHeaders = new Headers({ 'x-gitlab-meta': '{"version":"1"}' })

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    url,
    body: responses[url] ?? '',
    headers: new Headers(),
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

describe('gitlabHandler', () => {
  describe('match', () => {
    it('should match gitlab.com user URLs without content', () => {
      expect(gitlabHandler.match('https://gitlab.com/gitlab-org')).toBe(true)
    })

    it('should match gitlab.com repo URLs without content', () => {
      expect(gitlabHandler.match('https://gitlab.com/gitlab-org/gitlab')).toBe(true)
    })

    it('should match www.gitlab.com without content', () => {
      expect(gitlabHandler.match('https://www.gitlab.com/user')).toBe(true)
    })

    it('should match self-hosted instance with GitLab HTML', () => {
      expect(gitlabHandler.match('https://gitlab.mycompany.com/user', gitlabHtml)).toBe(true)
    })

    it('should match self-hosted instance with GitLab header', () => {
      expect(gitlabHandler.match('https://gitlab.mycompany.com/user', '', gitlabHeaders)).toBe(true)
    })

    it('should not match self-hosted root path even with GitLab HTML', () => {
      expect(gitlabHandler.match('https://gitlab.mycompany.com', gitlabHtml)).toBe(false)
    })

    it('should not match non-GitLab sites', () => {
      expect(gitlabHandler.match('https://github.com/user')).toBe(false)
      expect(gitlabHandler.match('https://example.com/user')).toBe(false)
    })

    it('should not match self-hosted without content or headers', () => {
      expect(gitlabHandler.match('https://gitlab.mycompany.com/user')).toBe(false)
    })

    it('should match URLs with feed extensions', () => {
      expect(gitlabHandler.match('https://gitlab.com/alice.atom')).toBe(true)
      expect(gitlabHandler.match('https://gitlab.com/john.doe.atom')).toBe(true)
    })

    it('should not match invalid URLs', () => {
      expect(gitlabHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return avatar URL from GitLab API for user page', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.com/api/v4/users?username=alice': JSON.stringify([
          { avatar_url: 'https://gitlab.com/uploads/user/avatar/1/alice.png' },
        ]),
      })
      const result = await gitlabHandler.resolve(
        'https://gitlab.com/alice',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://gitlab.com/uploads/user/avatar/1/alice.png' },
      ]

      expect(result).toEqual(expected)
    })

    it('should return avatar from first result when API returns multiple users', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.com/api/v4/users?username=alice': JSON.stringify([
          { avatar_url: 'https://gitlab.com/uploads/user/avatar/1/alice.png' },
          { avatar_url: 'https://gitlab.com/uploads/user/avatar/2/other.png' },
        ]),
      })
      const result = await gitlabHandler.resolve(
        'https://gitlab.com/alice',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://gitlab.com/uploads/user/avatar/1/alice.png' },
      ]

      expect(result).toEqual(expected)
    })

    it('should use origin from self-hosted instance', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.mycompany.com/api/v4/users?username=alice': JSON.stringify([
          { avatar_url: 'https://gitlab.mycompany.com/uploads/user/avatar/1/alice.png' },
        ]),
      })
      const result = await gitlabHandler.resolve(
        'https://gitlab.mycompany.com/alice',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://gitlab.mycompany.com/uploads/user/avatar/1/alice.png' },
      ]

      expect(result).toEqual(expected)
    })

    it('should extract username from repo URL path', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.com/api/v4/users?username=gitlab-org': JSON.stringify([
          { avatar_url: 'https://gitlab.com/uploads/group/avatar/1/gitlab-org.png' },
        ]),
      })
      const result = await gitlabHandler.resolve(
        'https://gitlab.com/gitlab-org/gitlab',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://gitlab.com/uploads/group/avatar/1/gitlab-org.png' },
      ]

      expect(result).toEqual(expected)
    })

    it('should strip feed extension from user URL', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.com/api/v4/users?username=alice': JSON.stringify([
          { avatar_url: 'https://gitlab.com/uploads/user/avatar/1/alice.png' },
        ]),
      })
      const result = await gitlabHandler.resolve(
        'https://gitlab.com/alice.atom',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://gitlab.com/uploads/user/avatar/1/alice.png' },
      ]

      expect(result).toEqual(expected)
    })

    it('should preserve dots in usernames', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.com/api/v4/users?username=john.doe': JSON.stringify([
          { avatar_url: 'https://gitlab.com/uploads/user/avatar/1/john.doe.png' },
        ]),
      })
      const result = await gitlabHandler.resolve(
        'https://gitlab.com/john.doe',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://gitlab.com/uploads/user/avatar/1/john.doe.png' },
      ]

      expect(result).toEqual(expected)
    })

    it('should strip feed extension from dotted username', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.com/api/v4/users?username=john.doe': JSON.stringify([
          { avatar_url: 'https://gitlab.com/uploads/user/avatar/1/john.doe.png' },
        ]),
      })
      const result = await gitlabHandler.resolve(
        'https://gitlab.com/john.doe.atom',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://gitlab.com/uploads/user/avatar/1/john.doe.png' },
      ]

      expect(result).toEqual(expected)
    })

    it('should fall back to groups API when users API returns empty', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.com/api/v4/users?username=gitlab-org': JSON.stringify([]),
        'https://gitlab.com/api/v4/groups/gitlab-org': JSON.stringify({
          avatar_url: 'https://gitlab.com/uploads/-/system/group/avatar/9970/project_avatar.png',
        }),
      })
      const result = await gitlabHandler.resolve(
        'https://gitlab.com/gitlab-org',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://gitlab.com/uploads/-/system/group/avatar/9970/project_avatar.png' },
      ]

      expect(result).toEqual(expected)
    })

    it('should return empty array when both users and groups API return empty', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.com/api/v4/users?username=nonexistent': JSON.stringify([]),
        'https://gitlab.com/api/v4/groups/nonexistent': JSON.stringify({ avatar_url: '' }),
      })
      const result = await gitlabHandler.resolve(
        'https://gitlab.com/nonexistent',
        undefined,
        undefined,
        mockFetch,
      )

      expect(result).toEqual([])
    })

    it('should return empty array for root URL', async () => {
      const mockFetch = createMockFetch({})
      const result = await gitlabHandler.resolve(
        'https://gitlab.com',
        undefined,
        undefined,
        mockFetch,
      )

      expect(result).toEqual([])
    })

    it('should return empty array for excluded paths', async () => {
      const mockFetch = createMockFetch({})
      const result = await gitlabHandler.resolve(
        'https://gitlab.com/explore',
        undefined,
        undefined,
        mockFetch,
      )

      expect(result).toEqual([])
    })

    it('should return empty array when API returns empty array', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.com/api/v4/users?username=nonexistent': JSON.stringify([]),
      })
      const result = await gitlabHandler.resolve(
        'https://gitlab.com/nonexistent',
        undefined,
        undefined,
        mockFetch,
      )

      expect(result).toEqual([])
    })

    it('should return empty array when avatar_url is empty', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.com/api/v4/users?username=alice': JSON.stringify([{ avatar_url: '' }]),
      })
      const result = await gitlabHandler.resolve(
        'https://gitlab.com/alice',
        undefined,
        undefined,
        mockFetch,
      )

      expect(result).toEqual([])
    })

    it('should return empty array when API returns invalid JSON', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.com/api/v4/users?username=alice': 'not-json',
      })
      const result = await gitlabHandler.resolve(
        'https://gitlab.com/alice',
        undefined,
        undefined,
        mockFetch,
      )

      expect(result).toEqual([])
    })

    it('should return empty array when fetchFn is not provided', async () => {
      const result = await gitlabHandler.resolve('https://gitlab.com/alice')

      expect(result).toEqual([])
    })

    it('should return empty array when fetch throws', async () => {
      const mockFetch: DiscoverFetchFn = () => {
        throw new Error('Network error')
      }
      const result = await gitlabHandler.resolve(
        'https://gitlab.com/alice',
        undefined,
        undefined,
        mockFetch,
      )

      expect(result).toEqual([])
    })

    it('should return empty array for invalid URL', async () => {
      const mockFetch = createMockFetch({})
      const result = await gitlabHandler.resolve('not-a-url', undefined, undefined, mockFetch)

      expect(result).toEqual([])
    })
  })
})
