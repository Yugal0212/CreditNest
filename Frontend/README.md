# Smart Credit SCMS - Frontend

This is the frontend for the Smart Credit Management System, built with Next.js 14.

## 📱 PWA Support (Progressive Web App)

The app is configured as a full PWA. To test it on a mobile device, follow the instructions below.

## 🚀 How to Test on Mobile using Vercel & Local Backend

Since PWAs require **HTTPS** to be installable on mobile devices, the easiest way to test is to deploy the frontend to Vercel and use a tunnel for your local backend.

### Step 1: Deploy Frontend to Vercel
1. Push your code to a GitHub repository.
2. Import the repository into [Vercel](https://vercel.com).
3. Vercel will give you a live `https://your-app.vercel.app` URL.
4. **⚠️ Important**: In Vercel's "Build and Output Settings", ensure the settings are as follows:
   * **Build Command**: `next build --webpack` (or turn off the override to use `package.json` scripts).
   * **Output Directory**: Leave as default (`Next.js default`).
   * **Install Command**: Leave as default (it will auto-detect based on your lock file).

### Step 2: Expose your Local Backend
Since your frontend is on HTTPS (Vercel), your backend must also be on HTTPS to prevent "Mixed Content" security blocks.

1. Open a terminal on your laptop.
2. Run this command to expose your backend (running on port 5000):
   ```bash
   npx localtunnel --port 5000
   ```
3. Copy the URL it gives you (e.g., `https://random-words.loca.lt`).

### Step 3: Update Vercel Environment Variables
1. Go to your project dashboard on Vercel.
2. Go to **Settings** -> **Environment Variables**.
3. Add or update the following variable:
   * **Key**: `NEXT_PUBLIC_API_URL` (or whatever variable your project uses for the API)
   * **Value**: The `https://...` link you got from `localtunnel` in Step 2.
4. Redeploy your project on Vercel or restart the deployment.

---

## 🛠️ Local Development (PWA Testing)

If you want to test the PWA locally on your computer:

1. Build the project:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm run start
   ```
3. Open `http://localhost:3000` in your browser. The install icon will appear in the address bar.
