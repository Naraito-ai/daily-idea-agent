document.addEventListener("DOMContentLoaded", () => {
  // Application State
  let appData = null;
  let activeDifficulty = "all";

  // Elements
  const lastUpdatedEl = document.getElementById("last-updated");
  const trendTextEl = document.getElementById("trend-text");
  const ideasContainer = document.getElementById("ideas-container");
  const quickActionsList = document.getElementById("quick-actions-list");
  const dailyProgress = document.getElementById("daily-progress");
  const progressPercentage = document.getElementById("progress-percentage");
  
  // Tab filtering
  const filterBtns = document.querySelectorAll(".tab-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeDifficulty = btn.dataset.difficulty;
      renderIdeas();
    });
  });

  // Raw feeds accordion toggle
  const toggleFeedsBtn = document.querySelector(".toggle-feeds");
  const feedsWrapper = document.getElementById("feeds-wrapper");
  toggleFeedsBtn.addEventListener("click", () => {
    const isOpen = toggleFeedsBtn.classList.toggle("open");
    if (isOpen) {
      feedsWrapper.classList.remove("collapsed");
    } else {
      feedsWrapper.classList.add("collapsed");
    }
  });

  // Raw feeds tabs
  const feedTabs = document.querySelectorAll(".feed-tab");
  const feedPanes = document.querySelectorAll(".feed-pane");
  feedTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      feedTabs.forEach(t => t.classList.remove("active"));
      feedPanes.forEach(p => p.classList.remove("active"));
      
      tab.classList.add("active");
      const targetPane = document.getElementById(`pane-${tab.dataset.feed}`);
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // Fetch data.json
  fetch("data.json")
    .then(response => {
      if (!response.ok) {
        throw new Error("Local data not generated yet.");
      }
      return response.json();
    })
    .then(data => {
      appData = data;
      initializeDashboard();
    })
    .catch(error => {
      console.warn("Could not load data.json, using mock data:", error);
      // Fetch mock fallback or show warning
      loadFallbackData();
    });

  function initializeDashboard() {
    if (!appData) return;

    // 1. Set timestamp
    lastUpdatedEl.textContent = appData.last_updated || "Just Now";

    // 2. Set trend summary
    trendTextEl.textContent = appData.trends || "No trends summary available today.";

    // 3. Render ideas & actions
    renderIdeas();
    renderQuickActions();
    renderRawFeeds();

    // Re-initialize Lucide Icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Render project ideas based on active difficulty filter
  function renderIdeas() {
    if (!appData || !appData.ideas) return;
    
    ideasContainer.innerHTML = "";
    
    const filteredIdeas = appData.ideas.filter(idea => {
      if (activeDifficulty === "all") return true;
      return idea.difficulty.toLowerCase() === activeDifficulty.toLowerCase();
    });

    if (filteredIdeas.length === 0) {
      ideasContainer.innerHTML = `
        <div class="glass idea-card" style="text-align: center; color: var(--text-muted); padding: 40px;">
          <i data-lucide="info" style="margin: 0 auto 12px; width: 32px; height: 32px; color: var(--primary);"></i>
          <p>No project ideas match the selected difficulty rating.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    filteredIdeas.forEach((idea, ideaIndex) => {
      const ideaCard = document.createElement("div");
      ideaCard.className = "idea-card glass";
      
      const difficultyClass = idea.difficulty.toLowerCase();
      const techTagsHtml = idea.tech_stack.map(tag => `<span class="tech-tag">${tag}</span>`).join("");
      
      // Load tasks state from localStorage
      const ideaId = `idea-${idea.title.replace(/\s+/g, '-').toLowerCase()}`;
      
      const tasksHtml = idea.steps.map((step, stepIndex) => {
        const localStorageKey = `${ideaId}-task-${stepIndex}`;
        const isChecked = localStorage.getItem(localStorageKey) === "true";
        return `
          <li class="task-item ${isChecked ? 'checked' : ''}" data-key="${localStorageKey}">
            <div class="task-checkbox">
              <i data-lucide="check"></i>
            </div>
            <span class="task-text ${isChecked ? 'strikethrough' : ''}">${step}</span>
          </li>
        `;
      }).join("");

      ideaCard.innerHTML = `
        <div class="idea-card-header">
          <h3>${idea.title}</h3>
          <span class="difficulty-badge ${difficultyClass}">${idea.difficulty}</span>
        </div>
        
        <div class="idea-meta">
          <span><i data-lucide="clock"></i> Est. Build: ${idea.estimated_hours} hrs</span>
          <span><i data-lucide="compass"></i> Insp: ${idea.source_inspiration}</span>
        </div>
        
        <p class="idea-description">${idea.description}</p>
        
        <div class="tech-tags">
          ${techTagsHtml}
        </div>
        
        <div class="idea-tasks-container">
          <div class="idea-tasks-title">
            <i data-lucide="list-checks"></i> Implementation Checklist
          </div>
          <ul class="idea-tasks">
            ${tasksHtml}
          </ul>
        </div>
      `;

      // Add event listeners to task check-boxes
      ideaCard.querySelectorAll(".task-item").forEach(item => {
        item.addEventListener("click", () => {
          const key = item.dataset.key;
          const isCheckedNow = !item.classList.contains("checked");
          
          item.classList.toggle("checked", isCheckedNow);
          const textSpan = item.querySelector(".task-text");
          if (textSpan) textSpan.classList.toggle("strikethrough", isCheckedNow);
          
          localStorage.setItem(key, isCheckedNow);
        });
      });

      ideasContainer.appendChild(ideaCard);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Render quick actions habit checklist
  function renderQuickActions() {
    if (!appData || !appData.quick_actions) return;

    quickActionsList.innerHTML = "";
    const dateStr = appData.last_updated ? appData.last_updated.split(" ")[0] : new Date().toISOString().split("T")[0];

    appData.quick_actions.forEach((action, idx) => {
      const storageKey = `habit-${dateStr}-${idx}`;
      const isChecked = localStorage.getItem(storageKey) === "true";

      const actionItem = document.createElement("li");
      actionItem.className = `checklist-item ${isChecked ? 'checked' : ''}`;
      actionItem.dataset.key = storageKey;
      
      actionItem.innerHTML = `
        <div class="checklist-checkbox">
          <i data-lucide="check"></i>
        </div>
        <span>${action}</span>
      `;

      actionItem.addEventListener("click", () => {
        const key = actionItem.dataset.key;
        const nowChecked = !actionItem.classList.contains("checked");
        
        actionItem.classList.toggle("checked", nowChecked);
        localStorage.setItem(key, nowChecked);
        updateProgress();
      });

      quickActionsList.appendChild(actionItem);
    });

    updateProgress();
  }

  // Update habits progress bar
  function updateProgress() {
    const totalItems = quickActionsList.querySelectorAll(".checklist-item").length;
    if (totalItems === 0) return;

    const checkedItems = quickActionsList.querySelectorAll(".checklist-item.checked").length;
    const percentage = Math.round((checkedItems / totalItems) * 100);

    dailyProgress.style.width = `${percentage}%`;
    progressPercentage.textContent = `${percentage}%`;
  }

  // Render raw feed logs at the bottom
  function renderRawFeeds() {
    if (!appData || !appData.scraped_sources) return;

    const sources = appData.scraped_sources;

    // Render GitHub Repos
    const ghList = document.getElementById("github-feed-list");
    ghList.innerHTML = "";
    if (sources.github && sources.github.length > 0) {
      sources.github.forEach(repo => {
        ghList.appendChild(createFeedItem(
          repo.name,
          `${repo.category} • ${repo.stars} ⭐ • by @${repo.owner}`,
          repo.description || "No description provided.",
          repo.url
        ));
      });
    } else {
      ghList.innerHTML = `<p class="loading-state">No repositories fetched today.</p>`;
    }

    // Render Hacker News
    const hnList = document.getElementById("hn-feed-list");
    hnList.innerHTML = "";
    if (sources.hacker_news && sources.hacker_news.length > 0) {
      sources.hacker_news.forEach(story => {
        hnList.appendChild(createFeedItem(
          story.title,
          `Score: ${story.score} points`,
          "Trending Hacker News discussion.",
          story.url
        ));
      });
    } else {
      hnList.innerHTML = `<p class="loading-state">No relevant Hacker News articles fetched today.</p>`;
    }

    // Render arXiv Papers
    const arxivList = document.getElementById("arxiv-feed-list");
    arxivList.innerHTML = "";
    if (sources.arxiv && sources.arxiv.length > 0) {
      sources.arxiv.forEach(paper => {
        arxivList.appendChild(createFeedItem(
          paper.title,
          "arXiv Preprints (cs.AI / cs.LG / cs.CL)",
          paper.summary || "",
          paper.url
        ));
      });
    } else {
      arxivList.innerHTML = `<p class="loading-state">No arXiv papers fetched today.</p>`;
    }

    // Render Dev.to Articles
    const devtoList = document.getElementById("devto-feed-list");
    devtoList.innerHTML = "";
    if (sources.devto && sources.devto.length > 0) {
      sources.devto.forEach(article => {
        devtoList.appendChild(createFeedItem(
          article.title,
          `${article.reactions} reactions`,
          article.description || "",
          article.url
        ));
      });
    } else {
      devtoList.innerHTML = `<p class="loading-state">No Dev.to articles fetched today.</p>`;
    }
  }

  function createFeedItem(title, label, summary, url) {
    const item = document.createElement("div");
    item.className = "feed-item glass";
    item.innerHTML = `
      <div class="feed-item-main">
        <h4>${title}</h4>
        <p>${summary}</p>
      </div>
      <div class="feed-item-meta">
        <span class="feed-badge">${label}</span>
        <a href="${url}" target="_blank" class="feed-link">
          <i data-lucide="external-link"></i>
        </a>
      </div>
    `;
    return item;
  }

  function loadFallbackData() {
    appData = {
      last_updated: new Date().toLocaleString(),
      trends: "Today's trends center on lightweight AI agent architectures, local model orchestration, and developer workflow automation tools that reduce context-switching.",
      ideas: [
        {
          title: "Local Markdown LLM Refactoring Companion",
          difficulty: "Easy",
          estimated_hours: 4,
          description: "A CLI tool that reads a directory of markdown draft files and uses local LLMs (via Ollama or Llamafile) to automatically clean up notes, format action items, and cross-reference research topics.",
          tech_stack: ["Python", "Ollama", "Markdown-IT"],
          source_inspiration: "Local LLM wrappers and developer workspace tools.",
          steps: [
            "Set up a local Python environment and install the Ollama client library.",
            "Write a file scanner that reads files with .md extension in the target target path.",
            "Feed markdown chunks to LLM to summarize and format to standard templates."
          ]
        },
        {
          title: "Automated Dev.to to Social Thread Synthesizer",
          difficulty: "Medium",
          estimated_hours: 8,
          description: "A GitHub Action-based workflow that monitors your Dev.to rss feed and automatically converts long-form developer articles into highly engaging micro-threads or summary graphics using canvas rendering.",
          tech_stack: ["Node.js", "GitHub Actions", "Puppeteer", "Canvas API"],
          source_inspiration: "Dev.to tags and GitHub Actions automation templates.",
          steps: [
            "Create a Node script to parse your Dev.to user RSS feed.",
            "Integrate an image generation library or HTML-to-image converter to generate slide summaries.",
            "Configure a daily cron scheduler in a GitHub repository."
          ]
        },
        {
          title: "Smart Clipboard Agent for Terminal Commands",
          difficulty: "Hard",
          estimated_hours: 12,
          description: "A background utility that listens to terminal commands and copies execution failures directly to your clipboard, translates the error with an LLM, and suggests a corrected command or shell script in real-time.",
          tech_stack: ["Rust or Python", "Local LLM", "Clipboard API", "Shell Integration"],
          source_inspiration: "AI-powered terminal assistants.",
          steps: [
            "Create a shell hook (e.g. preexec/precmd in zsh/powershell) to intercept command exit codes.",
            "When an exit code is non-zero, capture stderr and query the local LLM.",
            "Push the recommended fix directly to clipboard and print a clean notice."
          ]
        }
      ],
      quick_actions: [
        "Set up an alias in your bash/zshrc to automate your most common git commit messages.",
        "Check the latest release of Ollama and pull a smaller, faster model (like Phi-3 or Gemma 2B) for fast local processing.",
        "Document your current side-project architecture in a single README.md file using Mermaid diagrams.",
        "Review open issues on your favorite open-source tool and search for the 'good first issue' label."
      ]
    };
    initializeDashboard();
  }
});
