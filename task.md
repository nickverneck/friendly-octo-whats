# Task List

- [ ] Confirm config schema + assumptions (timezone, day window, regex, sheet headers, "latest entry" definition, title->message mapping, config format)
- [ ] [P1] Scaffold Bun + TS project structure and scripts
- [ ] [P1] Define config loader/validator and sample `config.toml`
- [ ] [P1] Implement Wassenger API client (send message, list groups)
- [ ] [P1] Implement Google API auth/client setup (Calendar + Sheets)
- [ ] Implement calendar polling flow (compute day window, fetch events, filter titles)
- [ ] Implement groupname extraction + dedupe
- [ ] Implement Sheets lookup for groupname -> groupid
- [ ] Wire scheduler to run hourly with locking and logging
- [ ] Implement webhook workflow (latest sheet row -> groupname -> group list -> update Sheet)
- [ ] Add run instructions and minimal verification steps in README
