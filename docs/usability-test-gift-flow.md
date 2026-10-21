# Usability test: the gift flow with people who know nothing about Pokémon cards

Why: the automated tests show that the flow works, not that it is understandable. Two or three real
people tell us more than any further change. **This has not been run yet.**

## Setup (10 minutes)

- Link: `https://cardfolio-780.pages.dev/geschenk/` on the person's **own phone** (most gift buyers use one).
- Tester: someone who has never used Your Card Binder and does not collect cards. Parents, grandparents and
  uncles/aunts of a child who plays are ideal. Three people are enough to see the main problems.
- You: sit next to them, say nothing helpful, take notes. Do not explain buttons. If they ask "what should I
  do here?", answer "what would you do if I were not here?".
- Do not click on "Karten besorgen" for them. They may click it themselves; stop at the Cardmarket page
  unless they already have an account and really want to buy.

## Tasks (say them in these words)

1. "Du möchtest deiner Nichte (8) ein Pokémon-Geschenk machen. Sie mag Pikachu. Richte das mit dieser Seite ein."
2. "Du hast etwa 30 Euro für die Karten. Ist das gerade eingestellt?"
3. "Eine Karte gefällt dir nicht. Tausche sie aus."
4. "Wie viel kostet das Ganze ungefähr?"
5. "Und wie kommst du jetzt an die Karten?"

Second round, same person, other starting point: "Du weißt gar nicht, welches Pokémon dein Neffe mag."
(expected: "Ich kenne mich nicht aus").

## What to watch

| Question | Note it down |
|---|---|
| Where do they hesitate for more than five seconds? | screen + what they said |
| Which words do they not understand? | word |
| Do they find "tausche aus" (tap card → Austauschen) without help? | yes / no / how long |
| Do they understand the 3×3 binder as "the page I will fill"? | quote |
| Do they notice the total price and what it means (estimate, without shipping)? | what they think it costs |
| Do they understand that Your Card Binder sells nothing and the cards are bought elsewhere? | their words |
| Do they manage the Cardmarket steps (account, paste list, condition)? Where do they stop? | step |
| Do they open the illustrated instructions page? Does it help? | yes / no |

## After each session (5 questions)

1. What was the most confusing moment?
2. What would you have expected to see that was not there?
3. Would you have bought the cards this way, or given up? Where?
4. In one sentence: what does this page do?
5. Who would you tell about it, and what would you say?

## Success criteria (decide before the first test)

- Task 1 done without help in under 3 minutes by at least 2 of 3 testers.
- Nobody asks what "Holo", "Zustand" or "Wants-Liste" means before reading the explanation on the page.
- At least 2 of 3 can say in their own words that the cards are bought at a marketplace, not at Your Card Binder.

Record every session in a few lines in this file's pull request or issue, with the date and the phone model.
