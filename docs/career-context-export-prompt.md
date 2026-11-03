# Career-context export prompt

Use this prompt in the work Copilot workspace only if employer policy permits using that assistant and exporting the selected information for a personal portfolio. It does not authorize exporting confidential material. Review the output yourself before sharing it with another workspace or service.

The prompt is a standalone copy/paste task, not an installed Copilot customization. Replace bracketed inputs as needed.

---

Help me draft a sanitized, factual Markdown career summary for my personal professional portfolio and current resume. The focus is my career progression and leadership in my current organization, FMG, including my path toward/as a Director of Software Engineering. Treat that role/title as something to verify, not an assumption.

## Scope and authorization

- Work only with sources I explicitly identify as authorized for this purpose: [list approved source titles/locations, or provide approved excerpts].
- If I have not supplied an approved source list or excerpts, stop and ask me for them. Do not search the entire workspace, internal systems, chat history, or repositories by default.
- Follow employer policy and source permissions. Do not bypass restrictions or infer that accessibility means permission to export.
- Use only information approved for external use. If a fact's disclosure status is uncertain, omit its substance and mark it as requiring my review; do not reproduce the uncertain detail in a warning or appendix.
- Do not include source code, credentials, internal URLs/file paths, internal architecture diagrams, confidential financial/operating metrics, unreleased plans, customer/coworker identities, direct quotations from internal communications, HR/performance records, or other people's personal information.
- Do not open links, call external services, or transfer/upload anything for this task.
- Produce a draft for my review in chat. Do not write files, commit, publish, modify work artifacts, or add anything to memory.

## Evidence and accuracy

- Separate facts supported by approved sources from candidate phrasing and unanswered questions.
- Do not invent titles, dates, reporting scope, metrics, tools, achievements, or decisions.
- Distinguish work I led, directly implemented, influenced, and work accomplished by the broader team.
- Use only metrics explicitly permitted for external disclosure. Otherwise use a qualitative description if its underlying fact is externally shareable; do not disguise confidential metrics as ranges or derived percentages.
- Generalize project/customer names only when the underlying description is itself approved for external disclosure. An alias does not make confidential content exportable.
- Use safe source labels such as `S1: approved resume, reviewed YYYY-MM-DD`, not internal links, filenames, or source excerpts.
- Identify contradictory facts without copying confidential details. Use `Unknown - owner confirmation needed` where evidence is absent.

## Output format

Return one self-contained Markdown draft with the following sections. Keep it concise: aim for 800-1,200 words; never add filler to reach that range. If approved evidence is sparse, return a shorter draft with gaps.

### 1. Export status and boundaries

- Draft date.
- State: `DRAFT - OWNER REVIEW REQUIRED - NOT APPROVED FOR PUBLICATION`.
- Only sources explicitly authorized for this task were used.
- Brief non-sensitive description of exclusions.
- Note that planning use, public website use, and AI knowledge-base ingestion require separate owner review and permitted disclosure.

### 2. Career timeline

Table: organization/public alias, verified title, dates at approved precision, public-safe scope/responsibilities, source label, verification status.

Include role progression within FMG where authorized and supported. Do not recreate pre-FMG history without an approved source.

### 3. Leadership scope

Summarize supported examples of team development, coaching, hiring, delivery ownership, architecture direction, cross-functional partnership, and operating practices. Include team-size/budget/reporting details only if explicitly approved for external use. Do not infer scope from a title.

### 4. Three to five impact stories

For each supported example, use:

- Context/problem, at a public-safe level.
- My actual role and what the team did.
- Decision/tradeoff or leadership action.
- Approved outcome; qualitative if an externally shareable metric is unavailable.
- What it demonstrates about my leadership.
- Safe evidence label and any facts I must confirm.

Return fewer examples if there is not enough approved evidence.

### 5. Public-safe project summaries

For each permitted example: approved name/alias, purpose, my contribution, high-level technology/architecture only if approved, outcome, and whether linking/naming is confirmed or still needs permission. Omit projects whose core facts cannot be exported.

### 6. Suggested professional positioning

Draft a short headline and 100-150 word executive summary using only verified exportable facts. Label both as suggested wording, not approved public copy. Avoid unsupported superlatives or implying sole credit for team outcomes.

### 7. Resume reconciliation and open questions

List missing dates, conflicting titles, unsupported claims, publication permissions, and gaps a recent resume could resolve. Do not choose a winner between conflicting sources without asking me.

### 8. Owner review checklist

- [ ] Employer/source policy permits each included fact to leave this workspace.
- [ ] Titles, dates, role scope, and attribution are correct.
- [ ] No confidential/client/third-party personal information is included.
- [ ] All included metrics, project names, technologies, and descriptions may be disclosed externally.
- [ ] Source labels reveal no internal locations or sensitive source material.
- [ ] I have selected which wording, if any, is approved for my public resume/site.
- [ ] I have separately selected which approved facts may be used by a public portfolio agent.

Leave every checklist item unchecked. Do not claim that I or my employer have approved the draft.
