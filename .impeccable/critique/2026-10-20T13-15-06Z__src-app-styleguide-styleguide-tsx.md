---
target: /styleguide page
total_score: 27
max_score: 36
na_heuristics: 5
p0_count: 0
p1_count: 2
timestamp: 2026-10-20T13-15-06Z
slug: src-app-styleguide-styleguide-tsx
---
Method: dual-agent. Browser overlay skipped (Chrome extension not connected).
Score 27/36 (Good, 75%; Error Prevention n/a). H1 3, H2 4, H3 2, H4 3, H6 3, H7 2, H8 3, H9 3, H10 4.
Detector: 0 findings (styleguide, components, login, set-password). Side-effect scan: all 8 action/realtime components overridden.
P1 Navigation leaks: TabBar, DoctorSidebar nav, PatientPanel and ConversationList links leave the page despite "Safe to click".
P1 Review buried at bottom: add "Decisions needed (N)" summary under h1, TOC count, sort Fix > Merge > Check.
P2 Phone iframe remounts on every hash change; follows hash only. Use postMessage.
P2 Stage sizes still vary; resize handles invisible. One Stage helper with named sizes.
P3 TOC ~40 flat links: collapsible groups, filter, issue dots.
Minor: Coverage "Where" says "On this page" not the section; Jump-to select double-labelled; "Nothing changed yet" will go stale.
