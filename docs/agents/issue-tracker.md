# Issue tracker: Local Markdown

Issues and PRDs for this repo live as markdown files in `.artifacts/issues/`.

## Conventions

- `.artifacts/` is the general agent-artifacts folder and the tracker is one tenant inside it, under `issues/`. Other agent output sits at the `.artifacts/` root — keep the tracker nested.
- One feature per directory: `.artifacts/issues/<feature-slug>/`
- The PRD is `.artifacts/issues/<feature-slug>/PRD.md`
- Implementation issues are `.artifacts/issues/<feature-slug>/<NN>-<slug>.md`, numbered from `01`
- Triage state is recorded as a `Status:` line near the top of each issue file (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `.artifacts/issues/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.
