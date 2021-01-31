# CHANGELOG

### 4.0.3

- Adjust constants for better frequency visualization
    - Increase Spectral bufsize from 2048 to 8192 (more samples)
    - Make frequency index scaling curve more powerful (emphasize low/mid-range)
    - Decrease frequency bars from 256 to 128 (less busy)
- Leave a gap between each frequency bar
- Fix search text not appearing after re-opening the items list
- Focus and select search input upon opening the items list

### 4.0.2

- Improve spectrum frequency scaling
- Fix live-reloading

### 4.0.1

- Remove unnecessary `onPlayChanged` from `Spectral`

### 4.0.0

- Update dependencies to 2021 state-of-the-art
- Use MediaSession API where available
- Compatibility fixes for update to React 17.x

### 3.0.3

- Remove `picture` field, add `fileURL` field to `AudioFile`

### 3.0.2

- Add `prop-types` to `devDependencies`
- Bump `jsmediatags@^3.7.0`

### 3.0.1

- Tiny compact item spacing change

### 3.0.0

- Refactor/reorganize webapp source code
- Add JSDoc

### 2.1.0

-  Add album art background, transition, and shadowing

### 2.0.1

- Update `README.md`, add `CHANGELOG.md` and `jsdoc`

### 2.0.0

- Initial publish on NPM

