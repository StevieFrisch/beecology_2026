/*
  Typical color pattern of a female worker (queen for cuckoo species) for each bee,
  used by the schematic diagram on the bee detail page.

  Checked against the Vermont Center for Ecostudies field guide ("Bumble bees through
  binoculars", val.vtecostudies.org), the Michigan Natural Features Inventory (auricomus)
  and Wikipedia (insularis). ashtoni could not be confirmed from a published source and
  should be reviewed. Bumble bees vary a lot (especially rufocinctus and the cuckoos).
  Thorax re-checked Nov 2026 against Wikipedia: citrinus changed to no black on the thorax
  ("usually no black hairs on the thorax"); the others weren't contradicted, though most pages
  give little thorax detail. affinis workers can have a larger black area reaching the sides.
  Head and thorax re-checked Nov 2026 against the Michigan guide (swmbees.kzoo.edu/bumble-bees-guide)
  and the Vermont field guide (val.vtecostudies.org, "Bumble bees through binoculars"):
    head — yellow on top: bimaculatus, borealis, impatiens, vagans, auricomus, citrinus, insularis,
           perplexus (yolk-yellow), ternarius and rufocinctus (yellow mixed with black/grey);
           black: affinis, fervidus, ashtoni, griseocollis and sandersoni (both sometimes mixed).
           terricola, pensylvanicus and flavidus weren't described; left black, unverified.
    thorax — insularis has a large black patch (was all yellow); flavidus (fernaldae) is yellow
           in front and black from the wings back (was a spot). ashtoni (= bohemicus) is yellow at
           the front and rear of the thorax (iNaturalist guide; was black at the rear), with a white
           to yellowish-white band on T4 (Montana key); T5 white is unconfirmed.
    rufocinctus — was the same abdomen as ternarius. Guides (Vermont, Wisconsin, Wildlife
           Preservation Canada): when there's red on T2/T3, T4 is almost never yellow (a yellow T4
           after the orange means ternarius), and the red band is duller and blurrier. Now drawn as
           a typical red form: T1–T2 yellow, red T3, black from T4. Very variable (pale forms too). impatiens has a faint greyish
           smudge rather than a clear spot (left as no mark).

  Full check, Nov 2026, every species against the Wisconsin bumble bee guide
  (wisconsinbumblebees.entomology.wisc.edu/online-guide/species/…), the Minnesota Bee Atlas
  (minnesotabeeatlas.umn.edu/species-guide/bees/bombus/…) and the Vermont field guide. Changed:
    affinis     — thorax mark is a band ("straight or T-shaped"), not a spot
    borealis    — thorax is yellow (the amber is on the abdomen); wide black band
    ternarius   — thorax mark is a T / "thumbtack" band, not a spot
    impatiens   — thorax has a black spot (often worn; Vermont calls it a grey smudge)
    sandersoni  — black band between the wings (more black than vagans)
    pensylvanicus — T1 often yellow in the middle (Wisconsin, Minnesota); Vermont says black → B/Y
    rufocinctus — light morph is yellow, yellow, red, red, black, black (Wisconsin); very variable
    auricomus   — thorax mostly black behind the wings (Wisconsin, Vermont) → black rear
  Kept despite a source conflict: citrinus thorax (no black per Wikipedia; Vermont implies a small
  dot), ternarius head (black per Minnesota, yellow or mixed per Michigan), flavidus thorax.
  No source describes the scutellum (rear of thorax) for most species; those stay as drawn.

  Colors:  Y yellow · B black · O orange / rusty red · W pale / whitish · A amber-gold
  head:    hair on top of the head (vertex): 'B' black, 'Y' yellow (the face is black on most)
  thorax:  { base, mark, rear }
             base — main color of the thorax hair
             mark — 'spot' (black spot between the wings), 'band' (black band between
                    the wings) or 'none'
             rear — color at the back of the thorax (scutellum)
  abdomen: six segments, T1 (nearest the thorax) to T6 (tip).
           'side/middle' = one color at the sides, another in the middle,
           e.g. 'Y/O' yellow sides with an orange patch, 'B/Y' black sides with yellow middle.
*/
export const beePatterns = {
  affinis:       { head: 'B', thorax: { base: 'Y', mark: 'band', rear: 'Y' }, abdomen: ['Y', 'Y/O', 'B', 'B', 'B', 'B'] },
  terricola:     { head: 'B', thorax: { base: 'Y', mark: 'band', rear: 'B' }, abdomen: ['B', 'Y', 'Y', 'B', 'B', 'B'] },
  bimaculatus:   { head: 'Y', thorax: { base: 'Y', mark: 'spot', rear: 'Y' }, abdomen: ['Y', 'B/Y', 'B', 'B', 'B', 'B'] },
  perplexus:     { head: 'Y', thorax: { base: 'Y', mark: 'none', rear: 'Y' }, abdomen: ['Y', 'Y', 'B', 'B', 'B', 'B'] },
  borealis:      { head: 'Y', thorax: { base: 'Y', mark: 'band', rear: 'Y' }, abdomen: ['A', 'A', 'A', 'A', 'A', 'B'] },
  ternarius:     { head: 'Y', thorax: { base: 'Y', mark: 'band', rear: 'Y' }, abdomen: ['Y', 'O', 'O', 'Y', 'B', 'B'] },
  impatiens:     { head: 'Y', thorax: { base: 'Y', mark: 'spot', rear: 'Y' }, abdomen: ['Y', 'B', 'B', 'B', 'B', 'B'] },
  vagans:        { head: 'Y', thorax: { base: 'Y', mark: 'spot', rear: 'Y' }, abdomen: ['Y', 'Y', 'B', 'B', 'B', 'B'] },
  griseocollis:  { head: 'B', thorax: { base: 'Y', mark: 'spot', rear: 'Y' }, abdomen: ['Y', 'B/O', 'B', 'B', 'B', 'B'] },
  fervidus:      { head: 'B', thorax: { base: 'Y', mark: 'band', rear: 'Y' }, abdomen: ['Y', 'Y', 'Y', 'Y', 'B', 'B'] },
  pensylvanicus: { head: 'B', thorax: { base: 'Y', mark: 'band', rear: 'B' }, abdomen: ['B/Y', 'Y', 'Y', 'B', 'B', 'B'] },
  sandersoni:    { head: 'B', thorax: { base: 'Y', mark: 'band', rear: 'Y' }, abdomen: ['Y', 'Y', 'B', 'B', 'B', 'B'] },
  rufocinctus:   { head: 'Y', thorax: { base: 'Y', mark: 'spot', rear: 'Y' }, abdomen: ['Y', 'Y', 'O', 'O', 'B', 'B'], variable: true },
  auricomus:     { head: 'Y', thorax: { base: 'Y', mark: 'band', rear: 'B' }, abdomen: ['B', 'Y', 'Y', 'B', 'B', 'B'] },
  citrinus:      { head: 'Y', thorax: { base: 'Y', mark: 'none', rear: 'Y' }, abdomen: ['B', 'B', 'Y', 'B', 'B', 'B'] },
  ashtoni:       { head: 'B', thorax: { base: 'Y', mark: 'band', rear: 'Y' }, abdomen: ['B', 'B', 'B', 'W', 'W', 'B'], unverified: true },
  flavidus:      { head: 'B', thorax: { base: 'Y', mark: 'band', rear: 'B' }, abdomen: ['Y', 'B', 'Y', 'B', 'B', 'B'], variable: true },
  insularis:     { head: 'Y', thorax: { base: 'Y', mark: 'spot', rear: 'Y' }, abdomen: ['B', 'Y/B', 'Y/B', 'Y/B', 'B', 'B'], variable: true },
}

export const PATTERN_COLORS = {
  Y: { fill: '#f2c530', label: 'Yellow' },
  A: { fill: '#e4a52b', label: 'Amber-gold' },
  O: { fill: '#c4561c', label: 'Orange / rusty' },
  W: { fill: '#fdfbf4', label: 'White / pale' },
  B: { fill: '#2a2118', label: 'Black' },
  U: { fill: '#e8e1d2', label: 'Not sure' }, // "I'm not sure" in the collect flow; diagrams draw it hatched
}
