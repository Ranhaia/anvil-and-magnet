# Design system: Anvil & Magnet UI (v8)

Source of truth is the `v8 UI REFRESH` block at the end of `style.css` (`:root` tokens).

## Direction
Dark-tech arcade cabinet. Redesign-preserve of the existing cabinet. Dials: variance 6, motion 4, density 5.

## Colour lock
| Role | Token | Value |
|---|---|---|
| Interface accent | `--ui-cyan` | `#3ee6ff` |
| Reward / primary action | `--ui-amber` | `#ffc83d` |
| Danger only | `--ui-danger` | `#ff5468` |
| Health OK | `--ui-ok` | `#3ddc97` |
| Panel | `--ui-panel` | `rgba(9,13,22,.88)` |

Cabinet hardware buttons (red/yellow/blue/green/purple/gold) are physical objects and keep their own colours. Do not reuse them as UI chrome.

## Shape and type
- Radius: 6px (chips, keys, buttons) and 10px (panels). Nothing else.
- Text: Outfit for UI, Press Start 2P only for numbers and short labels. Min size 10px on the deck, 0.62rem in the HUD.
- No emoji, no gradient-clipped text, no blinking labels.

## Controls contract
| Input | Action |
|---|---|
| A / D, arrows | Run |
| W, Space | Jump |
| Z / left click | Pull |
| X / right click | Push |
| E | Gas (aims at cursor) |
| R / Q | Recall anvil / back to sanctuary |
| P, Esc | Pause |
| C / F | Camera / FPS |
| 1, 2, Esc | Fortune altar pick / skip |

Rules: Space never dismisses the altar or clicks a focused button during play; losing window focus releases all inputs and pauses; deck uses Pointer Events (joystick is draggable, 132px).
