<!-- OPENPRD:GENERATED
adapter=claude
source=command:grow
version=0.1.1
checksum=30e09e812c1de600
-->

# OpenPrd Grow

Treat grow as an end-of-task review layer, not an in-task interruption. Auto-apply high-confidence low-risk tool-recognition fixes such as code-extension detection; queue user preferences, project governance rules, and OpenPrd default behavior as candidates, then run `openprd grow . --review` at wrap-up for user confirmation.

Always rebuild state from `.openprd/` before acting.
