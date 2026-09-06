# Existing worker workspace

Use this only when the selected worker already has a workspace.

1. Inspect existing scripts and their imports without running them. Reuse an
   established review-only entry point when present. Never start the worker's
   `dev` or `start` command merely to review its documentation.
2. If the preview is missing, adapt the bundled `assets/` into `src/review/`:
   `app.ts`, `render.ts`, `contract-types.ts`, a contract module, and the tests
   under `src/review/tests/`. Copy CSS to `public/worker-reference.css` and adjust
   the app's stylesheet file URL to `../../public/worker-reference.css`.
   Inspect target paths first; preserve existing files and use another documented
   review directory if those names belong to runtime code.
3. Add a review-only `server.ts` that imports the review app, binds to
   `127.0.0.1`, and pins its port. Reuse an established review port; otherwise use
   `4500 +` the worker's zero-based position among project worker applications.
   Apply the shared port-ownership rules. Record the command and URL in `surface.md`.
4. Add `review:dev` (`tsx watch src/review/server.ts`) and, when existing tests
   do not discover them, `review:test` (`tsx --test "src/review/tests/**/*.test.ts"`).
   Preserve existing scripts. Add only missing root-pinned dependencies used by
   the preview. Run the review tests as this phase's workspace tests.
5. Supply configuration metadata from a module whose import does not start tasks,
   load live environment values, or connect services. If existing metadata is
   coupled to startup, read its definitions and maintain an explicit documentation
   projection, checked against that source on each configuration revision.
   Do not refactor the runtime merely to create this page. Preserve names and
   record this projection boundary in `surface.md`.

Start only the review command. Verify the page and links under the shared
incremental rules. No background execution is required to complete this phase.
