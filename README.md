# 🚀 Daily Idea Engine & Tech Trend Aggregator

An autonomous AI agent that fetches trending technical indicators daily, processes them using the Gemini API, and builds a gorgeous, glassmorphic web dashboard showing curated project ideas, task checklists, and productivity habit challenges. 

Accessible on any device, fully hosted in the cloud, and **100% cost-free**.

---

## 🛠️ Complete Setup Guide (Get it running in 5 minutes)

Follow these steps to deploy your engine to the cloud:

### 1. Create a GitHub Repository
1. Go to [github.com](https://github.com) and sign in.
2. Create a new repository named `daily-idea-agent` (or any name you prefer).
3. Keep the repository **Public** (required for free GitHub Pages hosting) and do **not** initialize it with a README, gitignore, or license.

### 2. Push this Folder to your Repository
Open your terminal (PowerShell, Command Prompt, or Git Bash) inside this directory (`D:\daily-idea-agent`) and run:

```bash
# Initialize git repository
git init -b main

# Add all project files
git add .

# Create initial commit
git commit -m "Initialize Idea Engine dashboard"

# Link to your GitHub repository (replace with your username and repo name)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/daily-idea-agent.git

# Push files to GitHub
git push -u origin main
```

---

### 3. Get a Free Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click on **Get API Key** and generate a new key.
4. Copy the API key.

---

### 4. Add the API Key as a GitHub Secret
1. On GitHub, navigate to your newly created repository page.
2. Click on the **Settings** tab.
3. On the left sidebar, expand **Secrets and variables** and click **Actions**.
4. Click the green **New repository secret** button.
5. Enter the following details:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: *Paste your Gemini API key here*
6. Click **Add secret**.

---

### 5. Grant Permissions to GitHub Actions
To allow the workflow to commit updated trend data back to your repository:
1. Inside your repository **Settings** tab, go to **Actions** -> **General** on the left menu.
2. Scroll down to **Workflow permissions**.
3. Select **Read and write permissions**.
4. Click **Save**.

---

### 6. Enable GitHub Pages
To host your dashboard UI:
1. In your repository **Settings** tab, click **Pages** on the left menu.
2. Under **Build and deployment** -> **Source**, select **Deploy from a branch**.
3. Under **Branch**, select `main` and set folder to `/ (root)`.
4. Click **Save**.
5. After a minute, refresh the page to see your live URL (e.g., `https://your-username.github.io/daily-idea-agent/`).

---

### 7. Trigger the First Daily Update
1. Navigate to the **Actions** tab of your repository.
2. Under the list on the left, click **Update Daily Trends and Ideas**.
3. Click the **Run workflow** dropdown on the right, and then click the green **Run workflow** button.
4. This runs the scraper, generates your first set of ideas, commits it to the repository, and redeploys the dashboard. It will now run automatically **every day at 6:00 AM UTC (11:30 AM IST)**!

---

## 📁 Project Structure

- `index.html`: Modern, responsive glassmorphic dashboard interface.
- `styles.css`: CSS styles featuring dark-mode gradients and micro-animations.
- `app.js`: Interactive frontend logic that persists checked tasks in `localStorage`.
- `agent.py`: Scrapes GitHub, Hacker News, arXiv, and Dev.to, then queries Gemini to output `data.json`.
- `requirements.txt`: Python library dependencies.
- `.github/workflows/update-dashboard.yml`: Automatic daily cron schedule configuration.
