# Scene tag rules — FINAL (v3, frozen 2026-09-30, 23 tags)

Every tag is a yes/no **presence** tag about what is **drawn in the artwork**. A card can have any number of tags,
including none. Ignore all printed text (names, attacks, Pokédex strip) and what you know about the Pokémon.
When in doubt, leave the tag off. But check every card deliberately against every tag: missed real cases were the main source of disagreement. Example ids refer to cards in the 1,579-card test set and are text references only.

## Setting
| Tag | Decision rule (yes when …) | Not when … | Examples |
| --- | --- | --- | --- |
| `beach` | sand or a shoreline where land meets the sea is visible | a lake shore with no sand; open sea only | sm1-39, hgss1-11 |
| `water-surface` | a body of water (sea, lake, river, pond, waves) is clearly drawn, seen from above the surface | puddles or rain on the ground; bubbles without a body of water; holo sparkle; underwater views | ex1-41, dp1-58 |
| `underwater` | the view is below the water surface (bubbles, seabed, coral, light rays from above) | water seen from above | sm1-41, sv03.5-134 |
| `forest` | trees or dense jungle vegetation form the setting | a single tree; bushes/grass only | bw1-1, bw1-43 |
| `grassland-field` | an open meadow, grass field or lawn is the main ground | forest floor under many trees; grass in a garden bed only | base1-28, bw1-41 |
| `mountain-rocks` | mountains, cliffs, canyons or large rock formations are part of the setting | a single small stone; a cave interior | bw1-14, bw1-53 |
| `cave` | the scene is inside a cave or tunnel (rock walls/ceiling, stalactites) | a dark room; a cave entrance seen from far away | hgss1-24, sm1-87 |
| `desert` | dry sand dunes, arid sand or a desert landscape with cacti | a sandy beach next to the sea | bw1-63, swsh1-108 |
| `snow-ice` | snow on the ground, falling snow, or ice formations are visible | white plain background; clouds | sv01-058, dp1-85 |
| `city` | outdoor streets or several buildings/towers form the setting | a single hut; indoor rooms | sv01-084, sv03.5-062 |
| `indoors` | the scene is inside a room or building (walls, furniture, windows from inside, lab, kitchen) | outdoor buildings; cave | hgss1-97, swsh1-90 |
| `ruins-building` | a man-made structure is a clear part of the scene (ruins, temple, pagoda, tower, lighthouse, bridge, castle, house, gate) | tiny far-away specks; indoor rooms (that is `indoors`); only a city skyline (that is `city`) | xy1-83, swsh1-22 |
| `sky-clouds` | open sky with clouds fills a large part of the picture | a sliver of sky above a landscape; night sky only | dp1-24, ex1-72 |

## Time and weather
| Tag | Decision rule | Not when … | Examples |
| --- | --- | --- | --- |
| `night` | the sky or outdoor scene is clearly night: dark blue/black sky, moon, starry night sky, or lamps/windows glowing in outdoor darkness | a dark cave, dark forest or dark background without visible sky; purple/pink fantasy backgrounds; holo foil sparkle; daytime with a sun | hgss1-42, sv01-001 |
| `sunset-sunrise` | a low sun or an orange/red/pink evening or morning sky | red backgrounds from fire or attacks | base1-26, sv03.5-008 |
| `fire-lava` | flames, fire, lava, magma or an erupting volcano are drawn in the scene | a Fire-type Pokémon just posing with no visible flames; red background only | xy1-20, sv03.5-059 |

## Content and activity
| Tag | Decision rule | Not when … | Examples |
| --- | --- | --- | --- |
| `flowers` | flowers or blossoms are clearly drawn in the scene | a flower that is part of the Pokémon's own body | bw1-10, base1-44 |
| `food-visible` | food or drink is drawn (berries, fruit, meals, sweets, tea) | flowers; Poké Balls | sv01-151, sv01-095 |
| `human-present` | a human person is drawn (including silhouettes) | Pokémon that look human-like | sv03.5-204, hgss1-97 |
| `multiple-pokemon` | two or more separate Pokémon are visible (including small ones in the background) | ONE Pokémon whose species has several bodies or heads (Dugtrio, Exeggcute, Exeggutor, Klink, Klang, Maushold, Magneton, Weezing, Dodrio …); afterimages or reflections | ex1-62, sv01-160 |
| `sleeping` | a Pokémon has its eyes closed AND is lying, curled up or resting as if asleep | eyes closed while attacking or posing; Pokémon whose eyes are always closed (e.g. Abra sitting) | bw1-49, sv03.5-143 |
| `flying` | a Pokémon is in the air: body clearly not touching ground, water or a branch, with wings spread or visibly hovering | standing, sitting or perched; a mid-jump or leaping attack close to the ground; only an attack effect is airborne | ex1-72, dp1-64 |
| `swimming` | a Pokémon is swimming in water (at the surface or underwater) | standing next to water | base1-25, sm1-41 |

## Caption
`caption`: one short English sentence, at most about 12 words, describing only the illustrated scene.
No printed text, no card names, no game mechanics.

Tags not in this list (e.g. rain/storm, space) are NOT tagged; describe them in the caption instead.
