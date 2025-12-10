---
prev: Discover Feeds
next: HTML Method
---

# Platform Method

The Platform method generates feed URLs for known platforms using URL pattern matching. It works without HTTP requests by recognizing URL structures specific to each platform.

## How It Works

The Platform method uses handlers for each supported platform:

1. **Pattern Matching** — Each handler checks if the URL matches its platform (e.g., `github.com`, `youtube.com`).
2. **URL Generation** — The matching handler generates feed URLs based on the URL structure.
3. **First Match** — The first matching handler wins; subsequent handlers are skipped.

> [!TIP]
> Even when feeds are discoverable via HTML `<link>` tags, the Platform method is useful because it generates feed URLs directly from the page URL—no HTTP request needed. This makes it faster when you only have a URL and want to avoid fetching the page content first.

## Supported Platforms

### GitHub

Discovers Atom feeds for users, organizations, and repositories.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `github.com/{user}` | User activity feed |
| `github.com/{owner}/{repo}` | Releases, commits, tags |
| `github.com/{owner}/{repo}/wiki` | Wiki changes (+ above) |
| `github.com/{owner}/{repo}/discussions` | Discussions (+ above) |
| `github.com/{owner}/{repo}/tree/{branch}` | Branch commits (+ above) |

### Reddit

Discovers RSS feeds for subreddits, users, and domains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `reddit.com/r/{subreddit}` | Subreddit posts + comments |
| `reddit.com/r/{subreddit}/{sort}` | Sorted posts (hot/new/rising/top) |
| `reddit.com/r/{subreddit}/comments/{id}` | Post comments |
| `reddit.com/u/{username}` | User activity |
| `reddit.com/domain/{domain}` | Domain submissions |

### YouTube

Discovers Atom feeds for channels and playlists. Generates two feed variants for channels: all uploads and videos-only (excludes Shorts).

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `youtube.com/channel/{id}` | Channel feed + videos-only |
| `youtube.com/@{handle}` | Channel feed + videos-only* |
| `youtube.com/user/{name}` | Channel feed + videos-only* |
| `youtube.com/c/{custom}` | Channel feed + videos-only* |
| `youtube.com/playlist?list={id}` | Playlist feed |

\* *Requires HTML content to extract channel ID.*

### Blogspot

Discovers RSS and Atom feeds for Blogspot blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.blogspot.com` | Posts feed (Atom + RSS) |

### Bluesky

Discovers RSS feeds for Bluesky profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `bsky.app/profile/{handle}` | Profile posts feed |

### Kickstarter

Discovers Atom feeds for Kickstarter project updates.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `kickstarter.com/projects/{creator}/{project}` | Project updates feed |

### Substack

Discovers RSS feeds for Substack newsletters.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.substack.com` | Newsletter feed |

### Tumblr

Discovers RSS feeds for Tumblr blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.tumblr.com` | Blog posts feed |

## Basic Usage

```typescript
import { discoverFeeds } from 'feedscout'

const feeds = await discoverFeeds('https://github.com/feedstand/feedstand', {
  methods: ['platform'],
})

// [
//   { url: 'https://github.com/feedstand/feedstand/releases.atom', ... },
//   { url: 'https://github.com/feedstand/feedstand/commits.atom', ... },
//   { url: 'https://github.com/feedstand/feedstand/tags.atom', ... },
// ]
```

## Configuration

### Handler Order

Handlers are checked in order. The first matching handler generates the feeds:

```typescript
import { githubHandler, youtubeHandler } from 'feedscout/platform'

const feeds = await discoverFeeds(url, {
  methods: {
    platform: {
      handlers: [youtubeHandler, githubHandler, redditHandler],
    },
  },
})
```

## Default Values

Import the default Platform options:

```typescript
import { defaultPlatformOptions } from 'feedscout/platform'
```

Or import individual handlers:

```typescript
import {
  blogspotHandler,
  blueskyHandler,
  githubHandler,
  kickstarterHandler,
  redditHandler,
  substackHandler,
  tumblrHandler,
  youtubeHandler,
} from 'feedscout/platform'
```

## Using Directly

Use the Platform discovery function directly to get URIs without validation:

```typescript
import { discoverUrisFromPlatform } from 'feedscout/platform'

const uris = discoverUrisFromPlatform(htmlContent, {
  baseUrl: 'https://www.youtube.com/@mkbhd',
  handlers: [youtubeHandler],
})

// [
//   'https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ',
//   'https://www.youtube.com/feeds/videos.xml?playlist_id=UULFBJycsmduvYEL83R_U4JriQ',
// ]
```

> [!NOTE]
> The YouTube handler requires HTML content for `@handle`, `/user/`, and `/c/` URLs to extract the channel ID. For `/channel/UC...` URLs, no content is needed.

## Creating Custom Handlers

You can create handlers for platforms not included by default.

### Handler Interface

A `PlatformHandler` has two methods:

```typescript
type PlatformHandler = {
  match: (url: string) => boolean
  resolve: (url: string, content?: string) => Array<string>
}
```

| Method | Description |
|--------|-------------|
| `match(url)` | Returns `true` if this handler should process the URL |
| `resolve(url, content?)` | Returns an array of feed URLs for the given page URL |

### Basic Example

A handler that appends `/feed.xml` to any URL on a specific domain:

```typescript
import type { PlatformHandler } from 'feedscout/platform'

const myHandler: PlatformHandler = {
  match: (url) => {
    return new URL(url).hostname === 'example.com'
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [`${origin}/feed.xml`]
  },
}
```

### Using URL Patterns

A handler that extracts a username from the URL path:

```typescript
const profileHandler: PlatformHandler = {
  match: (url) => {
    const { hostname, pathname } = new URL(url)

    return hostname === 'example.com' && pathname.startsWith('/users/')
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const match = pathname.match(/^\/users\/([^/]+)/)

    if (match?.[1]) {
      return [`${origin}/users/${match[1]}/feed.rss`]
    }

    return []
  },
}
```

### Using Page Content

When feed URLs can only be found in the HTML, use the `content` parameter:

```typescript
const contentHandler: PlatformHandler = {
  match: (url) => new URL(url).hostname === 'example.com',

  resolve: (url, content) => {
    if (!content) {
      return []
    }

    const match = content.match(/data-feed-url="([^"]+)"/)

    return match?.[1] ? [match[1]] : []
  },
}
```

### Combining with Defaults

Add custom handlers alongside the built-in ones:

```typescript
import { defaultPlatformOptions } from 'feedscout/platform'

const feeds = await discoverFeeds(url, {
  methods: {
    platform: {
      handlers: [myHandler, ...defaultPlatformOptions.handlers],
    },
  },
})
```
