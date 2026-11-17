import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: topic.
// Handler needed for: activity, blog, blog-featured, events, forum, forum-featured, groups, groups-featured, members, members-featured, photos, photos-featured, videos, videos-featured.

export type NingUrl =
  | { kind: 'topic'; topic: string; group?: string }
  | { kind: 'group'; group: string }
  | { kind: 'home' }

const topicRegex = /^\/forum\/topics\/([^/]+)\/?$/i
const groupTopicRegex = /^\/group\/(?<group>[^/]+)\/forum\/topics\/(?<topic>[^/]+)\/?$/i
const groupRegex = /^\/group\/([^/]+)/i

const domains = ['ning.com']

// A network on its own domain is known only by its marker, so its feeds are built here but not
// claimed. Past the feeds `resolve` builds, the table only claims. A topic in a group, or one
// named by its id, is still that one topic. A group topic page links its feed with `groupUrl`, so
// that row goes first and builds when the page names a group.
const feeds = definePlatformFeeds(
  [
    {
      key: 'ning:topic',
      main: '{scheme}://{host}/forum/topics/{topic}?groupUrl={group}&feed=yes&xn_auth=no',
      aliases: [
        '{scheme}://{host}/group/{group}/forum/topics/{topic}?feed=yes&xn_auth=no',
        '{scheme}://{host}/group/{group}/forum/topic/show?feed=yes&id={topic}&xn_auth=no',
      ],
    },
    {
      key: 'ning:topic',
      main: '{scheme}://{host}/forum/topics/{topic}?feed=yes&xn_auth=no',
      aliases: ['{scheme}://{host}/forum/topic/show?feed=yes&id={topic}&xn_auth=no'],
    },
    { key: 'ning:activity', main: '{scheme}://{host}/activity/log/list?fmt=rss' },
    {
      key: 'ning:activity-member',
      main: '{scheme}://{host}/activity/log/list?fmt=rss&screenName={member}',
    },
    { key: 'ning:blog', main: '{scheme}://{host}/profiles/blog/feed?xn_auth=no' },
    {
      key: 'ning:blog-author',
      main: '{scheme}://{host}/profiles/blog/feed?user={user}&xn_auth=no',
    },
    { key: 'ning:blog-tag', main: '{scheme}://{host}/profiles/blog/feed?tag={tag}&xn_auth=no' },
    {
      key: 'ning:blog-featured',
      main: '{scheme}://{host}/profiles/blog/feed?promoted=1&xn_auth=no',
    },
    // The bare `/forum?feed=yes` answers with the forum page on some networks.
    {
      key: 'ning:forum',
      main: '{scheme}://{host}/forum/topic/list?feed=yes&xn_auth=no',
      aliases: [
        '{scheme}://{host}/forum?feed=yes&xn_auth=no',
        '{scheme}://{host}/forum/index?feed=yes&xn_auth=no',
      ],
    },
    {
      key: 'ning:forum-featured',
      main: '{scheme}://{host}/forum/topic/list?featured=1&feed=yes&xn_auth=no',
    },
    {
      key: 'ning:forum-group',
      main: '{scheme}://{host}/groups/group/forum?feed=yes&groupUrl={group}&xn_auth=no',
      aliases: [
        '{scheme}://{host}/forum/topic/list?feed=yes&groupUrl={group}&xn_auth=no',
        '{scheme}://{host}/group/{group}/forum?feed=yes&xn_auth=no',
        '{scheme}://{host}/group/{group}/forum/topic/list?feed=yes&xn_auth=no',
      ],
    },
    {
      key: 'ning:forum-group-featured',
      main: '{scheme}://{host}/group/{group}/forum/topic/list?featured=1&feed=yes&xn_auth=no',
      aliases: [
        '{scheme}://{host}/forum/topic/list?featured=1&feed=yes&groupUrl={group}&xn_auth=no',
      ],
    },
    {
      key: 'ning:forum-category',
      main: '{scheme}://{host}/forum/categories/{category}/listForCategory?feed=yes&xn_auth=no',
    },
    {
      key: 'ning:forum-member',
      main: '{scheme}://{host}/forum/topic/listForContributor?feed=yes&user={user}&xn_auth=no',
    },
    {
      key: 'ning:forum-group-member',
      main: '{scheme}://{host}/group/{group}/forum/topic/listForContributor?feed=yes&user={user}&xn_auth=no',
      aliases: [
        '{scheme}://{host}/forum/topic/listForContributor?feed=yes&groupUrl={group}&user={user}&xn_auth=no',
      ],
    },
    {
      key: 'ning:forum-tag',
      main: '{scheme}://{host}/forum/topic/listForTag?feed=yes&tag={tag}&xn_auth=no',
    },
    {
      key: 'ning:forum-group-tag',
      main: '{scheme}://{host}/group/{group}/forum/topic/listForTag?feed=yes&tag={tag}&xn_auth=no',
      aliases: [
        '{scheme}://{host}/forum/topic/listForTag?feed=yes&groupUrl={group}&tag={tag}&xn_auth=no',
      ],
    },
    {
      key: 'ning:blog-post-comments',
      main: '{scheme}://{host}/profiles/comment/feed?attachedTo={post}&xn_auth=no',
    },
    {
      key: 'ning:status-comments',
      main: '{scheme}://{host}/profiles/statuscomment/feed?attachedTo={status}&xn_auth=no',
    },
    {
      key: 'ning:album-comments',
      main: '{scheme}://{host}/photo/albumcomment/feed?attachedTo={album}&xn_auth=no',
    },
    {
      key: 'ning:photos-member',
      main: '{scheme}://{host}/photo/photo/listForContributor?rss=yes&screenName={member}&xn_auth=no',
    },
    {
      key: 'ning:videos-member',
      main: '{scheme}://{host}/video/video/listForContributor?rss=yes&screenName={member}&xn_auth=no',
    },
    {
      key: 'ning:videos-tag',
      main: '{scheme}://{host}/video/video/listTagged?rss=yes&tag={tag}&xn_auth=no',
    },
    {
      key: 'ning:event-comments',
      main: '{scheme}://{host}/events/comment/feed?attachedTo={event}&xn_auth=no',
    },
    { key: 'ning:activity-page', main: '{scheme}://{host}/activity/log/rss?sitePageId={page}' },
    { key: 'ning:members', main: '{scheme}://{host}/profiles/friend/feed?xn_auth=no' },
    {
      key: 'ning:members-featured',
      main: '{scheme}://{host}/profiles/friend/feed?featured=1&xn_auth=no',
    },
    {
      key: 'ning:members-category',
      main: '{scheme}://{host}/profiles/friend/feed?category={category}&xn_auth=no',
    },
    { key: 'ning:photos', main: '{scheme}://{host}/photo/photo/rss?xn_auth=no' },
    {
      key: 'ning:photos-featured',
      main: '{scheme}://{host}/photo/photo/listFeatured?rss=yes&xn_auth=no',
    },
    {
      key: 'ning:photos-tag',
      main: '{scheme}://{host}/photo/photo/listTagged?rss=yes&tag={tag}&xn_auth=no',
    },
    {
      key: 'ning:videos',
      main: '{scheme}://{host}/video/video/rss?xn_auth=no',
      aliases: ['{scheme}://{host}/video/video/rss'],
    },
    {
      key: 'ning:videos-featured',
      main: '{scheme}://{host}/video/video/rss?featured=1&xn_auth=no',
    },
    {
      key: 'ning:videos-location',
      main: '{scheme}://{host}/video/video/listForLocation?location={location}&rss=yes&xn_auth=no',
    },
    { key: 'ning:events', main: '{scheme}://{host}/events/event/feed?xn_auth=no' },
    {
      key: 'ning:events-member',
      main: '{scheme}://{host}/events/event/feed?user={user}&xn_auth=no',
    },
    { key: 'ning:groups', main: '{scheme}://{host}/groups/group/feed?xn_auth=no' },
    {
      key: 'ning:groups-featured',
      main: '{scheme}://{host}/groups/group/feed?featured=1&xn_auth=no',
    },
    { key: 'ning:pages', main: '{scheme}://{host}/page/page/list?feed=yes&xn_auth=no' },
    {
      key: 'ning:pages-group',
      main: '{scheme}://{host}/page/page/list?feed=yes&groupUrl={group}&xn_auth=no',
      aliases: ['{scheme}://{host}/group/{group}/page/page/list?feed=yes&xn_auth=no'],
    },
    {
      key: 'ning:pages-member',
      main: '{scheme}://{host}/page/page/listForContributor?feed=yes&user={user}&xn_auth=no',
    },
    { key: 'ning:notes', main: '{scheme}://{host}/notes/index/feed?xn_auth=no' },
    {
      key: 'ning:leaderboard',
      main: '{scheme}://{host}/leaderboards/{type}/{period}?feed=yes&xn_auth=no',
    },
    // Ning 3 networks name their sections, so a section path takes any segments. The group rows
    // go first, and a filtered row before the bare one, so the longer shape wins.
    {
      key: 'ning:group-section-tag',
      main: '{scheme}://{host}/group/{group}/{section*}/feed/tag/{tag}',
    },
    {
      key: 'ning:group-section-tag',
      main: '{scheme}://{host}/groups/{group}/{section*}/feed/tag/{tag}',
    },
    {
      key: 'ning:group-section-category',
      main: '{scheme}://{host}/group/{group}/{section*}/feed/category/{category}',
    },
    {
      key: 'ning:group-section-category',
      main: '{scheme}://{host}/groups/{group}/{section*}/feed/category/{category}',
    },
    {
      key: 'ning:group-section-featured',
      main: '{scheme}://{host}/group/{group}/{section*}/feed/featured',
    },
    {
      key: 'ning:group-section-featured',
      main: '{scheme}://{host}/groups/{group}/{section*}/feed/featured',
    },
    { key: 'ning:group-section', main: '{scheme}://{host}/group/{group}/{section*}/feed/all' },
    { key: 'ning:group-section', main: '{scheme}://{host}/groups/{group}/{section*}/feed/all' },
    { key: 'ning:section-tag', main: '{scheme}://{host}/{section*}/feed/tag/{tag}' },
    { key: 'ning:section-author', main: '{scheme}://{host}/{section*}/feed/by/{user}' },
    { key: 'ning:section-category', main: '{scheme}://{host}/{section*}/feed/category/{category}' },
    { key: 'ning:section-location', main: '{scheme}://{host}/{section*}/feed/at/{location}' },
    { key: 'ning:section-featured', main: '{scheme}://{host}/{section*}/feed/featured' },
    { key: 'ning:section', main: '{scheme}://{host}/{section*}/feed/all' },
  ],
  { hosts: { tenants: domains } },
)

// Ning 3 networks send the same `ning_session` cookie and `x-xn-trace-token` header but serve
// none of these feeds, and only the classic networks load assets from this path.
export const isNingHtml = (content: string): boolean => {
  return content.includes('static.ning.com/socialnetworkmain/')
}

export const parseNingUrl = (url: string): NingUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname } = parsedUrl
  const topic = pathname.match(topicRegex)?.[1]

  if (topic) {
    return { kind: 'topic', topic }
  }

  const groupTopic = pathname.match(groupTopicRegex)?.groups

  if (groupTopic?.group && groupTopic.topic) {
    return { kind: 'topic', topic: groupTopic.topic, group: groupTopic.group }
  }

  const group = pathname.match(groupRegex)?.[1]

  if (group) {
    return { kind: 'group', group }
  }

  return { kind: 'home' }
}

export const ningHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isNingHtml })) {
      return false
    }

    return parseNingUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNingUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    // The featured posts and topics and the member, photo, video, event, group, page and notes
    // lists need no value from the page, so every page builds them after its own feeds.
    if (parsed.kind === 'topic') {
      return [
        page.getFeedEntry('ning:topic', { topic: parsed.topic, group: parsed.group }),
        ...(parsed.group ? [page.getFeedEntry('ning:forum-group', { group: parsed.group })] : []),
        page.getFeedEntry('ning:activity'),
        page.getFeedEntry('ning:blog'),
        page.getFeedEntry('ning:blog-featured'),
        page.getFeedEntry('ning:forum'),
        page.getFeedEntry('ning:forum-featured'),
        page.getFeedEntry('ning:members'),
        page.getFeedEntry('ning:members-featured'),
        page.getFeedEntry('ning:photos'),
        page.getFeedEntry('ning:photos-featured'),
        page.getFeedEntry('ning:videos'),
        page.getFeedEntry('ning:videos-featured'),
        page.getFeedEntry('ning:events'),
        page.getFeedEntry('ning:groups'),
        page.getFeedEntry('ning:groups-featured'),
        page.getFeedEntry('ning:pages'),
        page.getFeedEntry('ning:notes'),
      ]
    }

    if (parsed.kind === 'group') {
      return [
        page.getFeedEntry('ning:forum-group', { group: parsed.group }),
        page.getFeedEntry('ning:activity'),
        page.getFeedEntry('ning:blog'),
        page.getFeedEntry('ning:blog-featured'),
        page.getFeedEntry('ning:forum'),
        page.getFeedEntry('ning:forum-featured'),
        page.getFeedEntry('ning:members'),
        page.getFeedEntry('ning:members-featured'),
        page.getFeedEntry('ning:photos'),
        page.getFeedEntry('ning:photos-featured'),
        page.getFeedEntry('ning:videos'),
        page.getFeedEntry('ning:videos-featured'),
        page.getFeedEntry('ning:events'),
        page.getFeedEntry('ning:groups'),
        page.getFeedEntry('ning:groups-featured'),
        page.getFeedEntry('ning:pages'),
        page.getFeedEntry('ning:notes'),
      ]
    }

    return [
      page.getFeedEntry('ning:activity'),
      page.getFeedEntry('ning:blog'),
      page.getFeedEntry('ning:blog-featured'),
      page.getFeedEntry('ning:forum'),
      page.getFeedEntry('ning:forum-featured'),
      page.getFeedEntry('ning:members'),
      page.getFeedEntry('ning:members-featured'),
      page.getFeedEntry('ning:photos'),
      page.getFeedEntry('ning:photos-featured'),
      page.getFeedEntry('ning:videos'),
      page.getFeedEntry('ning:videos-featured'),
      page.getFeedEntry('ning:events'),
      page.getFeedEntry('ning:groups'),
      page.getFeedEntry('ning:groups-featured'),
      page.getFeedEntry('ning:pages'),
      page.getFeedEntry('ning:notes'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
