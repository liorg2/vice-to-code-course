# Deploy and tear down

Nothing here runs until you say so.

```bash
npm run whoami
sam validate --lint
sam build
sam deploy --config-env staging --parameter-overrides AlarmEmail=you@example.com
```

Confirm the changeset before it applies. The staging URL is the stack output `StagingUrl`.

After deploy, open the SNS subscription email and confirm it. Alarms stay silent until you do.

## Tear down

```bash
sam delete --stack-name fx-rates-staging --region us-east-1
```

Then in the console, confirm no resources tagged `project=fx` remain. Budgets are account-level and are not part of the stack; delete the lab budget yourself if you want it gone.
