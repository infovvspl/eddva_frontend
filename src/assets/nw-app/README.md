# Orbit ring avatars — `nw-app`

These four images fill the face slots in the rotating ring around the phone in
`src/new-website/components/MobileAppSection.jsx` ("Take EDDVA Anywhere").

## Replacing them

Drop in files with these exact names. **No code change is needed** — the
component imports them by path:

| File | Slot | Currently |
|---|---|---|
| `avatar-student.png`   | ring position 1 (top) | head crop of `images/Student_Avatar.png` |
| `avatar-teacher.png`   | ring position 3       | head crop of `images/Teacher_Avatar.png` |
| `avatar-learner.png`   | ring position 5       | head crop of `student_gen.jpg` |
| `avatar-principal.png` | ring position 7       | head crop of `images/admin-avatar.png` |

The current images are stand-ins, cropped from the project's own character art
because the repo has no headshot photography. The only real portrait available
is `md.png` / `sir 1.png` — one identifiable person, so it was left out.

## Specs

- **Square**, 240×240 minimum (480×480 if you want retina headroom)
- **Face centred**, head and shoulders — the CSS masks these into a circle
  (`object-fit: cover`), so anything near the corners is clipped
- **PNG or JPG.** A transparent or plain light background works best against
  the section's warm canvas (`#f6f3ef`)
- Keep the four visually consistent — same rendering style, similar crop
  distance and lighting. A mismatched set reads as an error, not variety.

## Prompts, if generating them

Ask for a **square head-and-shoulders portrait, plain light background, centred,
facing camera, friendly expression** — then vary only the subject:

1. an Indian secondary-school boy in a school uniform
2. an Indian male teacher, glasses, formal shirt
3. an Indian female college student, casual top
4. an Indian female school principal, saree, warm smile

Generate all four in one session with the same style wording so they match.
