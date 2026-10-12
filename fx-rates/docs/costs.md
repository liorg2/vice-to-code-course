# Costs

This file was written before a deploy, so AWS Billing has no rows for this stack yet.

What the template can charge if you deploy it:

- Lambda requests and duration for the request function, the hourly refresh, and any synthetic check you add.
- HTTP API requests.
- DynamoDB on-demand reads and writes. An empty table still exists.
- CloudWatch logs, kept 14 days, and three alarms.
- SNS email, which is free at this volume.

A low budget alert (1 USD) is in `docs/aws-setup.md`. If Billing shows no data after deploy, write "not yet visible" and the date you looked.

Teardown: `sam delete --stack-name fx-rates-staging --region us-east-1`.
