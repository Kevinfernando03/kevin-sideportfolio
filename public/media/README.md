# Media

Large media files live here and are not committed. The site runs without them: the
3D devices stay hidden and the showreel panel is empty until they are added.

```
public/media/
├── reel.mp4                       showreel (or set another URL in /admin)
└── maps/                          device sprite sheets
    ├── <device>_diffuse-<quality>.jpg
    ├── <device>_alpha-<quality>.jpg
    ├── <device>_mv-<quality>.jpg|png        motion vectors
    ├── <device>_data-<quality>.jpg|png      red channel = screen mask
    ├── <device>_position-<quality>.jpg|png
    ├── <device>_glass-medium.jpg            boombox, magnifying-glass only
    ├── <device>_mask-0.jpg|png              default screen image 1
    └── <device>_mask-1.jpg|png              default screen image 2
```

`<device>` is one of the names in `src/components/site/data.ts` (`headphones`, `laptop`,
`dashboard`, `boombox`, `keycard`, `gameboy`, `controller`, `tablet`, `magnifying-glass`,
`glove`). `<quality>` is `medium` for every device, plus `high` for the hero devices
(`gameboy`, `controller`, `tablet`). Each sheet is a grid of camera angles: 4×4, or 8×4
for the glove. Which maps are PNG rather than JPG is listed in `PNG_MAPS` in `data.ts`.
