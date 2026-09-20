import { describe, expect, it } from 'bun:test'
import { sourcehutHandler } from './sourcehut.js'

describe('sourcehutHandler', () => {
  describe('match', () => {
    it('should match a repository path', () => {
      expect(sourcehutHandler.match('https://git.sr.ht/~example/project')).toBe(true)
    })

    it('should match a path below the repository', () => {
      expect(sourcehutHandler.match('https://git.sr.ht/~example/project/tree')).toBe(true)
    })

    it('should not match a user path without a repository', () => {
      expect(sourcehutHandler.match('https://git.sr.ht/~example')).toBe(false)
    })

    it('should not match a path without the tilde prefix', () => {
      expect(sourcehutHandler.match('https://git.sr.ht/example/project')).toBe(false)
    })

    it('should not match other Sourcehut services', () => {
      expect(sourcehutHandler.match('https://todo.sr.ht/~example/project')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(sourcehutHandler.match('not-a-url')).toBe(false)
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

    it('should use only the user and repository segments', () => {
      const value = 'https://git.sr.ht/~example/project/log/main'
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

    it('should return an empty array for a user path', () => {
      expect(sourcehutHandler.resolve('https://git.sr.ht/~example')).toEqual([])
    })

    it('should return an empty array for invalid URLs', () => {
      expect(sourcehutHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
