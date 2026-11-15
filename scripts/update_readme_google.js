import fs from 'fs';

let content = fs.readFileSync('README.md', 'utf8');

const targetSection = `## 🔐 Google Cloud Console OAuth 2.0 Setup

ChronoForge features official Google Sign-In powered by **Google Cloud Console OAuth 2.0 (Google Identity Services)**. Administrators sign in directly with their verified Google Account, and school schedules in IndexedDB are partitioned securely per Google User ID.

### Setup Instructions for Google Cloud Console

1. **Open Google Cloud Console:**
   - Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
   - Select or create your Google Cloud Project.

2. **Configure OAuth Consent Screen (First Time Only):**
   - In the left menu, select **OAuth consent screen**.
   - User Type: Choose **External** (or Internal if using Google Workspace).
   - App Name: \`ChronoForge\`
   - User support email & Developer contact info: Your email.
   - Scopes: Default scopes (\`openid\`, \`email\`, \`profile\`).

3. **Create OAuth 2.0 Client ID:**
   - Go to **Credentials** > Click **+ CREATE CREDENTIALS** > Select **OAuth client ID**.
   - Application type: **Web application**.
   - Name: \`ChronoForge Web Client\`.

4. **Add Authorized JavaScript Origins:**
   - Under **Authorized JavaScript origins**, click **+ ADD URI** and add:
     - \`http://localhost:5173\` (Local development)
     - \`https://software-srt.vercel.app\` (Vercel production deployment)
   - *(Note: Do NOT add a trailing slash)*.

5. **Copy Client ID to \`.env\`:**
   - Click **Create** to obtain your Client ID (format: \`xxxxxxxx.apps.googleusercontent.com\`).
   - Add it to your local \`.env\` file:
     \`\`\`env
     VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
     \`\`\`
   - Also add \`VITE_GOOGLE_CLIENT_ID\` in your **Vercel Project Settings > Environment Variables** for production.

6. **In-App Dynamic Setup:**
   - You can also click **Google Console OAuth Settings** directly on the ChronoForge login screen to paste your Client ID or copy the authorized origins with one click.
`;

const oldRegex = /## 🔐 Google Authentication & Firebase Setup[\s\S]*?(?=## [^\n]*License)/;
if (oldRegex.test(content)) {
  content = content.replace(oldRegex, targetSection + '\n\n');
  fs.writeFileSync('README.md', content, 'utf8');
  console.log('README.md updated with Google Cloud Console OAuth documentation');
} else {
  console.log('Target section not matched');
}
