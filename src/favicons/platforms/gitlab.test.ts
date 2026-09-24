import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { gitlabEnricher, gitlabHandler } from './gitlab.js'

const gitlabHtml = '<html><head><meta property="og:site_name" content="GitLab"></head></html>'
const gitlabHeaders = new Headers({ 'x-gitlab-meta': '{"version":"1"}' })

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
  return { platform: 'gitlab', id, url }
}

const aliceRef = createRef('https://gitlab.com/alice', 'alice')

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
    it('should return a ref for a user page', async () => {
      expect(await gitlabHandler.resolve('https://gitlab.com/alice')).toEqual([aliceRef])
    })

    it('should return a ref for a self-hosted instance', async () => {
      const url = 'https://gitlab.mycompany.com/alice'

      expect(await gitlabHandler.resolve(url)).toEqual([createRef(url, 'alice')])
    })

    it('should extract username from repo URL path', async () => {
      const url = 'https://gitlab.com/gitlab-org/gitlab'

      expect(await gitlabHandler.resolve(url)).toEqual([createRef(url, 'gitlab-org')])
    })

    it('should strip feed extension from user URL', async () => {
      const url = 'https://gitlab.com/alice.atom'

      expect(await gitlabHandler.resolve(url)).toEqual([createRef(url, 'alice')])
    })

    it('should preserve dots in usernames', async () => {
      const url = 'https://gitlab.com/john.doe'

      expect(await gitlabHandler.resolve(url)).toEqual([createRef(url, 'john.doe')])
    })

    it('should strip feed extension from dotted username', async () => {
      const url = 'https://gitlab.com/john.doe.atom'

      expect(await gitlabHandler.resolve(url)).toEqual([createRef(url, 'john.doe')])
    })

    it('should return empty array for root URL', async () => {
      expect(await gitlabHandler.resolve('https://gitlab.com')).toEqual([])
    })

    it('should return empty array for excluded paths', async () => {
      expect(await gitlabHandler.resolve('https://gitlab.com/explore')).toEqual([])
    })

    it('should return empty array for invalid URL', async () => {
      expect(await gitlabHandler.resolve('not-a-url')).toEqual([])
    })
  })
})

describe('gitlabEnricher', () => {
  it('should return avatar URL from GitLab API for user page', async () => {
    const context = createContext({
      'https://gitlab.com/api/v4/users?username=alice': JSON.stringify([
        { avatar_url: 'https://gitlab.com/uploads/user/avatar/1/alice.png' },
      ]),
    })

    expect(await gitlabEnricher(aliceRef, context)).toEqual([
      'https://gitlab.com/uploads/user/avatar/1/alice.png',
    ])
  })

  it('should return avatar from first result when API returns multiple users', async () => {
    const context = createContext({
      'https://gitlab.com/api/v4/users?username=alice': JSON.stringify([
        { avatar_url: 'https://gitlab.com/uploads/user/avatar/1/alice.png' },
        { avatar_url: 'https://gitlab.com/uploads/user/avatar/2/other.png' },
      ]),
    })

    expect(await gitlabEnricher(aliceRef, context)).toEqual([
      'https://gitlab.com/uploads/user/avatar/1/alice.png',
    ])
  })

  it('should use origin from self-hosted instance', async () => {
    const context = createContext({
      'https://gitlab.mycompany.com/api/v4/users?username=alice': JSON.stringify([
        { avatar_url: 'https://gitlab.mycompany.com/uploads/user/avatar/1/alice.png' },
      ]),
    })
    const ref = createRef('https://gitlab.mycompany.com/alice', 'alice')

    expect(await gitlabEnricher(ref, context)).toEqual([
      'https://gitlab.mycompany.com/uploads/user/avatar/1/alice.png',
    ])
  })

  it('should fall back to groups API when users API returns empty', async () => {
    const context = createContext({
      'https://gitlab.com/api/v4/users?username=gitlab-org': JSON.stringify([]),
      'https://gitlab.com/api/v4/groups/gitlab-org': JSON.stringify({
        avatar_url: 'https://gitlab.com/uploads/-/system/group/avatar/9970/project_avatar.png',
      }),
    })
    const ref = createRef('https://gitlab.com/gitlab-org', 'gitlab-org')

    expect(await gitlabEnricher(ref, context)).toEqual([
      'https://gitlab.com/uploads/-/system/group/avatar/9970/project_avatar.png',
    ])
  })

  it('should return undefined for a ref of another platform', async () => {
    const ref: DiscoverRef = { platform: 'mastodon', id: 'user', url: 'https://example.com/@user' }

    expect(await gitlabEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array when both users and groups API return empty', async () => {
    const context = createContext({
      'https://gitlab.com/api/v4/users?username=nonexistent': JSON.stringify([]),
      'https://gitlab.com/api/v4/groups/nonexistent': JSON.stringify({ avatar_url: '' }),
    })
    const ref = createRef('https://gitlab.com/nonexistent', 'nonexistent')

    expect(await gitlabEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when API returns empty array', async () => {
    const context = createContext({
      'https://gitlab.com/api/v4/users?username=nonexistent': JSON.stringify([]),
    })
    const ref = createRef('https://gitlab.com/nonexistent', 'nonexistent')

    expect(await gitlabEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when avatar_url is empty', async () => {
    const context = createContext({
      'https://gitlab.com/api/v4/users?username=alice': JSON.stringify([{ avatar_url: '' }]),
    })

    expect(await gitlabEnricher(aliceRef, context)).toEqual([])
  })

  it('should return empty array when API returns invalid JSON', async () => {
    const context = createContext({
      'https://gitlab.com/api/v4/users?username=alice': 'not-json',
    })

    expect(await gitlabEnricher(aliceRef, context)).toEqual([])
  })

  it('should return empty array when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }

    expect(await gitlabEnricher(aliceRef, { fetchFn })).toEqual([])
  })
})
