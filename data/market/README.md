# Market feedback loop

Drop job descriptions here (`.md` or `.txt`) — one file per JD, any filename.
The remote-job-finder skill can write them here automatically.

Then run:

    npm run market:sync

which extracts each JD's required skills (via the free OpenCode Zen endpoint),
diffs them against `data/profile.json`, and writes a ranked gap report to
`output/learning-targets.md`. Files here are inputs, not claims — nothing in
this directory ends up on the public site.
