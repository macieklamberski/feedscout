import { describe, expect, it } from 'bun:test'
import { parseSourceforgeUrl, type SourceforgeUrl, sourceforgeHandler } from './sourceforge.js'

describe('parseSourceforgeUrl', () => {
  it('should keep the project name case', () => {
    const expected: SourceforgeUrl = { kind: 'project', project: 'SevenZip' }

    expect(parseSourceforgeUrl('https://sourceforge.net/projects/SevenZip/')).toEqual(expected)
  })

  it('should return the project for /projects/{project}', () => {
    const expected: SourceforgeUrl = { kind: 'project', project: 'filezilla' }

    expect(parseSourceforgeUrl('https://sourceforge.net/projects/filezilla')).toEqual(expected)
  })

  it('should return the project for /p/{project}', () => {
    const expected: SourceforgeUrl = { kind: 'project', project: 'nmap' }

    expect(parseSourceforgeUrl('https://sourceforge.net/p/nmap')).toEqual(expected)
  })

  it('should return the project for a capitalized /P/ prefix', () => {
    const expected: SourceforgeUrl = { kind: 'project', project: 'nmap' }

    expect(parseSourceforgeUrl('https://sourceforge.net/P/nmap')).toEqual(expected)
  })

  it('should return the project for a project subpage', () => {
    const expected: SourceforgeUrl = { kind: 'project', project: 'nmap' }

    expect(parseSourceforgeUrl('https://sourceforge.net/projects/nmap/reviews')).toEqual(expected)
  })

  it('should return the tool and page for a ticket page', () => {
    const value = 'https://sourceforge.net/p/nmap/bugs/123'
    const expected: SourceforgeUrl = { kind: 'project', project: 'nmap', tool: 'bugs', page: '123' }

    expect(parseSourceforgeUrl(value)).toEqual(expected)
  })

  it('should return the tool without a page for a path below a tool page', () => {
    const value = 'https://sourceforge.net/p/example/code/HEAD/tree/'
    const expected: SourceforgeUrl = { kind: 'project', project: 'example', tool: 'code' }

    expect(parseSourceforgeUrl(value)).toEqual(expected)
  })

  it('should return the forum for a discussion forum page', () => {
    const value = 'https://sourceforge.net/p/example/discussion/12345/'
    const expected: SourceforgeUrl = { kind: 'project', project: 'example', forum: '12345' }

    expect(parseSourceforgeUrl(value)).toEqual(expected)
  })

  it('should return the decoded folder path for a files subfolder page', () => {
    const value = 'https://sourceforge.net/projects/example/files/Win%2064/Release/'
    const expected: SourceforgeUrl = {
      kind: 'project',
      project: 'example',
      path: '/Win 64/Release',
    }

    expect(parseSourceforgeUrl(value)).toEqual(expected)
  })

  it('should return the project for the files page', () => {
    const value = 'https://sourceforge.net/projects/example/files/'
    const expected: SourceforgeUrl = { kind: 'project', project: 'example' }

    expect(parseSourceforgeUrl(value)).toEqual(expected)
  })

  it('should return the forum and thread for a discussion thread page', () => {
    const value = 'https://sourceforge.net/p/example/discussion/12345/thread/abc123/'
    const expected: SourceforgeUrl = {
      kind: 'project',
      project: 'example',
      forum: '12345',
      thread: 'abc123',
    }

    expect(parseSourceforgeUrl(value)).toEqual(expected)
  })

  it('should return the project for a project name with hyphens', () => {
    const value = 'https://sourceforge.net/projects/my-cool-project'
    const expected: SourceforgeUrl = { kind: 'project', project: 'my-cool-project' }

    expect(parseSourceforgeUrl(value)).toEqual(expected)
  })

  it('should return the project for the www host', () => {
    const expected: SourceforgeUrl = { kind: 'project', project: 'nmap' }

    expect(parseSourceforgeUrl('https://www.sourceforge.net/projects/nmap')).toEqual(expected)
  })

  it('should return the project for an uppercase host', () => {
    const expected: SourceforgeUrl = { kind: 'project', project: 'nmap' }

    expect(parseSourceforgeUrl('https://SourceForge.net/projects/nmap')).toEqual(expected)
  })

  it('should return undefined for /projects/ without a project', () => {
    expect(parseSourceforgeUrl('https://sourceforge.net/projects/')).toBeUndefined()
  })

  it('should return undefined for /p without a project', () => {
    expect(parseSourceforgeUrl('https://sourceforge.net/p')).toBeUndefined()
  })

  it('should return undefined for a non-project path', () => {
    expect(parseSourceforgeUrl('https://sourceforge.net/directory')).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseSourceforgeUrl('https://sourceforge.net/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSourceforgeUrl('https://example.com/projects/nmap')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseSourceforgeUrl('not-a-url')).toBeUndefined()
  })
})

describe('sourceforgeHandler', () => {
  describe('match', () => {
    it('should return true for a project page', () => {
      expect(sourceforgeHandler.match('https://sourceforge.net/projects/mingw')).toBe(true)
    })

    it('should return false for a non-project path', () => {
      expect(sourceforgeHandler.match('https://sourceforge.net/about')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve the project icon', () => {
      const value = 'https://sourceforge.net/projects/mingw'
      const expected = [{ uri: 'https://a.fsdn.com/allura/p/mingw/icon' }]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a non-project path', () => {
      expect(sourceforgeHandler.resolve('https://sourceforge.net/about')).toEqual([])
    })
  })
})
