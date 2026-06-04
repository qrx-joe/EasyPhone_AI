<!-- OPENPRD:GENERATED
adapter=claude
source=command:verify
version=0.1.1
checksum=7a6a994631a86e25
-->

# OpenPrd Verify

Run `openprd run . --verify`. It verifies standards, workspace validation, the currently focused change structure (not just the global active change), and active discovery state, then reports `taskReady` separately from `workspaceReady`.

Always rebuild state from `.openprd/` before acting.
