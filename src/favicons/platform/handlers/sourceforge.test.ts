import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { sourceforgeHandler } from './sourceforge.js'

describe('sourceforgeHandler', () => {
  describe('match', () => {
    it('should match project URLs', () => {
      expect(sourceforgeHandler.match('https://sourceforge.net/projects/mingw')).toBe(true)
    })

    it('should match project subpath URLs', () => {
      expect(sourceforgeHandler.match('https://sourceforge.net/projects/mingw/files')).toBe(true)
    })

    it('should match www variant', () => {
      expect(sourceforgeHandler.match('https://www.sourceforge.net/projects/mingw')).toBe(true)
    })

    it('should not match homepage', () => {
      expect(sourceforgeHandler.match('https://sourceforge.net')).toBe(false)
      expect(sourceforgeHandler.match('https://sourceforge.net/')).toBe(false)
    })

    it('should not match non-project paths', () => {
      expect(sourceforgeHandler.match('https://sourceforge.net/about')).toBe(false)
      expect(sourceforgeHandler.match('https://sourceforge.net/directory')).toBe(false)
    })

    it('should not match non-sourceforge URLs', () => {
      expect(sourceforgeHandler.match('https://example.com/projects/mingw')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(sourceforgeHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve project icon from project URL', () => {
      const value = sourceforgeHandler.resolve('https://sourceforge.net/projects/mingw')
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://a.fsdn.com/allura/p/mingw/icon' }]

      expect(value).toEqual(expected)
    })

    it('should resolve project icon from project subpath', () => {
      const value = sourceforgeHandler.resolve('https://sourceforge.net/projects/mingw/files')
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://a.fsdn.com/allura/p/mingw/icon' }]

      expect(value).toEqual(expected)
    })

    it('should return empty array for non-project path', () => {
      expect(sourceforgeHandler.resolve('https://sourceforge.net/about')).toEqual([])
    })
  })
})
