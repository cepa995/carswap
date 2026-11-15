# Assets read on the server

Files here are read from disk by the code that draws link-preview images
(`src/lib/og`). They are not served to browsers; anything a browser fetches
lives in `public/`.

## fonts/

Bricolage Grotesque, Medium and ExtraBold, as static TrueType instances at the
96pt optical size. The preview renderer cannot read the variable WOFF2 files
that `next/font` serves to browsers, so it gets its own copies.

Copyright 2022 The Bricolage Grotesque Project Authors
(https://github.com/ateliertriay/bricolage). Licensed under the SIL Open Font
License 1.1, https://openfontlicense.org. Downloaded from Google Fonts.

## share-photos/

A small 3:2 JPEG of each demo photo, written by `scripts/seed-photos/build.py`.
Authors and licences are listed in `public/seed/ATTRIBUTION.md`.
