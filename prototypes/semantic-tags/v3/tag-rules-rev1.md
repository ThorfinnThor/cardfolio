# Rule revision 1 (only for tags that missed the Phase A gate; one revision allowed per tag)

Judge ONLY these five tags. Yes/no presence about what is drawn; ignore printed text; when in doubt, leave it off.
But do check every card deliberately for each of the five tags: in Phase A the passes mostly disagreed by MISSING real cases.

| Tag | Yes when … | Not when … |
| --- | --- | --- |
| `night` | the sky or outdoor scene is clearly night: dark blue/black sky, moon, starry night sky, or lamps/windows glowing in outdoor darkness | a dark cave, dark forest or dark background without visible sky; purple/pink fantasy backgrounds; holo foil sparkle; daytime with a sun |
| `flying` | a Pokémon is in the air: body clearly not touching ground, water or a branch, with wings spread or visibly hovering | standing, sitting or perched; a mid-jump or leaping attack close to the ground; only an attack effect is airborne |
| `ruins-building` | a man-made structure is a clear part of the scene (ruins, temple, pagoda, tower, lighthouse, bridge, castle, house, gate) | tiny far-away specks; indoor rooms (that is `indoors`); only a city skyline (that is `city`) |
| `water-surface` | a body of water (sea, lake, river, pond, waves) is clearly drawn, seen from above the surface | puddles or rain on the ground; bubbles without a body of water; holo sparkle; underwater views |
| `multiple-pokemon` | two or more separate Pokémon are visible (including small ones in the background) | ONE Pokémon whose species has several bodies or heads (Dugtrio, Exeggcute, Exeggutor, Klink, Klang, Maushold, Magneton, Weezing, Dodrio …); afterimages or reflections |

Output per card: `{"id": "<id>", "tags": [only the TRUE ones of these five]}`
