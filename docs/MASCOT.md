# Lumen asset provenance

Generated with the built-in image generation tool; no Blender scene was
produced. The current launcher source is `assets/icons/lumen-fractal.png`.
App derivatives are reproducible with `tools/build-icons.ps1`, including padded
maskable variants. The original `assets/icons/lumen.png` is retained as visual
history rather than silently overwritten.

Final generation prompt:

> Use case: stylized-concept. Create a premium photorealistic 3D rendered mascot asset for a dark graphite personal growth game app. Square composition, no text. A solid crystal glass sphere has been radially sliced into hundreds of very long needle-thin pyramidal wedges, each tapered tip pointing inward toward the exact center, each outer end curved as part of the original sphere. The wedges levitate separated in an expanded spherical formation revealing a small luminous living entity at the center: brilliant warm white-gold light, abstract and mysterious, no face. Truly solid optical glass, visible thickness, refraction, subtle microscopic texture, rainbow dispersion and exquisite sharp caustics. This must read as an exploded solid glass ball, NOT a hollow shell, NOT flat shattered window fragments. The central light illuminates all the glass from inside. Dramatic realistic studio ray-traced rendering, crisp silhouette, centered sphere occupying 70% of image with comfortable safe margins for app icon cropping. Deep near-black graphite background. A graceful curved light trail extends from the orb, thickest at the orb and tapering to a perfect fine beam near bottom corner. Restrained warm gold and ice-blue refracted highlights. High-end Blender Cycles product render quality. No lettering, no watermark, no other objects.

Visual review: clear long solid wedges, luminous center, refractive detail and
tapered curved trail. The generated form is a stylized radial arrangement; it
is not a literal CAD model of a million mathematically tessellated slices.

On 2026-09-09 the runtime mascot changed from this single bitmap to a procedural
inline SVG in `assets/js/companion.js`. It contains forty individually addressable
wedges. `requestAnimationFrame` moves the core on two slow axes; the projection
of that offset onto each wedge's angle changes its radial distance, combined
with a per-wedge phase and rotation. The result is small, responsive, and can
stop instantly for reduced motion. The bitmap remains the app-icon source.

## 2026-09-09 trail revision

The first render's single condensed orbit line was rejected. The built-in image
editing tool preserved the sphere and replaced only that trail with a wide
volumetric field of self-similar golden-white and faint ice-blue branches.

Final edit prompt:

> Use case: precise-object-edit. Asset type: square app icon source and profile
> mascot render. Replace only the thin, condensed golden trail with a broad,
> airy haze made of luminous fractal light. It should begin near the orb, bloom
> across the lower-left and lower half, and contain delicate self-similar
> branching filaments like refracted lightning, frost dendrites, or glowing
> river deltas. Preserve the glass wedges, central entity, material, framing,
> scale, and black background. Avoid a thin orbit line, solid comet trail,
> hard-edged ribbon, smoke, fire, text, logos, or watermark.
