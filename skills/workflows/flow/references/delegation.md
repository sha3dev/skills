# Workflow delegation

Use only when the harness permits a worker with no inherited conversation and
can retain that worker across user replies. Otherwise execute in the current
context; do not repeatedly cold-start workers for interview questions.

One worker owns one workflow run. Give it only the repository root, selected
skill location, selected application or project outcome, active change document
reference, and relevant user context or reply (including attachments not yet
recorded durably). It reads the skill, derives other facts from project artifacts,
and runs until the next stopping condition. Reuse it for replies within that run.

The worker returns `status` (`needs-input`, `complete`, or `blocked`) and a
standalone `user_message`. Relay the message. On `needs-input`, retain the worker
and its processes. On `complete` or `blocked`, ensure it stops processes it
started, then close it; preserve reused processes owned elsewhere. After
completion, route again from durable state and use a fresh worker for the next
run. Do not carry the preceding interview into the new worker.

Do not run independent writers or allow nested delegation. Workers share the
worktree; context isolation does not isolate files.
