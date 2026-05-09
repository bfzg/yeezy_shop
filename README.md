# YEZI Shop

## Payment setup

Copy `.env.example` to `.env.local` and replace the example values with your real credentials.

## Store config

`SHIPPING_FLAT_RATE_USD`

Used by the server to calculate the fixed shipping amount for checkout and order creation.

What to provide: a USD amount in decimal format.

Example:

```env
SHIPPING_FLAT_RATE_USD=24.99
```

### PayPal

`PAYPAL_CLIENT_ID`

Used by the frontend PayPal checkout flow to identify your PayPal app.

What to provide: the Client ID from the PayPal Developer Dashboard for your app.

Example:

```env
PAYPAL_CLIENT_ID=AXExampleClientIdFromPayPalDeveloperDashboard
```

`PAYPAL_SECRET`

Used by the server to securely create or capture PayPal orders.

What to provide: the Secret for the same PayPal app as the client ID above.

Example:

```env
PAYPAL_SECRET=EGExampleSecretFromPayPalDeveloperDashboard
```

`PAYPAL_API_BASE_URL`

Used by the server when calling PayPal's Orders API.

What to provide: the correct REST API base URL for the environment you are using.

Example:

```env
PAYPAL_API_BASE_URL=https://api-m.sandbox.paypal.com
```

### Apple Pay

Apple Pay is optional and currently disabled by default in this project.

`NEXT_PUBLIC_APPLE_PAY_ENABLED`

Feature flag for showing or enabling Apple Pay in the frontend.

What to provide: `true` if Apple Pay is configured, otherwise keep `false`.

Example:

```env
NEXT_PUBLIC_APPLE_PAY_ENABLED=false
```

`APPLE_PAY_MERCHANT_ID`

Used to identify your Apple Pay merchant profile.

What to provide: the Merchant ID created in your Apple Developer account.

Example:

```env
APPLE_PAY_MERCHANT_ID=merchant.com.example.yezi
```

`STRIPE_SECRET_KEY`

Used if you plan to process Apple Pay through Stripe.

What to provide: your Stripe secret key for the target environment.

Example:

```env
STRIPE_SECRET_KEY=sk_test_example_replace_me
```

## Notes

- For local development, use PayPal Sandbox `client id`, `secret`, and `https://api-m.sandbox.paypal.com` first.
- Do not commit real secrets to the repository.
- If you are not using Apple Pay yet, leave the Apple Pay values as the defaults from `.env.example`.
