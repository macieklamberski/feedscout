import { describe, expect, it } from 'bun:test'
import type { SourcehutUrl } from './sourcehut.js'
import { parseSourcehutUrl, sourcehutHandler } from './sourcehut.js'

describe('parseSourcehutUrl', () => {
  it('should return the repository for a repository page', () => {
    const expected: SourcehutUrl = { kind: 'repo', owner: 'example', repo: 'project' }

    expect(parseSourcehutUrl('https://git.sr.ht/~example/project')).toEqual(expected)
  })

  it('should return the repository for a path below the repository', () => {
    const expected: SourcehutUrl = { kind: 'repo', owner: 'example', repo: 'project' }

    expect(parseSourcehutUrl('https://git.sr.ht/~example/project/log/main')).toEqual(expected)
  })

  it('should return the user for a user page on every user host', () => {
    const expected: SourcehutUrl = { kind: 'user', owner: 'example' }

    expect(parseSourcehutUrl('https://sr.ht/~example/')).toEqual(expected)
    expect(parseSourcehutUrl('https://git.sr.ht/~example')).toEqual(expected)
    expect(parseSourcehutUrl('https://todo.sr.ht/~example/')).toEqual(expected)
  })

  it('should return undefined for a project page on sr.ht', () => {
    expect(parseSourcehutUrl('https://sr.ht/~example/project/')).toBeUndefined()
  })

  it('should return undefined for a tracker page on todo.sr.ht', () => {
    expect(parseSourcehutUrl('https://todo.sr.ht/~example/project')).toBeUndefined()
  })

  it('should return undefined for a path without the tilde prefix', () => {
    expect(parseSourcehutUrl('https://git.sr.ht/example/project')).toBeUndefined()
  })

  it('should return undefined for a bare tilde', () => {
    expect(parseSourcehutUrl('https://sr.ht/~/')).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parseSourcehutUrl('https://sr.ht/')).toBeUndefined()
  })

  it('should return undefined for other sr.ht services', () => {
    expect(parseSourcehutUrl('https://lists.sr.ht/~example')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSourcehutUrl('https://example.com/~example')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseSourcehutUrl('not-a-url')).toBeUndefined()
  })
})

describe('sourcehutHandler', () => {
  describe('match', () => {
    it('should match a repository path', () => {
      expect(sourcehutHandler.match('https://git.sr.ht/~example/project')).toBe(true)
    })

    it('should not match a user path without a repository', () => {
      expect(sourcehutHandler.match('https://git.sr.ht/~example')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the commits and refs feeds', () => {
      const value = 'https://git.sr.ht/~example/project'
      const expected = [
        {
          uri: 'https://git.sr.ht/~example/project/log/rss.xml',
          hint: { key: 'sourcehut:commits', label: 'Commits' },
        },
        {
          uri: 'https://git.sr.ht/~example/project/refs/rss.xml',
          hint: { key: 'sourcehut:refs', label: 'Refs' },
        },
      ]

      expect(sourcehutHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a user path', () => {
      expect(sourcehutHandler.resolve('https://git.sr.ht/~example')).toEqual([])
    })
  })
})
