<!-- OPENPRD:GENERATED
adapter=claude
source=command:visual-compare
version=0.1.1
checksum=c21d4d9210bb2d01
-->

# OpenPrd Visual Compare

When UI work has a reference effect image or user-provided design, capture the implemented UI screenshot, then run `openprd visual-compare . --reference <effect-image> --actual <implementation-screenshot>`.
The command creates a side-by-side JPG under `.openprd/harness/visual-reviews/` by default, with Simplified Chinese labels: left `效果图`, right `实现截图`.
Inspect the generated image and keep iterating until there are no obvious visual differences before claiming completion.

Always rebuild state from `.openprd/` before acting.
