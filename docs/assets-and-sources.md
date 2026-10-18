# Assets and sources

The visual identity, layout, UI, motion composition and itinerary implementation
are original to Tavriqa. Photography and map data are credited below.

## Photography

All four photographs were retrieved from their source image URLs and optimized
into local 800/1800-pixel WebP variants. The source images are not generative
destination illustrations. The [Unsplash License](https://unsplash.com/license)
permits use and adaptation in this project; it does not transfer ownership of
the photographs to the project author.

| Destination   | Photographer             | Source                                                                                                                  |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Madeira       | Colin Watts              | [Ponta de São Lourenço sunrise](https://unsplash.com/photos/a-view-of-the-ocean-from-the-top-of-a-mountain-2fWZ9jsoIe0) |
| South Iceland | Rolands Varsbergs        | [Skógafoss waterfall](https://unsplash.com/photos/waterfalls-during-day-f3Os5oCc874)                                    |
| Dolomites     | Finge Holden             | [Lago di Braies](https://unsplash.com/photos/a-lake-surrounded-by-mountains-and-trees-NwJ-bJk4VRE)                      |
| Dilijan       | IsaaK Alexandre KaRslian | [Dilijan aerial view](https://unsplash.com/photos/an-aerial-view-of-a-town-surrounded-by-mountains-PFvyG7c4q5I)         |

Machine-readable credits and original image URLs are in `src/data/photos.json`.

## Geography and destination background

- Natural Earth [1:110m land](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson),
  [public-domain terms](https://www.naturalearthdata.com/about/terms-of-use/).
  The vendored land geometry supplies the globe, not a navigation map.
- [Visit Madeira](https://www.visitmadeira.com/en/) and its official pages for
  [Fanal](https://www.visitmadeira.com/en/where-to-go/madeira/north-coast/porto-moniz/fanal/)
  and [Ponta de São Lourenço](https://www.visitmadeira.com/en/where-to-go/madeira/east-coast/machico/ponta-de-sao-lourenco/).
- [Visit Iceland: South Iceland](https://www.visiticeland.com/the-regions/the-south/).
- [Dolomiti official portal](https://www.dolomiti.org/en/).
- [Armenia Travel: a day in Dilijan](https://armenia.travel/articles/spending-a-day-in-dilijan-armenia/)
  and [Tavush](https://armenia.travel/places-to-go/tavush/).

Coordinates are approximate planning pins. Stop durations and monetary
allowances are authored demonstration values; they are not source-derived live
prices or claims about current access. Official information should be consulted
before actual travel.

## Fonts and libraries

Plus Jakarta Sans and Instrument Serif are self-hosted through Fontsource. Their
SIL Open Font License texts are retained in `docs/licenses/`.

React, React Router, GSAP, React Three Fiber, Three.js, d3-geo, dnd-kit, Lucide,
Zod and the development tools retain their package licenses. Their exact resolved
versions are recorded in `package-lock.json`.

The exact-name search performed for TAVRIQA found no relevant matching travel
brand. This is a working project name, not a trademark or worldwide-uniqueness
guarantee.
