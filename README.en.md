# Product Panel

[简体中文](./README.md) | **English**

> A spec-driven development (SDD) scaffold for AI coding agents: documents first, code second. It puts the process and document structure for requirements, design, technical solution, testing and release into one git repository, so the AI can rebuild context in every new conversation and follow the process with a human in charge.

<p align="center"><img src="./overview.en.png" alt="Overview" width="760"></p>

> **Language note:** the rules, SOPs, standards and document templates in this repository are written in Chinese. This page is an English introduction; the Chinese [README](./README.md) is the primary one.

---

## What it solves

When you build a product with an AI agent, the hard part is rarely "it cannot write it". It is usually one of these:

| Problem | What the panel does |
|---------|---------------------|
| Every new conversation, the AI has forgotten where the project stands | State lives in fixed files. The AI reads them first and reports the current version, stage and open items |
| The AI skips steps: a solution before requirements are confirmed, code before test cases exist | A version moves through 9 stages. Before each move the AI checks the preconditions one by one and refuses if any is missing |
| The AI declares "done" or "tests passed" on its own | A stage is complete only when a person signs it off. Only a person can waive a test case, one at a time. AI self-review does not count |
| Documents drift apart when requirements change | Every change is logged first, with the list of affected documents, then applied |
| Documents are scattered and nobody knows which is current | Each kind of document has one location. A version holds only its own changes, which are merged into the baseline at release |
| Rules exist only in one chat or one AI's memory | Only rules written in the repository count, so they survive a change of tool or person |

## Who it is for

- Individuals or small teams building products with Claude Code, Cursor, Windsurf, Codex or similar agents
- People who want the AI involved from requirements to release, not only in coding
- New products starting from zero, or existing products that need a lasting document and process structure

It is a poor fit for one-off tasks where the AI changes a few lines, or for teams that already run a mature delivery platform and do not want to be document-driven.

## Get started in three steps

**1. Get the template**

On GitHub, click **Use this template** → **Create a new repository** to get a repository of your own without this template's commit history, then clone it.

Or clone directly:

```bash
git clone https://github.com/zt994451054/product_panel.git my-product
```

**2. Open the directory in your AI coding tool**

**3. Say one sentence to the AI**

For a new product:

```
我刚 clone 了这个面板，打算做一个全新产品，帮我开始初始化。
```

For an existing product:

```
我们有一个已上线的产品，想把它迁移到这个面板统一管理，帮我开始。
```

(The first means "I just cloned this panel and want to build a new product, help me initialize it". The second means "We have a product in production and want to manage it with this panel, help me start". You can say it in your own language.)

The AI then walks you through the checklist in [SETUP.md](./SETUP.md). To begin you answer two things: what the product is and what problem it solves, and who owns product, engineering and testing. Everything else can wait until the stage that needs it. For each item you can answer in conversation, let the AI explore your code and documents read-only and write a draft for you to review, or skip it for now.

This is a scaffold. Once initialized it is your repository, and you are free to change the process, standards and layout.

## How it works

### Every conversation

The AI's entry point is [AGENTS.md](./AGENTS.md). Each new conversation follows a fixed order:

1. **Init check**: read the configuration status table and finish the required items first
2. **Status check**: read the current version, stage and recent changes, then summarize. A stage stalled for more than 14 days is flagged
3. **Match SOP**: find the standard operating procedure for the task
4. **Read standards**: read the relevant files in `standards/` before producing anything
5. **Execute and record**: follow the SOP and write documents to their defined locations

### Version lifecycle

```
Planning → Requirements → Product design → Tech solution → Test design → Development → Testing → Release → Released
```

Some deliberate choices:

- **Test design comes before development.** The test plan and cases exist first, and developers self-test against them
- **Core implementation paths are verified before development.** Key technical assumptions are tested early, not discovered broken at acceptance
- **All tests must pass.** There is no "conditional pass". Only a person can waive a case
- **The frontend follows the prototype.** The unified prototype is the reference, and deviations are logged as defects
- **Release includes business verification in production**, not only a health check
- **Closing a version has a checklist**: merge and tag, merge changes into the baseline, clean up temporary resources

### 17 standard procedures

| Area | Procedures |
|------|-----------|
| Getting started | New product setup, onboarding an existing product, read-only exploration |
| Requirements and design | Backlog, requirements and product design, change handling |
| Engineering and testing | Technical solution, test design and execution, development and bug fixing |
| Versions and release | New version, stage gate, production acceptance |
| Production and operations | Production bug triage, hotfix, operations and infrastructure change |
| General | Preparation before any task, object storage upload |

The full index is in [AGENTS.md](./AGENTS.md) §5 and the procedures are in [agents/sop/](./agents/sop/).

## Directory guide

| Path | Purpose |
|------|---------|
| `AGENTS.md` | The AI's entry point, read in every conversation |
| `SETUP.md` | Configuration checklist: status table plus instructions per item |
| `agents/` | Procedures (SOPs), collaboration and communication rules |
| `standards/` | 59 default standards in 10 domains, usable as-is or editable. See [standards/README.md](./standards/README.md) |
| `foundation/` | Long-lived baselines across versions: market, business model, product architecture, technical architecture, unified prototype |
| `versions/` | Per-version requirements, design, solution, testing and release documents. The current version is in `versions/CURRENT.md` |
| `engineering/` | Index of engineering repositories and environment docs. Code is cloned into `workspace/` and never committed here |
| `testing/` | Index of test projects and the test strategy |
| `materials/` | Source material you give the AI (files stay out of git, only a list is kept) |
| `maintainer/` | The template's own validation suite. Not needed for daily use and safe to delete |

## Principles

- **Document-anchored**: rules and state live in repository files, not in an AI's memory
- **Human in the loop**: the AI drafts, checks and executes. Sign-off, waivers and scope changes belong to people
- **Tool-agnostic**: the rules are Markdown, so any tool that reads `AGENTS.md` works. `CLAUDE.md`, `.cursorrules` and `.windsurfrules` only point to it
- **No code in the panel**: the panel holds documents and process, and code stays in its own repositories
- **Record changes first**: log the change and its impact, then edit documents
- **Write the delta, read the baseline**: a version holds only its own changes, merged into the baseline at release

## Optional modules

Off by default and enabled when needed: internationalization (i18n), product planning (roadmap and direction), smoke testing. See "可选模块" in [SETUP.md](./SETUP.md).

## FAQ

**Do I have to fill in every configuration item before starting?**
No. Only two items are required (product basics, version and owners), which takes a few minutes. The rest can be filled in before the stage that needs them.

**The process feels heavy. Can I trim it?**
Yes. After initialization the repository is yours. Ask the AI to change the rules in `AGENTS.md` and `agents/`, and log the change in `agents/rules-log.md`.

**Where does the code go?**
In its own repositories. Register them in `engineering/README.md` and the AI clones them into `engineering/workspace/`, which git ignores. The only code in the panel is the unified prototype.

**Which AI tools are supported?**
Any tool that reads `AGENTS.md`. The process has been exercised end to end only on Claude Code. For other tools, only the entry files pointing to `AGENTS.md` have been checked.

## License

[MIT](./LICENSE). Free to use, modify and use commercially, as long as the copyright notice is kept.

## Community

- Thanks to the [LinuxDO](https://linux.do) community for their support
