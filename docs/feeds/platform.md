---
title: "Discover Feeds: Platform Method"
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

## Hints

Platform handlers attach a `hint` to each feed URI they generate. Hints provide a machine-readable `key` and a human-readable `label` that describe what type of feed the URI represents (e.g., "All uploads", "Videos only", "Shorts only"). This is useful when a single URL generates multiple feed variants and you need to let users pick the right one, especially for feeds that don't include a descriptive title.

Hints are propagated to the final [`DiscoverResult`](/reference/types#discoverresult) objects returned by `discoverFeeds`. Results from non-platform methods (HTML, headers, guess) do not include hints.

```typescript
type DiscoverUriHint = {
  key: string    // e.g., 'youtube:all', 'youtube:videos'
  label: string  // e.g., 'All uploads', 'Videos only'
}
```

## Supported Platforms

### Apple Podcasts

Discovers RSS feeds for Apple Podcasts shows by extracting the feed URL from the page content.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `podcasts.apple.com/{locale}/podcast/{name}/id{id}` | Podcast feed* |

\* *Requires HTML content to extract feed URL.*

### YouTube

Discovers Atom feeds for channels and playlists. Generates four feed variants for channels: all uploads, videos-only, shorts-only, and live streams-only.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `youtube.com/channel/{id}` | All uploads + videos-only + shorts-only + live streams-only |
| `youtube.com/@{handle}` | All uploads + videos-only + shorts-only + live streams-only* |
| `youtube.com/user/{name}` | All uploads + videos-only + shorts-only + live streams-only* |
| `youtube.com/c/{custom}` | All uploads + videos-only + shorts-only + live streams-only* |
| `youtube.com/watch?v={id}` | All uploads + videos-only + shorts-only + live streams-only* |
| `youtu.be/{id}` | All uploads + videos-only + shorts-only + live streams-only* |
| `youtube.com/playlist?list={id}` | Playlist feed |

\* *Requires HTML content to extract channel ID.*

### Reddit

Discovers RSS feeds for subreddits, users, multireddits, and domains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `reddit.com` | Homepage feed |
| `reddit.com/r/{subreddit}` | Subreddit posts + comments |
| `reddit.com/r/{subreddit}/{sort}` | Sorted posts (hot/new/rising/top) |
| `reddit.com/r/{subreddit}/comments/{id}` | Post comments |
| `reddit.com/u/{username}` | User activity |
| `reddit.com/user/{username}/m/{multireddit}` | Multireddit feed |
| `reddit.com/domain/{domain}` | Domain submissions |

### Medium

Discovers RSS feeds for Medium user profiles, publications, tags, and subdomains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `medium.com/@{username}` | User posts feed |
| `medium.com/{publication}` | Publication feed |
| `medium.com/tag/{tag}` | Tag feed |
| `medium.com/{publication}/tagged/{tag}` | Tagged publication feed |
| `*.medium.com` | Subdomain publication feed |
| `*.medium.com/tagged/{tag}` | Subdomain tagged feed |

### Substack

Discovers RSS feeds for Substack newsletters.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.substack.com` | Newsletter feed |
| `substack.com/@{user}` | Newsletter feed |

### WordPress.com

Discovers RSS and Atom feeds for WordPress.com blogs, with category, tag, and author support.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.wordpress.com` | Posts feed (RSS + Atom + RDF) + comments |
| `*.wordpress.com/category/{category}` | Category feed (+ above) |
| `*.wordpress.com/tag/{tag}` | Tag feed (+ above) |
| `*.wordpress.com/author/{author}` | Author feed (+ above) |

### WP Engine

Discovers feeds for WP Engine-hosted WordPress sites. Uses the same feed structure as [WordPress.com](#wordpresscom).

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.wpenginepowered.com` | Same as WordPress.com |
| `*.wpengine.com` | Same as WordPress.com (legacy domain) |

### Blogspot

Discovers RSS and Atom feeds for Blogspot blogs, including label, comments, summary, and per-post comments feeds. Also matches country-coded TLDs (`*.blogspot.co.uk`, `*.blogspot.de`, etc.).

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.blogspot.com` | Posts feed (Atom + RSS) + summary (Atom + RSS) + comments (Atom + RSS) |
| `*.blogspot.com/search/label/{label}` | Label feed (Atom + RSS) + above |
| `*.blogspot.com/{year}/{month}/{slug}.html` | Post comments feed (Atom + RSS)* + above |

\* *Requires HTML content to extract the post ID.*

### DEV.to

Discovers RSS feeds for DEV.to user profiles, tags, the global community, and the latest sort.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `dev.to` | Community feed |
| `dev.to/latest` | Latest sort feed |
| `dev.to/{username}` | User posts feed |
| `dev.to/t/{tag}` | Tag posts feed |

### Lobsters

Discovers RSS feeds for Lobsters homepage, users, tags, and domains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `lobste.rs` | Homepage feed |
| `lobste.rs/newest` | Newest posts feed |
| `lobste.rs/top` | Top stories feed |
| `lobste.rs/top/{period}` | Top stories by period (1d/3d/1w/1m/1y) |
| `lobste.rs/comments` | Site-wide comments feed |
| `lobste.rs/~{username}` | User stories feed |
| `lobste.rs/t/{tag}` | Tag feed |
| `lobste.rs/t/{tag1},{tag2}` | Multi-tag feed |
| `lobste.rs/domains/{domain}` | Domain feed |

### Goodreads

Discovers RSS feeds for Goodreads user activity and bookshelves.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `goodreads.com/user/show/{id}` | User updates + reviews |
| `goodreads.com/review/list/{id}` | Reviews + user updates |

### GitHub

Discovers Atom feeds for users, organizations, and repositories.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `github.com/{user}` | User activity feed |
| `github.com/{owner}/{repo}` | Releases, commits, tags |
| `github.com/{owner}/{repo}/wiki` | Wiki changes (+ above) |
| `github.com/{owner}/{repo}/discussions` | Discussions (+ above) |
| `github.com/{owner}/{repo}/tree/{branch}` | Branch commits (+ above) |
| `github.com/{owner}/{repo}/blob/{branch}/{path}` | File commits (+ above) |
| `github.com/{owner}/{repo}/commits/{branch}/{path}` | File commits (+ above) |

### GitHub Gist

Discovers Atom feeds for GitHub Gist users, starred gists, forks, and the discover stream.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `gist.github.com/{username}` | User gists feed |
| `gist.github.com/{username}/{gist-id}` | User gists feed |
| `gist.github.com/{username}/starred` | User starred gists feed |
| `gist.github.com/{username}/forks` | User forks feed |
| `gist.github.com/discover` | Discover gists feed |

### Gitea

Discovers RSS feeds for Gitea users, repositories, releases, tags, and branch commits. Codeberg and `gitea.com` are matched by host; any other instance is matched by the session cookie Gitea sets on a repository page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/{user}` | User activity feed |
| `{instance}/{user}/{repo}` | Releases, tags, activity |
| `{instance}/{user}/{repo}/src/branch/{branch}` | Branch commits (+ above) |
| `{instance}/{user}/{repo}/src/branch/{branch}/{path}` | File history (+ above) |

> [!NOTE]
> The branch commits and file history feeds are emitted only on `gitea.com`, because Forgejo removed that route. A self-hosted Forgejo instance sets no cookie on an anonymous request and is not matched; Codeberg, which runs Forgejo, is covered by the host list.

### GitLab

Discovers Atom feeds for GitLab users and repositories. Self-hosted instances are detected via the `og:site_name` HTML meta tag or the `X-Gitlab-Meta` response header, on project paths only: `/{group}/{project}` or any path containing `/-/`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `gitlab.com/{user}` | User activity feed |
| `gitlab.com/{project}` | Releases, tags, issues, merge requests, activity |
| `gitlab.com/{project}/-/commits/{branch}` | Branch commits feed (+ above) |
| `gitlab.com/{project}/-/tree/{branch}` | Branch commits feed (+ above) |

> `{project}` is the full path and can be any depth, because groups nest: `group/subgroup/project` is one project. GitLab puts `/-/` between the project path and the feature path, which is where the split happens.

### Product Hunt

Discovers RSS feeds for Product Hunt homepage, topics, and categories.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `producthunt.com` | Homepage feed |
| `producthunt.com/topics/{topic}` | Topic feed |
| `producthunt.com/categories/{category}` | Category feed |

### Pinterest

Discovers RSS feeds for Pinterest user profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `pinterest.com/{username}` | User pins feed |

### Dailymotion

Discovers RSS feeds for Dailymotion users, playlists, channels, and the global trending feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `dailymotion.com/{username}` | User videos feed |
| `dailymotion.com/playlist/{id}` | Playlist feed |
| `dailymotion.com/channel/{name}` | Channel feed |
| `dailymotion.com` or `dailymotion.com/trending` | Trending feed |

### DeviantArt

Discovers RSS feeds for DeviantArt user portfolios, gallery folders, favourites, and tags.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `deviantart.com/{username}` | User deviations feed |
| `deviantart.com/{username}/gallery` | User gallery feed |
| `deviantart.com/{username}/gallery/{id}` | Gallery folder feed |
| `deviantart.com/{username}/favourites` | User favourites feed |
| `deviantart.com/tag/{tag}` | Tag feed |

### Mastodon

Discovers RSS feeds for Mastodon user profiles and hashtag pages. Detects Mastodon instances via the `<meta name="generator">` HTML tag, the `<div id="mastodon">` app root or the `Server` response header. There is no hardcoded instance list.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/@{username}` | User posts feed |
| `{instance}/@{username}/tagged/{tag}` | User posts tagged feed |
| `{instance}/@{username}/with_replies` | User posts with replies feed |
| `{instance}/@{username}/media` | User media-only feed |
| `{instance}/tags/{tag}` | Hashtag feed |

> [!NOTE]
> Requires page content or response headers to detect Mastodon instances. Works with any Mastodon-compatible server, not just well-known instances.

### Bluesky

Discovers RSS feeds for Bluesky profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `bsky.app/profile/{handle}` | Profile posts feed |

### Tumblr

Discovers RSS feeds for Tumblr blogs and tagged posts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.tumblr.com` | Blog posts feed |
| `*.tumblr.com/tagged/{tag}` | Tagged posts feed |

### Behance

Discovers RSS feeds for Behance user portfolios and appreciated works, plus the homepage Featured-projects and Featured-by-Adobe gallery feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `behance.net` or `behance.net/galleries` | Featured projects + Featured by Adobe |
| `behance.net/{username}` | User portfolio feed |
| `behance.net/{username}/appreciated` | User appreciated feed |

### SoundCloud

Discovers RSS feeds for SoundCloud user profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `soundcloud.com/{user}` | User sounds feed* |

\* *Requires HTML content to extract user ID.*

### Vimeo

Discovers RSS feeds for Vimeo user profiles, channels, groups, and albums (showcases).

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `vimeo.com/{user}` | User videos feed |
| `vimeo.com/{user}/likes` | User likes feed (+ videos) |
| `vimeo.com/channels/{channel}` | Channel feed |
| `vimeo.com/groups/{group}` | Group feed |
| `vimeo.com/album/{id}` | Album/showcase feed |

### SourceForge

Discovers RSS feeds for SourceForge project activity, file releases, news, and discussion.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `sourceforge.net/projects/{project}` or `sourceforge.net/p/{project}` | Activity + files + news (RSS + Atom) + discussion |

### Kickstarter

Discovers Atom feeds for Kickstarter projects and global new projects.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `kickstarter.com` | Global new projects feed |
| `kickstarter.com/discover` | Global new projects feed |
| `kickstarter.com/projects/{creator}/{project}` | Project updates feed |

### Letterboxd

Discovers RSS feeds for Letterboxd user profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `letterboxd.com/{username}` | User diary feed |

### Steam

Discovers RSS feeds for Steam game news and community groups.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `store.steampowered.com/app/{id}` | Game news feed |
| `store.steampowered.com/news/app/{id}` | Game news feed |
| `steamcommunity.com/app/{id}` | Game news feed |
| `steamcommunity.com/groups/{name}` | Group RSS feed |

### Stack Exchange

Discovers RSS feeds for Stack Overflow, Server Fault, Super User, Ask Ubuntu, MathOverflow, Stack Apps, and all `*.stackexchange.com` sites.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}` | Site-wide newest questions feed |
| `{site}/questions/tagged/{tag}` | Tag feed |
| `{site}/questions/{id}` | Question feed |
| `{site}/users/{id}` | User feed |
| `{site}/collectives/{name}` | Collective feed |

> [!NOTE]
> Tag feeds accept `?sort={newest|active|votes|creation|hot|week|month}` (also `?tab=…`) — the value is passed through to the generated feed URL when it matches one of the allowed sorts. Unknown values are silently dropped.

### Hashnode

Discovers RSS feeds for Hashnode blogs on `*.hashnode.dev`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.hashnode.dev` | Blog feed |

### Paragraph

Discovers RSS feeds for Paragraph blogs (successor to Mirror.xyz).

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `paragraph.com/@{username}` | Blog feed |

### Hatena Blog

Discovers RSS and Atom feeds for Hatena Blog on `*.hatenablog.com`, `*.hatenablog.jp`, and `*.hateblo.jp`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.hatenablog.com` | Posts feed (RSS + Atom) |
| `*.hatenablog.jp` | Posts feed (RSS + Atom) |
| `*.hateblo.jp` | Posts feed (RSS + Atom) |
| `*/archive/category/{category}` | Category feed (RSS + Atom) + posts |
| `*/archive/author/{author}` | Author feed (RSS + Atom) + posts |

### Itch.io

Discovers RSS feeds for Itch.io games, creators, devlogs, and browse pages.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{creator}.itch.io/{game}` | Game devlog feed |
| `{creator}.itch.io` | Creator's games feed |
| `itch.io/games` | Games feed |
| `itch.io/games/by-{username}` | Creator's games feed |
| `itch.io/games/tag-{tag}` | Tag feed |
| `itch.io/games/{sort}` | Sorted games feed (newest/top-rated/top-sellers/on-sale) |
| `itch.io/{section}` | Section feed (tools/game-assets/soundtracks/physical-games/books/comics/misc) |
| `itch.io/devlogs` | All devlogs feed |
| `itch.io` | Featured + new + sales feeds + itch.io blog |

### CSDN

Discovers RSS feeds for CSDN user blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `blog.csdn.net/{username}` | Blog feed |

### Douban

Discovers RSS feeds for Douban user interests, reviews, notes, and subject reviews.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `www.douban.com/people/{user}` | Interests + reviews + notes |
| `{subdomain}.douban.com/subject/{id}` | Subject reviews |
| `www.douban.com` | Book + movie + music + drama reviews |

### V2EX

Discovers Atom feeds for V2EX index, nodes, members, and tabs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `v2ex.com` | Index feed |
| `v2ex.com/go/{node}` | Node feed |
| `v2ex.com/member/{username}` | Member feed |
| `v2ex.com/?tab={tab}` | Tab feed |

### Ximalaya

Discovers RSS feeds for Ximalaya podcast albums.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `www.ximalaya.com/album/{id}` | Album feed |

### Write.as

Discovers RSS feeds for Write.as blogs, including tag feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `write.as/{user}` | Blog feed |
| `write.as/{user}/tag:{tag}` | Tag feed + blog |
### Prose.sh

Discovers Atom feeds for Prose.sh blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.prose.sh` | Blog feed |
### Pagecord

Discovers RSS feeds for Pagecord blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.pagecord.com` | Blog feed |
### ArtStation

Discovers RSS feeds for ArtStation portfolios and the global artwork feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `artstation.com/{user}` | Portfolio feed |
| `{user}.artstation.com` | Portfolio feed |
| `artstation.com/artwork` | Artwork + Artwork (Trending) |

### Bear Blog

Discovers Atom and RSS feeds for Bear Blog, including tag-filtered feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.bearblog.dev` | Posts feed (Atom + RSS) |
| `*.bearblog.dev/?q={tag}` | Tag feed (Atom + RSS) + posts |

### Buttondown

Discovers RSS feeds for Buttondown newsletters.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `buttondown.com/{user}` | Newsletter feed |

### Dreamwidth

Discovers RSS and Atom feeds for Dreamwidth blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.dreamwidth.org` | Posts feed (RSS + Atom) |

### Excite Blog

Discovers RSS and Atom feeds for Excite Blog, including category feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.exblog.jp` | Posts feed (RSS + Atom) |
| `*.exblog.jp/i{N}` | Category feed (RSS + Atom) + posts |

### Fireside.fm

Discovers RSS and JSON feeds for Fireside.fm-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.fireside.fm` | Podcast feed (RSS + JSON) |

### Hacker News

Discovers RSS feeds for Hacker News.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `news.ycombinator.com` | Front page feed (RSS) |
| `news.ycombinator.com/show` | Show HN feed (RSS) |

### Listed

Discovers RSS feeds for Listed (Standard Notes) blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `listed.to/@{user}` | Blog feed |

### MyAnimeList

Discovers RSS feeds for MyAnimeList user lists and site-wide news.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `myanimelist.net/profile/{user}` | Anime list, Manga list, Recently watched, Recently read (RSS) |
| `myanimelist.net/animelist/{user}` | (same as above) |
| `myanimelist.net/mangalist/{user}` | (same as above) |
| `myanimelist.net/history/{user}` | (same as above) |
| `myanimelist.net/news` | Site-wide news feed |

### Nebula

Discovers RSS feeds for Nebula channels, the global video feed, and category feeds, each with a Plus-only variant.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `nebula.tv/{channel}` | Videos + Videos (Plus) |
| `nebula.tv` | All videos + All videos (Plus) |
| `nebula.tv/videos` | All videos + All videos (Plus) |
| `nebula.tv/videos?category={slug}` | Category + Category (Plus) + above |

### note.com

Discovers RSS feeds for note.com, including hashtag and magazine feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `note.com/{user}` | Blog feed |
| `note.com/hashtag/{tag}` | Hashtag feed |
| `note.com/{user}/m/{magazineId}` | Magazine feed |

### Odysee

Discovers RSS feeds for Nebula channels, the global video feed, and category feeds, each with a Plus-only variant.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `nebula.tv/{channel}` | Videos + Videos (Plus) |
| `nebula.tv` | All videos + All videos (Plus) |
| `nebula.tv/videos` | All videos + All videos (Plus) |
| `nebula.tv/videos?category={slug}` | Category + Category (Plus) + above |

### Odysee

Discovers RSS feeds for Odysee channels.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `odysee.com/@{channel}:{id}` | Videos feed |

### Tistory

Discovers RSS feeds for Tistory blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.tistory.com` | Blog feed |

### Transistor

Discovers RSS feeds for Transistor-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.transistor.fm` | Podcast feed |

### Velog

Discovers RSS feeds for Velog users and the platform-wide trending feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `velog.io/@{user}` | Posts feed |
| `velog.io` | Trending posts feed |

### Acast

Discovers RSS feeds for Acast-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `shows.acast.com/{slug}` | Podcast feed (RSS) |

### Ameba Blog

Discovers RSS, Atom, and RDF feeds for Ameba Blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `ameblo.jp/{user}` | Posts feed (RSS + Atom + RDF) |

### Are.na

Discovers RSS feeds for Are.na user profiles and channels.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `are.na/{user}` | User profile feed |
| `are.na/{user}/{channel}` | Channel feed |

### Audioboom

Discovers RSS feeds for Audioboom channels.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `audioboom.com/channels/{id}` | Podcast feed (RSS) |

### BookWyrm

Discovers RSS feeds for BookWyrm user activity, reviews, quotes, comments, and per-shelf feeds. Detected by the `BookWyrm` generator meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/user/{user}` | Activity + reviews + quotes + comments (RSS) |
| `{instance}/user/{user}/(shelf\|books)/{shelf-id}` | Shelf feed (RSS) + activity/reviews/quotes/comments |

### Buzzsprout

Discovers RSS feeds for Buzzsprout-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `buzzsprout.com/{id}` | Podcast feed |

### Discourse

Discovers RSS feeds for Discourse forums. Detected by the `Discourse` generator meta tag, the `data-discourse-setup` meta tag or the `X-Discourse-Route` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/u/{user}` | User activity feed (RSS) |
| `{instance}/c/{slug}` | Category feed (RSS) |
| `{instance}/t/{slug}/{id}` | Topic feed (RSS) |
| `{instance}/top` or `/top/{period}` | Top topics feed (RSS) |
| `{instance}/` (or any other path) | Latest topics feed + latest posts feed (RSS) |

> [!NOTE]
> The top topics feed accepts `{daily|weekly|monthly|quarterly|yearly|all}` via either the `/top/{period}` path or `?period={period}` query param. Unknown values are silently dropped.

### Friendica

Discovers Atom feeds for Friendica user profiles. Detected by the `Friendica` generator meta tag or the `X-Friendica-Version` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/profile/{user}` | Posts feed (Atom) + comments-only feed (Atom) |

### Ghost

Discovers RSS feeds for Ghost-hosted blogs, including tag and author feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.ghost.io` | Blog feed |
| `*.ghost.io/tag/{slug}` | Tag feed + blog |
| `*.ghost.io/author/{slug}` | Author feed + blog |

### Hearthis.at

Discovers RSS feeds for Hearthis.at user profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `hearthis.at/{user}` | Tracks feed |

### HEY World

Discovers Atom feeds for HEY World blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `world.hey.com/{user}` | Blog feed |

### InsaneJournal

Discovers RSS and Atom feeds for InsaneJournal journals.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.insanejournal.com` | Posts feed (RSS + Atom) |

### Libsyn

Discovers RSS feeds for Libsyn-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{slug}.libsyn.com` | Podcast feed |
| `feeds.libsyn.com/{showId}` | Podcast feed |

### LiveJournal

Discovers RSS and Atom feeds for LiveJournal blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.livejournal.com` | Posts feed (RSS + Atom) |

### Mataroa

Discovers RSS feeds for Mataroa blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.mataroa.blog` | Blog feed |

### Micro.blog

Discovers RSS, JSON, and podcast feeds for Micro.blog-hosted blogs, including category, archive, photos, and replies feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.micro.blog` | Posts (RSS + JSON) + podcast |
| `*.micro.blog/categories/{slug}` | Category (RSS + JSON) + above |
| `*.micro.blog/archive` | Archive feed + above |
| `*.micro.blog/photos` | Photos feed + above |
| `*.micro.blog/replies` | Replies feed + above |

### Misskey

Discovers Atom, RSS, and JSON feeds for Misskey and Sharkey user profiles. Detected by the `Misskey` or `Sharkey` application-name meta tag, or the `misskey_meta` script tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/@{user}` | Posts feed (Atom + RSS + JSON) |

### Naver Blog

Discovers RSS feeds for Naver Blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `blog.naver.com/{id}` | Blog feed |
| `m.blog.naver.com/{id}` | Blog feed |

### Observable

Discovers RSS feeds for Observable user notebooks and collections.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `observablehq.com/@{user}` | Notebooks feed |
| `observablehq.com/@{user}/collection/{slug}` | Collection feed |

### Pika

Discovers Atom and RSS feeds for Pika blogs, including tag feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.pika.page` | Posts feed (Atom + RSS) |
| `*.pika.page/tag/{tag}` | Tag feed (Atom + RSS) + posts |

### Pixelfed

Discovers Atom feeds for Pixelfed user profiles. Detected by the `pixelfed` generator meta tag or the `Pixelfed` application-name meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/{user}` or `{instance}/users/{user}` | Posts feed (Atom) |

### Pleroma

Discovers Atom feeds for Pleroma (and Akkoma) user profiles. Detected by Pleroma-specific API endpoint references in HTML.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/users/{user}` | Posts feed (Atom) |

### Podbean

Discovers RSS feeds for Podbean-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.podbean.com` | Podcast feed |

### Podigee

Discovers RSS feeds for Podigee-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.podigee.io` | Podcast feed (RSS) |

### Posthaven

Discovers Atom feeds for Posthaven blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.posthaven.com` | Posts feed (Atom) |

### Qiita

Discovers Atom feeds for Qiita users, tags, organizations, and popular items.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `qiita.com/{user}` | User posts feed |
| `qiita.com/tags/{tag}` | Tag feed |
| `qiita.com/organizations/{org}` | Organization feed |
| `qiita.com/popular-items` | Popular items feed |

### RSS.com

Discovers RSS feeds for RSS.com-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `rss.com/podcasts/{slug}` | Podcast feed |

### Seesaa Blog

Discovers RSS 2.0 and RDF feeds for Seesaa Blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.seesaa.net` | Posts feed (RSS 2.0 + RDF) |

### Spreaker

Discovers RSS feeds for Spreaker-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `spreaker.com/podcast/{slug}--{id}` | Podcast feed |

### Tildes

Discovers RSS and Atom feeds for Tildes homepage and groups.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `tildes.net` | Topics feed (RSS + Atom) |
| `tildes.net/~{group}` | Group feed (RSS + Atom) |

### weblog.lol

Discovers RSS, Atom, and JSON feeds for weblog.lol blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.weblog.lol` | Posts feed (RSS + Atom + JSON) |

### Weebly

Discovers RSS feeds for Weebly-hosted blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.weebly.com` | Blog feed |
| `*.weebly.com/{slug}` | Blog feed (custom page slug) |

### Zenn

Discovers RSS feeds for Zenn users, topics, publications, and the platform-wide trending feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `zenn.dev/{user}` | User posts feed |
| `zenn.dev/topics/{topic}` | Topic feed |
| `zenn.dev/p/{pub}` | Publication feed |
| `zenn.dev/publications/{pub}` | Publication feed |
| `zenn.dev` | Trending posts feed |

### BitChute

Discovers RSS feeds for BitChute channels. Channel pages carry only an oEmbed link, so nothing finds these without the handler.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `bitchute.com/channel/{slug}` | Channel feed (RSS) |

> [!NOTE]
> The feed endpoint accepts only the vanity slug that appears in the channel URL. A channel's internal id returns 404.

### Confluence

Discovers the Atom activity streams of a Confluence Data Center site. Detected by the `confluence-base-url` meta tag, with the context path and space key read from the page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page on a space | Space stream + site stream (Atom) |
| Any other page | Site stream (Atom) |

> [!NOTE]
> Confluence Cloud is not supported. It renders client-side, serves no `confluence-*` meta tag, and its stream needs a session.

### diaspora*

Discovers the Atom feed of a diaspora* profile. Detected by the `Diaspora.Page` global.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{pod}/u/{user}` | Posts feed (Atom) |
| `{pod}/public/{user}` | Posts feed (Atom) |

### Jira

Discovers the Atom activity streams of a Jira site. Cloud is detected by the `atlassian.net` host, Data Center by the `ajs-base-url` meta tag together with a Jira path.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{base}/browse/{KEY}-{n}` | Project stream + site stream (Atom) |
| `{base}/projects/{KEY}` | Project stream + site stream (Atom) |
| Any other Jira page | Site stream (Atom) |

> [!NOTE]
> Bitbucket Server ships the same meta tag and uses `/projects/{KEY}/repos/`, which is excluded. Confluence under `/wiki/` on a Cloud site is excluded too.

### Neocities

Discovers the RSS feed of a Neocities site. The feed is served from `neocities.org`, not from the site's own host, and lists file updates rather than posts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{user}.neocities.org` | Site updates feed (RSS) |
| `neocities.org/site/{user}` | Site updates feed (RSS) |

> [!NOTE]
> A site served on a custom domain carries no username, so it is not matched.

### OpenStatus

Discovers the incident feeds of an OpenStatus status page. Detected by the `/api/status/summary.json` link the page carries, or by its generated preview image.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any status page | Updates feed (RSS + Atom) |

### Postype

Discovers RSS feeds for Postype channels. Channel pages carry no feed link.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `postype.com/@{id}` | Posts feed (RSS) |
| `{id}.postype.com` | Posts feed (RSS) |

### Sourcehut

Discovers the commit and ref feeds of a Sourcehut repository. Repository pages carry no feed link.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `git.sr.ht/~{user}/{repo}` | Commits feed + refs feed (RSS) |

### Squarespace

Discovers the RSS feed of a Squarespace collection. Detected by the `Server: Squarespace` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/{collection}` | Collection feed (RSS) |

> [!NOTE]
> The collection slug is operator-chosen, commonly `blog`, `news` or `journal`, so it is taken from the first path segment. The site root is not matched: it answers `?format=rss` with a 400.

### Wikidot

Discovers the site and forum feeds of a Wikidot wiki. Detected by the `application/wiki` edit link, so custom domains are covered as well as `*.wikidot.com` hosts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any wiki page | Site changes feed + forum threads feed (RSS) |
### Drupal

Discovers the site feed of a Drupal site. Detected by the `Generator` meta tag or the `X-Generator` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Site feed (RSS) |

> [!NOTE]
> Both signals are Drupal 8 and later, and a site builder can disable the `/rss.xml` view, so treat the feed as a probe.

### Shopify

Discovers the Atom feed of a Shopify store's blog. Detected by the `Powered-By` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{store}/blogs/{handle}` | Blog feed (Atom) |

> [!NOTE]
> There is no store-wide feed, so the blog handle is required. A missing blog answers 404 with an Atom content type and an empty body.

### HubSpot

Discovers the RSS feed of a HubSpot blog. Detected by the `HubSpot` generator meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/{blog-path}` | Blog feed (RSS) |

> [!NOTE]
> The feed hangs off the blog path, never the host root, which answers 404.

### Publii

Discovers the feeds of a Publii-built site. Detected by the `Publii` generator meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Posts feed (Atom) + JSON Feed |

> [!NOTE]
> `/feed.xml` is Atom despite the name, and the theme decides whether either file is linked.

### Wix

Discovers the blog feed of a Wix site. Detected by the `Wix.com` generator meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Blog feed (RSS) |

> [!NOTE]
> The feed sits at the site root wherever the blog appears in navigation, and only sites with the Wix Blog app installed have it.

### Joomla

Discovers the feed forms of a Joomla list view. Detected by the `Joomla!` generator meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any list view | View feed (RSS + Atom) |

> [!NOTE]
> Only list views produce a feed. A non-list view answers 404 as `application/xml` with an `<error>` root. The `.feed` suffix is used rather than `?format=feed`, because a search-engine friendly path ends in `.html` and answers that query with the HTML page.

### WriteFreely

Discovers the feeds of a WriteFreely blog. Detected by the `WriteFreely` generator meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/{blog}` | Blog feed + instance reader feed (RSS) |

> [!NOTE]
> The trailing slash is required and `{instance}/feed/` answers 404. The generator meta tag appears on blog pages and is often missing from the instance root.

### Svbtle

Discovers the Atom feed of a Svbtle blog. Detected by the `Svbtle.com` generator meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page on a blog host | Posts feed (Atom) |

> [!NOTE]
> `svbtle.com` itself is excluded: its `/feed` answers 200 with an HTML discovery page, and the `svbtle.com/{user}/feed` form does not exist.

### Textpattern

Discovers the feeds of a Textpattern site. Detected by the `Textpattern` generator meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Posts feed (RSS + Atom) |

### Grav

Discovers the feed forms of a Grav listing page. Detected by the `GravCMS` generator meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any listing page | Page feed (RSS + Atom) |

> [!NOTE]
> The generator value is matched in full, because the meta content is compared as a prefix and `Grav` alone also matches Gravity Forms.

### Mailchimp

Discovers the RSS feed of a Mailchimp campaign archive.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{dc}.campaign-archive.com/?u={u}&id={id}` | Archive feed (RSS) |

> [!NOTE]
> The datacentre prefix and both ids come from the input URL; none of them can be derived.

### Discuz!

Discovers the feeds of a Discuz! board. Detected by the `Discuz!` generator meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{board}/forum-{fid}-1.html` | Board feed + site feed (RSS) |
| Any other page | Site feed (RSS) |

> [!NOTE]
> Many installs gate the feed behind a login and answer with an HTML notice at status 200, so the body is what decides.

### XenForo

Discovers the feeds of a XenForo board. Detected by the `XF` or `XenForo` id on the html element.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{board}/f/{slug}.{id}` | Forum feed + site feed (RSS) |
| Any other page | Site feed (RSS) |

> [!NOTE]
> A missing forum answers with an XML error document rather than HTML, so a check for well-formed XML passes on a 404.

### FC2 Blog

Discovers the RSS feed of an FC2 blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{user}.blog.fc2.com` | Posts feed (RSS) |
| `{user}.blog{n}.fc2.com` | Posts feed (RSS) |

> [!NOTE]
> The canonical host redirects to a numbered host from the old sharding scheme, so both shapes are matched and the feed is built from whichever host answers.

### Togetter

Discovers the feeds of a Togetter curator or the site-wide popular feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `togetter.com/id/{user}` | Curator feed + popular feed (RSS) |
| Any other page | Popular feed (RSS) |

### Syosetu

Discovers the Atom feed of a Syosetu author.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `mypage.syosetu.com/{writerId}` | Author feed (Atom) |

> [!NOTE]
> There is no per-work feed, and a novel URL carries an ncode rather than the numeric writer id, so only an author page resolves.

### Cnblogs

Discovers the feed of a Cnblogs blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `cnblogs.com/{user}` | Posts feed |

> [!NOTE]
> The response says RSS while the document is Atom, and the body opens with a byte order mark before the XML declaration.

### Homeland

Discovers the feeds of a Homeland forum. Detected by the `Homeland` generator meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/topics/node{id}` | Node feed + topics feed (RSS) |
| Any other page | Topics feed (RSS) |

### LearnKu

Discovers the feeds of a LearnKu community.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `learnku.com/{community}` | Community feed + site feed (RSS) |
| Any other page | Site feed (RSS) |

### Habr

Discovers the feeds of a Habr hub, user or company, plus the site articles feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `habr.com/{lang}/hubs/{hub}` | Hub feed + articles feed (RSS) |
| `habr.com/{lang}/users/{user}` | User feed + articles feed (RSS) |
| `habr.com/{lang}/companies/{company}` | Company feed + articles feed (RSS) |
| Any other page | Articles feed (RSS) |

> [!NOTE]
> The language segment is taken from the page URL and every one of these paths needs its trailing slash.

### phpBB

Discovers the feeds of a phpBB board. Detected by the `phpbb` body id.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{board}/viewforum.php?f={id}` | Forum feed + board feed (RSS) |
| Any other page | Board feed (RSS) |

> [!NOTE]
> A board is routinely mounted under a sub-path, so the feed is built from the directory holding the script. The feeds are an administrator toggle, so an install can carry the marker and answer 404.

### NodeBB

Discovers the feeds of a NodeBB forum. Detected by the `X-Powered-By` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{forum}/category/{cid}` | Category feed + site feeds (RSS) |
| `{forum}/topic/{tid}` | Topic feed + site feeds (RSS) |
| Any other page | Recent feed + popular feed (RSS) |

### FluxBB

Discovers the feeds of a FluxBB board. Detected by the two board wrapper ids together.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Posts feed (RSS + Atom) |

### Mobilizon

Discovers the feeds of a Mobilizon instance or group. Detected by the noscript notice, which is the only text the server renders on every page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/@{group}` | Group feed + instance feed (Atom) |
| Any other page | Instance feed (Atom) |

### Hubzilla

Discovers the Atom feed of a Hubzilla channel. Detected by the `hubzilla` generator meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{hub}/channel/{name}` | Channel feed (Atom) |

> [!NOTE]
> There is no site-wide feed, so a page outside a channel is not matched.

### snac

Discovers the RSS feed of a snac user. Detected by the `snac/` generator meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/{user}` | Posts feed (RSS) |

> [!NOTE]
> An instance is routinely mounted under a sub-path, so the feed is built from the page path and never from the origin.

### Shaarli

Discovers the feeds of a Shaarli instance. Detected by the `shaarli-menu` id.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Posts feed (RSS + Atom), plus the pre-0.12 shape |

### PeerTube

Discovers the feeds of a PeerTube instance, channel or account. Detected by the `X-Powered-By` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/c/{channel}` | Channel feed + instance feed |
| `{instance}/a/{account}` | Account feed + instance feed |
| Any other page | Instance feed |

> [!NOTE]
> A channel federated from another instance is addressed as `handle@remote.host`, and the bare handle answers 404.

### Funkwhale

Discovers the RSS feed of a Funkwhale channel. Detected by the `Funkwhale` generator meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/channels/{handle}` | Channel feed (RSS) |

> [!NOTE]
> The v1 API path is emitted rather than v2, which one instance advertises in its own link tag while another answers 404 for it. An unknown channel answers 404 carrying an RSS content type and an `<rss>` root.

### Art19

Discovers the RSS feed of an Art19 show.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `art19.com/shows/{slug}` | Show feed (RSS) |

> [!NOTE]
> The feed is derived from the URL in hand, never from where it redirects: a show can redirect to a site that mentions no feed while the derived feed still resolves.

### Omny Studio

Discovers the RSS feed of an Omny Studio show.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `omny.fm/shows/{slug}` | Show feed (RSS) |

> [!NOTE]
> A show whose page answers 404 can still resolve through this shortcut, which redirects to an identifier path on the content host.

### Blubrry PowerPress

Discovers the podcast feed of a WordPress site running the PowerPress plugin. Detected by the player function the plugin writes into the page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Podcast feed (RSS) |

> [!NOTE]
> Generic discovery finds `{site}/feed/`, which is the blog feed. This adds the podcast feed. A site can redirect it to its podcast host, which resolves normally.

### Podomatic

Discovers the RSS feed of a Podomatic show.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{show}.podomatic.com` | Show feed (RSS) |
| `podomatic.com/podcasts/{show}` | Show feed (RSS) |

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
  acastHandler,
  amebloHandler,
  applePodcastsHandler,
  arenaHandler,
  artstationHandler,
  audioboomHandler,
  bearblogHandler,
  behanceHandler,
  blogspotHandler,
  blueskyHandler,
  bookwyrmHandler,
  buttondownHandler,
  buzzsproutHandler,
  csdnHandler,
  dailymotionHandler,
  deviantartHandler,
  devtoHandler,
  discourseHandler,
  doubanHandler,
  dreamwidthHandler,
  exblogHandler,
  firesideHandler,
  friendicaHandler,
  ghostHandler,
  giteaHandler,
  githubHandler,
  githubGistHandler,
  gitlabHandler,
  goodreadsHandler,
  hackernewsHandler,
  hashnodeHandler,
  hatenablogHandler,
  hearthisHandler,
  heyWorldHandler,
  insanejournalHandler,
  itchioHandler,
  kickstarterHandler,
  lemmyHandler,
  letterboxdHandler,
  libsynHandler,
  listedHandler,
  livejournalHandler,
  lobstersHandler,
  mastodonHandler,
  mataroaHandler,
  mediumHandler,
  microblogHandler,
  misskeyHandler,
  myanimelistHandler,
  naverBlogHandler,
  nebulaHandler,
  noteHandler,
  observableHandler,
  odyseeHandler,
  pagecordHandler,
  paragraphHandler,
  pikaHandler,
  pinterestHandler,
  pixelfedHandler,
  pleromaHandler,
  podbeanHandler,
  podigeeHandler,
  posthavenHandler,
  producthuntHandler,
  proseHandler,
  qiitaHandler,
  redditHandler,
  rssComHandler,
  seesaaHandler,
  soundcloudHandler,
  sourceforgeHandler,
  spreakerHandler,
  stackExchangeHandler,
  steamHandler,
  substackHandler,
  tildesHandler,
  tistoryHandler,
  transistorHandler,
  tumblrHandler,
  v2exHandler,
  velogHandler,
  vimeoHandler,
  weblogLolHandler,
  weeblyHandler,
  wordpressHandler,
  wpengineHandler,
  writeasHandler,
  ximalayaHandler,
  youtubeHandler,
  zennHandler,
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
//   {
//     uri: [
//       'https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ',
//       'https://www.youtube.com/feeds/videos.xml?playlist_id=UUBJycsmduvYEL83R_U4JriQ',
//     ],
//     hint: { key: 'youtube:all', label: 'All uploads' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UULFBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:videos', label: 'Videos only' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUSHBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:shorts', label: 'Shorts only' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UULVBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:live', label: 'Live streams only' },
//   },
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
  match: (url: string, content?: string, headers?: Headers) => boolean
  resolve: (
    url: string,
    content?: string,
    headers?: Headers,
    fetchFn?: DiscoverFetchFn,
  ) => Array<DiscoverUriEntry> | Promise<Array<DiscoverUriEntry>>
}
```

| Method | Description |
|--------|-------------|
| `match(url, content?, headers?)` | Returns `true` if this handler should process the URL |
| `resolve(url, content?, headers?, fetchFn?)` | Returns an array of [`DiscoverUriEntry`](/reference/types#discoverurientry) objects for the given page URL |

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

    return [{ uri: `${origin}/feed.xml` }]
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
      return [{ uri: `${origin}/users/${match[1]}/feed.rss` }]
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

    return match?.[1] ? [{ uri: match[1] }] : []
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
