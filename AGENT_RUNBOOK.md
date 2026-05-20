\# Agent Runbook



This project is edited locally on Windows using cluade code.



Runtime, Docker, logs, tests, and deployment must run on the Ubuntu VPS.



Do not run production Docker commands directly on Windows.



Use PowerShell commands from the project root:



\## Push current code

.\\scripts\\remote.ps1 push



\## Deploy / run on Ubuntu

.\\scripts\\remote.ps1 up



\## Restart on Ubuntu

.\\scripts\\remote.ps1 restart



\## View recent logs

.\\scripts\\remote.ps1 logs



\## Follow live logs

.\\scripts\\remote.ps1 logs-live



\## Run tests on Ubuntu

.\\scripts\\remote.ps1 test



\## Check status

.\\scripts\\remote.ps1 status



\## Open shell on server

.\\scripts\\remote.ps1 shell



Workflow:

1\. Edit files locally.

2\. Commit and push changes.

3\. Run the required remote command through scripts/remote.ps1.

4\. Inspect logs.

5\. Fix issues locally.

6\. Repeat.



Important:

\- Do not use cluade code Remote-SSH directly into the VPS for agent execution.

\- The VPS CPU does not support required AES instructions for cluade code language server.

\- cluade code must run on Windows.

\- Ubuntu VPS is only for Docker, test, logs, and deployment.

