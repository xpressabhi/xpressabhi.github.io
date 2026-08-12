# Archive Plan — retiring `cv` and `bragging-rights`

Both repos were folded into this hub repo (Feb 2026 consolidation). Nothing is lost:

| Old repo | Unique content | Where it lives now |
|---|---|---|
| `xpressabhi/cv` | Google-Docs CV export (`index.html`) | `templates/cv.html` + `cv/` (generated, better) |
| `xpressabhi/bragging-rights` | `abhishek_maurya_2026.pdf` | `cv/abhishek-maurya-cv.pdf` (generated) |
| | `servicenow/build-agent.md` | `deep-dives/build-agent.md` |
| | `servicenow/ala-App-Summary-Agent.md` | `deep-dives/ala-app-summary-agent.md` |
| | `servicenow/table-builder.md` | `deep-dives/table-builder.md` |
| | `servicenow/workspace-builder.md` | `deep-dives/workspace-builder.md` |
| | `servicenow/sn-claude-skills.md` | `deep-dives/sn-claude-skills.md` |
| | `servicenow/generic.md` | `deep-dives/generic.md` |
| | `SERVICENOW_PROJECTS_WRITEUP.md` | `deep-dives/writeup-intuit.md` |
| | `writeup.md` | dropped (duplicate of writeup-intuit) |

## Steps (run once, after pushing this repo)

```sh
# Archive the two repos on GitHub (contents remain visible, read-only)
gh repo archive xpressabhi/cv
gh repo archive xpressabhi/bragging-rights

# Optionally delete local clones (everything is preserved above)
rm -rf ~/Documents/GitHub/cv ~/Documents/GitHub/bragging-rights
```

Result: **2 repos instead of 4** — `xpressabhi` (profile README only) + `xpressabhi.github.io` (everything else), all fed from `data/profile.json`.
