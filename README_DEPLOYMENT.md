# Deployment Guide — AWS Amplify & Cognito

This document contains step-by-step deployment notes specific to AWS Amplify and Cognito for the AML_Airlines project.

## 1. Prepare the repo
- Ensure `.nvmrc` specifies Node 18 (project tested with Node 18.x).
- Ensure `next.config.mjs` has `output: 'standalone'` for SSR compatibility.
- Add `amplify.yml` to the repo (example provided in project) or configure build commands in Amplify Console.

## 2. Set environment variables in Amplify Console
In Amplify Console → App → Environment variables (Manage variables): add the following keys (replace placeholders):

```
DB_HOST=database-2.cb6s00o60fm5.eu-north-1.rds.amazonaws.com
DB_NAME=FlightApp
DB_USER=admin
DB_PASSWORD=your-db-password
DB_PORT=1433

AMADEUS_CLIENT_ID=your-amadeus-client-id
AMADEUS_CLIENT_SECRET=your-amadeus-client-secret

COGNITO_ISSUER=https://cognito-idp.<region>.amazonaws.com/<userPoolId>
COGNITO_DOMAIN=https://your-domain.auth.<region>.amazoncognito.com
COGNITO_CLIENT_ID=your-cognito-client-id
COGNITO_CLIENT_SECRET=your-cognito-client-secret
COGNITO_REDIRECT_URI=https://<your-amplify-domain>/api/auth/oidc/callback
COGNITO_LOGOUT_REDIRECT_URI=https://<your-amplify-domain>/
COGNITO_SCOPES=openid email profile

AUTH_SESSION_SECRET=replace_with_random_secure_value
```

Notes:
- Never commit these secrets to source control.
- After adding or changing env vars, trigger a redeploy.

## 3. Cognito: Configure App Client allowed URLs
In AWS Cognito Console (User Pools) → select user pool → App integration → App client settings (Hosted UI):
- Add `https://<your-amplify-domain>/api/auth/oidc/callback` to **Allowed callback URLs**
- Add `https://<your-amplify-domain>/` to **Allowed sign-out URLs**
- Save changes

Keep your local `localhost` callback URLs listed as well for development.

## 4. Build settings (amplify.yml)
Example `amplify.yml` (project includes a file):
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - nvm install 18
        - nvm use 18
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

## 5. Common deployment issues & solutions
- Redirect to localhost after login:
  - Confirm `COGNITO_REDIRECT_URI` env var in Amplify matches the Amplify domain.
  - Confirm `login` route passes `redirect_uri` explicitly to the authorizationUrl.
  - Clear browser cookies / test in incognito.

- Next.js static export errors (DYNAMIC_SERVER_USAGE):
  - Ensure API routes that use `request.url`, cookies or headers include:
    ```js
    export const dynamic = 'force-dynamic'
    ```

- Client caching of redirect URI:
  - `lib/oidc.js` must construct a fresh `openid-client` instance or be recreated at runtime so it picks up env var changes.

## 6. Post-deploy verification
1. Visit your Amplify domain and click Sign Up.
2. Confirm you are redirected to Cognito hosted UI.
3. After sign-in, confirm you are redirected back to `https://<your-amplify-domain>/profile` not localhost.
4. Check Amplify/CloudWatch logs for these debug messages (we added logs):
   - `[LOGIN] Using redirect_uri:`
   - `[CALLBACK] Final redirect:`

## 7. Rollback & debugging
- If a deployment introduces regression, use Amplify Console to restore a previous successful build.
- For runtime debugging, add temporary `console.log` statements to server routes (avoid logging secrets).

---
This guide assumes you already have a Cognito user pool and an App Client created for OIDC. If you need a walkthrough for creating a Cognito user pool and app client, tell me and I will add step-by-step instructions.
