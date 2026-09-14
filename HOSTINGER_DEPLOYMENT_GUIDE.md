# SelectedJobs.in - Hostinger Single Deployment Guide

The native Hostinger Single hosting package has been compiled and is ready for upload. It requires **no Vercel, no monthly subscriptions, and no complex database setup**.

---

## Deployment Package Summary

**Package Location on your computer:**
`C:\Users\DELL\Desktop\SelectedJobs\selectedjobs_hostinger_deploy.zip`

### Files Included:
1. **`index.html`**: The complete frontend portal matching your reference design:
   - Royal Blue top banner with portal title and branding
   - Crimson Red navigation bar with Mega Menu, category quick links, and search modal
   - Top 8 colored highlight grid (Gold, Sky Blue, Pale Yellow, Plum)
   - 3-column category boxes with blue headers and animated `NEW` badges
   - 3-column "READ MORE / LATEST POSTINGS" section
   - Authentic educational and informational cards
2. **`job.html`**: Dynamic job detail page with Google Jobs schema (JSON-LD), salary, eligibility, and direct apply link.
3. **`post-job.html`**: Admin-only job posting form protected by your passkey (`selectedadmin2026`). Allows instant publishing to the live feed.
4. **`admin.html`**: Complete moderation and stats dashboard to approve, reject, feature, and delete job openings.
5. **`api.php`**: Secure PHP backend handling data read/write, admin authentication, and moderation.
6. **`.htaccess`**: Clean URL routing (`/post-job`, `/admin`, `/jobs/:id`) and security protection.
7. **`data/jobs.json`**: Pre-seeded database with 20+ realistic job openings.

---

## Step-by-Step Instructions to Deploy on Hostinger

### Step 1: Point DNS Back to Hostinger
Earlier, DNS records were changed to point to Vercel. We need to point them back to your Hostinger server:
1. In your **Hostinger hPanel**, go to **Domains** &rarr; **selectedjobs.in** &rarr; **DNS / Nameservers**.
2. Scroll to the bottom and click **"Reset to default records"** (or change the `@` A record back to your Hostinger server IP: `217.21.91.150`).

### Step 2: Upload Files in Hostinger File Manager
1. In Hostinger hPanel, go to **Websites** &rarr; `selectedjobs.in` &rarr; click **Dashboard** (or **Manage**).
2. On the left sidebar, click **Files** &rarr; **File Manager** &rarr; select **Files of selectedjobs.in**.
3. Double-click to open the `public_html` folder.
4. Select and delete any existing default WordPress files (`wp-admin`, `wp-content`, `index.php`, etc.) to clear the directory.
5. In the top toolbar, click the **Upload** icon (arrow pointing up) &rarr; select **File**.
6. Select `C:\Users\DELL\Desktop\SelectedJobs\selectedjobs_hostinger_deploy.zip` from your computer.
7. Once uploaded, right-click `selectedjobs_hostinger_deploy.zip` &rarr; click **Extract** &rarr; extract into `public_html`.
8. *(Optional)* Delete the zip file after extracting to keep your storage clean.

### Step 3: Test Your Live Portal
Visit your domain in any browser:
- **Homepage:** `https://selectedjobs.in`
- **Post a Job:** `https://selectedjobs.in/post-job` (Passkey: `selectedadmin2026`)
- **Admin Dashboard:** `https://selectedjobs.in/admin` (Passkey: `selectedadmin2026`)
