import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type LegistarUrl, legistarHandler, parseLegistarUrl } from './legistar.js'

describe('parseLegistarUrl', () => {
  it('should return the legislation for a legislation detail page', () => {
    const value =
      'https://madison.legistar.com/LegislationDetail.aspx?ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217'
    const expected: LegistarUrl = {
      kind: 'legislation',
      id: '1065902',
      guid: 'EFE087C2-C62A-40F9-B1F9-6E2975E86217',
    }

    expect(parseLegistarUrl(value)).toEqual(expected)
  })

  it('should return the meeting for a meeting detail page', () => {
    const value =
      'https://a2gov.legistar.com/MeetingDetail.aspx?ID=1373416&GUID=351F7891-35DC-4AE5-BCED-DA4B7A00E804&Options=info|&Search='
    const expected: LegistarUrl = {
      kind: 'meeting',
      id: '1373416',
      guid: '351F7891-35DC-4AE5-BCED-DA4B7A00E804',
    }

    expect(parseLegistarUrl(value)).toEqual(expected)
  })

  it('should ignore the case of the page name', () => {
    const value =
      'https://madison.legistar.com/legislationdetail.aspx?ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217'
    const expected: LegistarUrl = {
      kind: 'legislation',
      id: '1065902',
      guid: 'EFE087C2-C62A-40F9-B1F9-6E2975E86217',
    }

    expect(parseLegistarUrl(value)).toEqual(expected)
  })

  it('should return undefined for a detail page without a GUID', () => {
    expect(
      parseLegistarUrl('https://madison.legistar.com/LegislationDetail.aspx?ID=1065902'),
    ).toBeUndefined()
  })

  it('should return undefined for a non-numeric ID', () => {
    expect(
      parseLegistarUrl(
        'https://madison.legistar.com/LegislationDetail.aspx?ID=abc&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217',
      ),
    ).toBeUndefined()
  })

  it('should return undefined for a malformed GUID', () => {
    expect(
      parseLegistarUrl('https://madison.legistar.com/LegislationDetail.aspx?ID=1065902&GUID=abc'),
    ).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseLegistarUrl('not a url')).toBeUndefined()
  })

  it('should return undefined for another page', () => {
    expect(parseLegistarUrl('https://madison.legistar.com/Calendar.aspx')).toBeUndefined()
  })

  it('should return undefined for another detail page', () => {
    expect(
      parseLegistarUrl(
        'https://madison.legistar.com/DepartmentDetail.aspx?ID=17411&GUID=ED5B7181-AD76-4EF5-9730-729ACA9BFE9C',
      ),
    ).toBeUndefined()
  })

  it('should return the legislation for a detail page on a custom domain', () => {
    const value =
      'https://example.com/LegislationDetail.aspx?ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217'
    const expected: LegistarUrl = {
      kind: 'legislation',
      id: '1065902',
      guid: 'EFE087C2-C62A-40F9-B1F9-6E2975E86217',
    }

    expect(parseLegistarUrl(value)).toEqual(expected)
  })
})

describe('legistarHandler', () => {
  describe('match', () => {
    it('should match a Legistar detail page', () => {
      const value =
        'https://nashville.legistar.com/LegislationDetail.aspx?ID=6706761&GUID=053E478F-E646-4638-A793-24217381CB5E'

      expect(legistarHandler.match(value)).toBe(true)
    })

    it('should match a detail page on a custom domain by the load balancer cookie', () => {
      const value =
        'https://example.com/MeetingDetail.aspx?ID=1373416&GUID=351F7891-35DC-4AE5-BCED-DA4B7A00E804'
      const headers = new Headers()
      headers.append('set-cookie', 'ASP.NET_SessionId=abc; path=/; secure; HttpOnly')
      headers.append(
        'set-cookie',
        'BIGipServerinsite.legistar.com_443=908198666.47873.0000; path=/; Httponly; Secure',
      )

      expect(legistarHandler.match(value, '', headers)).toBe(true)
    })

    it('should match a detail page on a custom domain by the share widget', () => {
      const value =
        'https://example.com/LegislationDetail.aspx?ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217'
      const content =
        '<script type="text/javascript" src="https://s7.addthis.com/js/300/addthis_widget.js#username=legistarinsite"></script>'

      expect(legistarHandler.match(value, content)).toBe(true)
    })

    it('should not match a detail page on a custom domain with another AddThis account', () => {
      const value =
        'https://example.com/LegislationDetail.aspx?ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217'
      const content =
        '<script type="text/javascript" src="https://s7.addthis.com/js/300/addthis_widget.js#username=ra-4f0c7ab43a6b6e1f"></script>'

      expect(legistarHandler.match(value, content)).toBe(false)
    })

    it('should not match a detail page on a custom domain without a marker', () => {
      const value =
        'https://example.com/MeetingDetail.aspx?ID=1373416&GUID=351F7891-35DC-4AE5-BCED-DA4B7A00E804'
      const headers = new Headers({ 'set-cookie': 'ASP.NET_SessionId=abc; path=/' })

      expect(legistarHandler.match(value, '', headers)).toBe(false)
    })

    it('should not match a detail page on a custom domain with another load balancer cookie', () => {
      const value =
        'https://example.com/MeetingDetail.aspx?ID=1373416&GUID=351F7891-35DC-4AE5-BCED-DA4B7A00E804'
      const headers = new Headers({
        'set-cookie': 'BIGipServerlegistar_api_443=908198666.47873.0000; path=/',
      })

      expect(legistarHandler.match(value, '', headers)).toBe(false)
    })

    it('should not match another page', () => {
      expect(legistarHandler.match('https://madison.legistar.com/Calendar.aspx')).toBe(false)
    })

    it('should not match another page on a custom domain', () => {
      const headers = new Headers({
        'set-cookie': 'BIGipServerinsite.legistar.com_443=908198666.47873.0000; path=/',
      })

      expect(legistarHandler.match('https://example.com/Calendar.aspx', '', headers)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the legislation feed', () => {
      const value =
        'https://madison.legistar.com/LegislationDetail.aspx?ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://madison.legistar.com/Feed.ashx?M=LD&ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217',
          hint: { key: 'legistar:legislation', label: 'Legislation' },
        },
      ]

      expect(legistarHandler.resolve(value)).toEqual(expected)
    })

    it('should return the meeting feed', () => {
      const value =
        'https://a2gov.legistar.com/MeetingDetail.aspx?ID=1373416&GUID=351F7891-35DC-4AE5-BCED-DA4B7A00E804'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://a2gov.legistar.com/Feed.ashx?M=CalendarDetail&ID=1373416&GUID=351F7891-35DC-4AE5-BCED-DA4B7A00E804',
          hint: { key: 'legistar:meeting', label: 'Meeting' },
        },
      ]

      expect(legistarHandler.resolve(value)).toEqual(expected)
    })

    it('should return the legislation feed on a custom domain', () => {
      const value =
        'https://example.com/LegislationDetail.aspx?ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/Feed.ashx?M=LD&ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217',
          hint: { key: 'legistar:legislation', label: 'Legislation' },
        },
      ]

      expect(legistarHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for another page', () => {
      expect(legistarHandler.resolve('https://example.com/')).toEqual([])
    })
  })
})
