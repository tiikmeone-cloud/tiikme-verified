# Rive animation files

Drop your `.riv` exports here. The app probes for these exact filenames and
hot-swaps when they appear.

## Required files

| Filename | Used for |
|---|---|
| `twin-orb.riv` | The Twin orb — chat avatar, Today card, message author |
| `loader-thinking.riv` | Reasoning pill |
| `loader-matching.riv` | Candidate matching |
| `loader-applying.riv` | Sending application |
| `loader-auditing.riv` | Flex audit |
| `loader-building.riv` | Building Flex |

## Specs

See `/docs/animation-handoff.md` for state machines, palette, sizes, and the
full design spec.

## Workflow

1. Save a `.riv` here with the exact filename above
2. Refresh `http://localhost:3002/`
3. The CSS fallback is gone — your animation is live

No code change needed.
