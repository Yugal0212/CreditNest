# How to Get CreditNest on Google Search (SEO Guide)

Congratulations! Your application has been fully optimized with technical SEO (Metadata, JSON-LD Structured Data, canonical tags, `sitemap.xml`, and `robots.txt`).

Now that the code is ready, you must manually register the live domain (`credit-nest.vercel.app` or your custom domain) with Google so they know your site exists.

Follow these exact steps:

### Step 1: Create a Google Search Console Account
1. Go to [Google Search Console](https://search.google.com/search-console/about).
2. Click **Start Now** and log in with your Google Account.

### Step 2: Add Your Website Property
1. In the top-left dropdown, click **Add Property**.
2. You will see two options: **Domain** or **URL Prefix**.
3. **Important**: Since you are currently on Vercel (`https://credit-nest.vercel.app/`), choose **URL Prefix**.
4. Paste your exact live URL: `https://credit-nest.vercel.app/` and click **Continue**.

### Step 3: Verify Ownership
Because you selected URL Prefix, you have multiple verification options.
1. The easiest method is **HTML Tag**.
2. Expand the HTML Tag section and copy the meta tag provided by Google (it looks like `<meta name="google-site-verification" content="YOUR_CODE" />`).
3. You can paste the `YOUR_CODE` portion into `Frontend/app/layout.tsx` in the `metadata` object:
   ```typescript
   export const metadata = {
     verification: {
       google: 'YOUR_CODE_HERE',
     },
   }
   ```
4. Deploy your code to Vercel.
5. Go back to Google Search Console and click **VERIFY**.

### Step 4: Submit Your Automated Sitemap
I have automatically created a dynamic sitemap for you at `/sitemap.xml`.
1. In Google Search Console, click on **Sitemaps** in the left menu.
2. In the "Add a new sitemap" bar, type `sitemap.xml` and click **Submit**.
3. Google will now automatically crawl and index your public pages.

### Step 5: Force Immediate Indexing
To get on Google faster (instead of waiting days):
1. Copy your live homepage URL (`https://credit-nest.vercel.app/`).
2. Paste it into the top search bar of Google Search Console and hit Enter.
3. Click **REQUEST INDEXING**.

### Step 6: Monitor Your Traffic
- It typically takes 24-72 hours for your site to appear on Google after submitting the sitemap.
- You can now track your search traffic, keywords, and Core Web Vitals directly from the Search Console dashboard!
