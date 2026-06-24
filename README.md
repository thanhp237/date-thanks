# Date Invitation

Single-page date invitation with a Vercel serverless email confirmation endpoint.

## Deploy on Vercel

1. Import this repository into Vercel.
2. Add these Environment Variables in Vercel Project Settings:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=sms.system.noreply@gmail.com
SMTP_PASS=<gmail-app-password>
TO_EMAIL=minthanh237@gmail.com
```

3. Deploy.

When the recipient clicks `Chốt lịch`, the page posts to `/api/confirm` and sends a confirmation email to `TO_EMAIL`.

Do not commit real Gmail app passwords into this repository.
