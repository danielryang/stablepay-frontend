# PayPal OAuth Setup Guide

Follow these steps to set up PayPal OAuth for your app:

## Step 1: Create PayPal Developer Account

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Sign in with your PayPal account (or create one if you don't have one)
3. Click "Dashboard" in the top navigation

## Step 2: Create a New Application

1. In the PayPal Developer Dashboard, click **"Create App"** or go to **"My Apps & Credentials"**
2. Fill in the application details:
   - **App Name**: `Stable Living` (or any name you prefer)
   - **Merchant**: Select your business account (or personal account for testing)
   - **App Type**: Select **"Log in with PayPal"** or **"Merchant"**
3. Click **"Create App"**

## Step 3: Get Your Credentials

After creating the app, you'll see:
- **Client ID**: Copy this (you'll need it)
- **Client Secret**: Click "Show" and copy this (you'll need it too)

**Important**: Keep these credentials secure! Never commit them to git.

## Step 4: Configure Redirect URI

### Finding the Redirect URI Field

The location depends on your app type. Here's where to look:

#### Option 1: "Log in with PayPal" App Type
1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/developer/applications/)
2. Click on your app name to open its details
3. Look for one of these sections:
   - **"Return URL"** field (may be near the top)
   - **"Redirect URIs"** section (may be in a separate tab)
   - **"Advanced Settings"** or **"App Settings"** tab
   - **"OAuth Settings"** section

#### Option 2: If You Don't See "Return URL"
Some PayPal apps don't require a redirect URI if they're set up differently. Try this:

1. **Check App Type**: Make sure your app type is **"Log in with PayPal"** (not "Merchant" or "Marketplace")
2. **Create a New App**: If needed, create a new app specifically for "Log in with PayPal"
3. **Look in Advanced Settings**: Click on your app → Look for tabs like "Settings", "Advanced", or "OAuth"

#### Option 3: Alternative Location
1. In the PayPal Developer Dashboard
2. Click **"My Apps & Credentials"** in the top navigation
3. Find your app in the list
4. Click the **pencil/edit icon** or click on the app name
5. Scroll down to find **"Return URL"** or **"Redirect URIs"**

### Getting Your Redirect URI

**To get your redirect URI**:
1. Run your Expo app: `npm start` or `npx expo start`
2. Open the app in Expo Go or web browser
3. Navigate to the Send screen and toggle PayPal
4. Check the console logs - you'll see: `PayPal Redirect URI: https://auth.expo.io/...`
5. Copy that exact URL

### Adding the Redirect URI

Once you find the field:
1. Click **"Add Return URL"** or **"Add Redirect URI"** button (if there's a button)
2. OR directly paste the URL into the **"Return URL"** text field
3. Paste the redirect URI from your console
4. Click **"Save"** or **"Update"**

**Note**: Some PayPal apps may not show the redirect URI field until you've set up OAuth properly. If you can't find it, the redirect URI might be automatically handled, or you may need to contact PayPal support.

### Multiple Redirect URIs

You may need to add multiple redirect URIs:
- **For Expo Go/Web Development**: `https://auth.expo.io/@your-username/stable-living-frontend` (from console)
- **For Production Mobile**: `stablelivingfrontend://paypal-callback` (your custom scheme)

## Step 5: Set Up Environment Variables

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add your PayPal credentials:

```env
EXPO_PUBLIC_PAYPAL_CLIENT_ID=your_client_id_here
EXPO_PUBLIC_PAYPAL_CLIENT_SECRET=your_client_secret_here
```

3. Replace `your_client_id_here` and `your_client_secret_here` with your actual credentials from Step 3

## Step 6: Install Environment Variables Support (if needed)

If you haven't already, you may need to install `expo-constants` (already in your dependencies) and restart your Expo server:

```bash
npm start
```

## Step 7: Test the Integration

1. Restart your Expo development server
2. Open your app and navigate to the Send screen
3. Toggle the switch to "Send to PayPal"
4. Click "Connect PayPal"
5. You should be redirected to PayPal's login page
6. After logging in, you'll be redirected back to your app

## Troubleshooting

### Redirect URI Mismatch Error
- **Problem**: PayPal says "redirect_uri mismatch"
- **Solution**: Make sure the redirect URI in PayPal dashboard exactly matches what's logged in your console (including `https://` and any paths)

### "Invalid Client" Error
- **Problem**: Getting "invalid_client" error
- **Solution**: 
  - Double-check your Client ID and Client Secret in `.env`
  - Make sure there are no extra spaces or quotes
  - Restart your Expo server after changing `.env`

### Sandbox vs Production
- **Sandbox**: For testing, use PayPal Sandbox accounts
- **Production**: For real users, use live PayPal accounts
- The OAuth endpoints are the same, but you can switch between sandbox and production in PayPal dashboard

## Security Notes

⚠️ **Important Security Considerations**:

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Client Secret**: In production, the token exchange (authorization code → access token) should be done **server-side**, not in the client app
3. **Current Implementation**: The current code does token exchange client-side for demo purposes. For production, you should:
   - Create a backend API endpoint
   - Send the authorization code to your backend
   - Have your backend exchange it for an access token
   - Return user info to your app

## Next Steps

Once you have PayPal OAuth working:
- Consider implementing server-side token exchange for production
- Add error handling for network failures
- Add loading states during authentication
- Store PayPal connection status securely

