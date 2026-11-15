import fs from 'fs';

let content = fs.readFileSync('README.md', 'utf8');

const authSection = `
---

## 🔐 Google Authentication & Firebase Setup

ChronoForge features seamless Google Authentication via Firebase Auth with automated fallbacks (\`signInWithPopup\` on desktop and \`signInWithRedirect\` on mobile/in-app webviews/blocked popups), alongside offline demo guest login.

### Setup Steps

1. **Create a Firebase Project:**
   - Visit the [Firebase Console](https://console.firebase.google.com/).
   - Click **Add project** and provide a project name (e.g. \`chronoforge-app\`).
   - Complete the wizard (Google Analytics is optional).

2. **Enable Google Sign-In Provider:**
   - In the Firebase Console left navigation, navigate to **Build** > **Authentication**.
   - Under the **Sign-in method** tab, click **Add new provider** and select **Google**.
   - Toggle **Enable**, select your project support email, and click **Save**.

3. **Configure Authorized Domains:**
   - In **Authentication** > **Settings** > **Authorized domains**, confirm or add:
     - \`localhost\` (default for local development)
     - \`127.0.0.1\`
     - Your deployed Vercel domain (e.g., \`software-srt.vercel.app\` or any custom domain).

4. **Copy Configuration to \`.env\`:**
   - Go to Project Settings (gear icon) > **General**, scroll to **Your apps**, and select the Web (\`</>\`) icon.
   - Copy the Firebase configuration parameters into your local \`.env\` file (modeled after \`.env.example\`):
     \`\`\`env
     VITE_FIREBASE_API_KEY=your_api_key_here
     VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     VITE_ENABLE_DEMO_LOGIN=true
     \`\`\`

5. **Offline & Demo Mode:**
   - Setting \`VITE_ENABLE_DEMO_LOGIN=true\` provides an instant fallback allowing administrators, evaluators, and automated test runners to experience all features offline without Firebase credentials.
`;

if (!content.includes('Google Authentication & Firebase Setup')) {
  if (content.includes('License')) {
    content = content.replace(/(## [^\n]*License)/, authSection + '\n$1');
  } else {
    content += authSection;
  }
  fs.writeFileSync('README.md', content, 'utf8');
  console.log('README.md successfully updated with Firebase Auth section');
} else {
  console.log('Firebase Auth section already present');
}
