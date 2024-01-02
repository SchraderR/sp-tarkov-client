# Todo LIST

## Download Links
- ~~Support direct archive files~~
- ~~Support Github release links with tag~~
- Support Github release links
- Support Dropbox
  - https://hub.sp-tarkov.com/files/file/652-game-panel-hud/
- Support Mega
- Support Google Drive
  - https://hub.sp-tarkov.com/files/file/379-kmc-server-value-modifier-svm/
- Check Mods
  - https://hub.sp-tarkov.com/files/file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/
  - https://hub.sp-tarkov.com/files/file/1119-waypoints-expanded-bot-patrols-and-navmesh/
  - https://hub.sp-tarkov.com/files/file/1159-morecheckmarks/

## High
- A~~dd strong caching to store request and the results~~
  - ~~Caching in local storage~~
  - ~~caching in persistent storage?~~
    - ~~time based automatic refresh? (fetchDate <= Date + 1) auto refetch~~
    - ~~add manually refresh~~
- ~~Add download response and show current progress~~
- Add "most loaded" -> https://hub.sp-tarkov.com/files/?pageNo=1&sortField=downloads&sortOrder=DESC
  - overview (cached) with names and action to download
- ~~Add "top reviewed" -> https://hub.sp-tarkov.com/files/?pageNo=1&sortField=cumulativeLikes&sortOrder=DESC~~
- ~~Add search for mods and jump to client mod download page~~
- Add more Information into modCard (information, description, version)
- support fontawesome 4 to support mod icons
- ~~track download progress global and not scoped~~

## Medium
- Instances with amount of client and server mods
  - List of mods with version and more
  - ~~Add the ability to read the assembly information from client mods~~
  - Add a warning that download will automatically accept the licence of the mod
  - Add a link to the licence file for every mod (fetch while accepting licence to download)
  - Add transparency for github api and their rate limitations (~~look header in response~~)
  - evaluate "pre-install" dependency check (aki version)
    - unzip - check package.json / dll?
    - "pre-all" is hard


## Low
- Release on GitHub
- Create site on Sp Hub
- Major refactoring of every component
- Unit Testing
- (opt) Add overview of running downloads - not limited to a site (like a popout / notification)
- ~~reduce loading content and images to reduce size and get better loading time~~








