# broken-binding-infirmary-alert

GitHub Actions workflow that monitors [The Broken Binding SE Infirmary](https://thebrokenbindingsub.com/collections/the-infirmary) for new special edition listings and sends an email alert when one appears.

Runs every 15 minutes. Uses a private GitHub Gist as a lightweight state store - no database needed.

## How it works

1. Fetches the Infirmary product list from the Shopify API
2. Compares product IDs against the last known state stored in a private Gist
3. Sends an email alert via [Resend](https://resend.com) for any new products found
4. Updates the Gist with the current product list

## Setup

### 1. Create a private Gist

Go to [gist.github.com](https://gist.github.com), create a **private** Gist with a single file named `infirmary-state.json` and this initial content:

```json
{}
```

Copy the Gist ID from the URL - it looks like `https://gist.github.com/your-user/abc123def456`, where `abc123def456` is the ID.

### 2. Generate a GitHub token

Go to [github.com/settings/tokens](https://github.com/settings/tokens) and generate a new token (classic).

- Give it a name like `tbb-gist-token`
- Select only the **`gist`** scope
- Copy the token

### 3. Set up Resend

1. Create a free account at [resend.com](https://resend.com)
2. Add and verify a domain you own - Resend walks you through adding the DNS records
3. Go to **API Keys -> Create API Key** and copy it
4. Your `RESEND_FROM` address can be anything at your verified domain, e.g. `alerts@yourdomain.com`

> **No domain?** Resend's free sandbox lets you send to your own address using `onboarding@resend.dev` as the `from` — fine for personal use.

### 4. Add GitHub Secrets

In this repo go to **Settings -> Secrets and variables -> Actions -> New repository secret** and add:

| Secret           | Value                                         |
| ---------------- | --------------------------------------------- |
| `RESEND_API_KEY` | API key from Resend dashboard                 |
| `RESEND_FROM`    | Verified sender address e.g. `alerts@you.com` |
| `ALERT_EMAIL`    | Email address to receive alerts               |
| `GIST_ID`        | Gist ID from step 1                           |
| `GIST_TOKEN`     | Token from step 2                             |

### 5. Trigger a manual first run

Go to **Actions -> Infirmary Monitor -> Run workflow**.

The first run seeds the Gist with the current product IDs and sends no alert. Subsequent runs will alert on anything new.

## Local development

```bash
npm install
npm test
```

To run locally, create a `.env` file with your secrets and run:

```bash
npx ts-node src/index.ts
```

## Scheduling via cron-job.org

GitHub Actions' built-in cron scheduler is unreliable and can delay runs by 30+ minutes. To fix this, [cron-job.org](https://console.cron-job.org) triggers the workflow on a reliable schedule instead.

The cron job hits GitHub's `workflow_dispatch` API every 15 minutes, which kicks off the workflow immediately and accurately.

**To manage or recreate it:** go to [console.cron-job.org](https://console.cron-job.org) and log in.

Settings used:

| Field | Value |
| --- | --- |
| URL | `https://api.github.com/repos/EamonnHegarty/broken-binding-infirmary-alert/actions/workflows/infirmary-check.yml/dispatches` |
| Method | `POST` |
| Schedule | Every 15 minutes |
| Header: `Authorization` | `Bearer <github token with workflow scope>` |
| Header: `Accept` | `application/vnd.github+json` |
| Header: `Content-Type` | `application/json` |
| Body | `{"ref":"main"}` |

The GitHub token needs the **`workflow`** scope (separate from the `gist` token used for state). Generate one at [github.com/settings/tokens](https://github.com/settings/tokens).

cron-job.org is free with no usage limits for this kind of lightweight trigger.

## Note on inactivity

GitHub automatically pauses scheduled workflows on repos with no activity for 60 days. GitHub will email you when this happens - just re-enable the workflow from the Actions tab. The cron-job.org trigger will also stop working if the workflow is paused.
