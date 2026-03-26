# Home Dashboard — Backlog

> Feature backlog for future releases. Items are prioritized by category.
> Move items to "In Progress" when work begins, and "Done" when shipped.

---

## Backlog

### High Priority
- [ ] **Calendar Module** — Google Calendar integration to view and add events. Requires solving HTTPS/OAuth on local network (Google requires HTTPS for OAuth redirect URIs except localhost). Options: reverse proxy with self-signed cert, or use Google API Service Account. Includes: `Calendar.jsx` page, `calendar.js` route, OAuth flow, event CRUD.
- [ ] **Authentication Gate** — Simple PIN or password screen to protect the dashboard from unauthorized access on the home network. Session-based so users don't re-enter on every page load.

### Medium Priority
- [ ] **Recurring Transactions** — Support for automatically generated monthly transactions (rent, subscriptions, salary) so they don't need manual entry each month.
- [ ] **Task Notifications** — Browser push notifications or visual alerts for tasks approaching their due date.
- [ ] **Meal Plan History** — Browse and reload previous meal plans instead of only viewing the most recent one.
- [ ] **Dark Mode** — Toggle between light and dark themes across all pages.
- [ ] **Multi-Account Finance View** — Filter finance charts and summaries by individual account or view all accounts combined.

### Low Priority
- [ ] **CSV Import for Transactions** — Bulk import transactions from bank CSV exports.
- [ ] **Drag-and-Drop Tasks** — Drag task cards between columns instead of click-to-advance.
- [ ] **Meal Favorites** — Save individual meals as favorites and include them in future suggestions.
- [ ] **Budget Targets** — Set monthly budget limits per category with visual progress bars.
- [ ] **Mobile-Optimized Layout** — Responsive refinements specifically for phone-sized screens.
- [ ] **Data Backup/Export** — Export SQLite database or JSON dump for backup purposes.

---

## In Progress

_(none)_

---

## Done

_(none)_
