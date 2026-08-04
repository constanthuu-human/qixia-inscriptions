# Image assets

This folder contains images used by the compiled homepage, static Jiankang Historical Network pages, and the Qixia temple atlas. Homepage-specific files live in `home/`.

When adding a new image:

- use a descriptive lowercase filename;
- prefer WebP for documentary photographs when compatibility permits;
- keep maps and diagrams lossless when text detail is important;
- add accurate `alt` text where the image is used;
- record the source and license in the related page content.

The compiled homepage references files in `home/` through mechanically updated paths in `site.js`. If the original React/Vite project is recovered, make future path changes in that source project and rebuild the bundle.

The temple atlas reuses the homepage's three historical maps from `home/`. Its remaining maps use lossless WebP files (`p4.webp` through `p6.webp`) to preserve every pixel while reducing transfer size.
