# AWS account checklist

Do these in the console. This repository does not create them. Root is only for items 1 to 3.

1. Sign in as root. Turn on MFA. Confirm the root user has no access keys. Delete any that exist.
2. Still as root, create a budget with a 1 USD monthly limit and an email alert at 50 and 100 percent of actual spend. Skip the forecast alert: a new account has no usage history for it.
3. Still as root, create an IAM user named `fx-deployer` with no console password. Attach only what deploy needs (`IAMFullAccess` is what the lab allows so a missing permission can be added without going back to root, then stop using root). Create one access key and store it in your own password manager, not in this repo.
4. From here on, use `fx-deployer`. Run `npm run whoami` and confirm the ARN is that user, not root.
5. Pick one region and write it down. This lab uses `us-east-1`, set in `samconfig.toml`.

Search the repo and `git log -S AKIA` before every commit. An access key id starts with `AKIA` and must never be committed.
