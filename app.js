document.addEventListener("DOMContentLoaded", () => {
  // Application State
  let appData = null;
  let activeDifficulty = "all";
  let chatHistory = [];

  // Elements
  const lastUpdatedEl = document.getElementById("last-updated");
  const trendTextEl = document.getElementById("trend-text");
  const ideasContainer = document.getElementById("ideas-container");
  const quickActionsList = document.getElementById("quick-actions-list");
  const dailyProgress = document.getElementById("daily-progress");
  const progressPercentage = document.getElementById("progress-percentage");
  
  // Chat Elements
  const chatSetupPane = document.getElementById("chat-setup-pane");
  const chatActivePane = document.getElementById("chat-active-pane");
  const keyInput = document.getElementById("client-api-key-input");
  const saveKeyBtn = document.getElementById("save-key-btn");
  const disconnectKeyBtn = document.getElementById("disconnect-key-btn");
  const chatMessagesContainer = document.getElementById("chat-messages-container");
  const chatUserInput = document.getElementById("chat-user-input");
  const chatSendBtn = document.getElementById("chat-send-btn");
  const chatTyping = document.getElementById("chat-typing");

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
      loadFallbackData();
    });

  function initializeDashboard() {
    if (!appData) return;

    // 1. Set timestamp
    lastUpdatedEl.textContent = appData.last_updated || "Just Now";

    // 2. Set trend summary
    trendTextEl.textContent = appData.trends || "No trends summary available today.";

    // 3. Render items
    renderIdeas();
    renderQuickActions();
    renderRawFeeds();
    initializeChatUI();

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

  // Render raw feed logs
  function renderRawFeeds() {
    if (!appData || !appData.scraped_sources) return;

    const sources = appData.scraped_sources;

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

  // ----------------------------------------------------
  // Chat Bot Controller Logic
  // ----------------------------------------------------
  function initializeChatUI() {
    const savedKey = localStorage.getItem("gemini_client_key");
    if (savedKey) {
      showActiveChat();
    } else {
      showChatSetup();
    }

    // Save key action
    saveKeyBtn.addEventListener("click", () => {
      const key = keyInput.value.trim();
      if (key) {
        localStorage.setItem("gemini_client_key", key);
        showActiveChat();
        keyInput.value = "";
      }
    });

    // Disconnect key action
    disconnectKeyBtn.addEventListener("click", () => {
      localStorage.removeItem("gemini_client_key");
      chatHistory = [];
      chatMessagesContainer.innerHTML = `
        <div class="message system-msg">
          Hello! I've loaded today's tech trends. Ask me to refine any idea, draft some code, or brainstorm more projects!
        </div>
      `;
      showChatSetup();
    });

    // Send chat text triggers
    chatSendBtn.addEventListener("click", sendUserMessage);
    chatUserInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendUserMessage();
      }
    });
  }

  function showChatSetup() {
    chatSetupPane.classList.remove("hidden");
    chatActivePane.classList.add("hidden");
  }

  function showActiveChat() {
    chatSetupPane.classList.add("hidden");
    chatActivePane.classList.remove("hidden");
  }

  async function sendUserMessage() {
    const query = chatUserInput.value.trim();
    if (!query) return;

    // Render User Message bubble
    appendMessage(query, "user");
    chatUserInput.value = "";
    
    // Add to Gemini History
    chatHistory.push({
      role: "user",
      parts: [{ text: query }]
    });

    // Show Typing Indicator
    chatTyping.classList.remove("hidden");
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    const apiKey = localStorage.getItem("gemini_client_key");
    const systemPrompt = `You are a helpful software development mentor, project manager, and tech architect.
    
    Here is the scraped data and brain recommendations generated for the user today:
    ---
    General Trend Summary: ${appData.trends}
    Recommended Project Ideas: ${JSON.stringify(appData.ideas, null, 2)}
    Habit checklist: ${JSON.stringify(appData.quick_actions)}
    ---

    Provide suggestions, write boilerplate files, explain technical articles/repos, and answer questions.
    Keep your explanations concise, action-focused, and write clean code blocks inside markdown markdown blocks where appropriate.`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: chatHistory,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          }
        })
      });

      const result = await response.json();
      chatTyping.classList.add("hidden");

      if (response.ok && result.candidates && result.candidates[0].content.parts[0].text) {
        const replyText = result.candidates[0].content.parts[0].text;
        appendMessage(replyText, "assistant");
        
        chatHistory.push({
          role: "model",
          parts: [{ text: replyText }]
        });
      } else {
        const errMsg = result.error ? result.error.message : "API Call failed. Check key settings.";
        appendMessage(`System Error: ${errMsg}`, "system-msg");
      }
    } catch (e) {
      chatTyping.classList.add("hidden");
      appendMessage(`Network Connection error: ${e.message}`, "system-msg");
    }

    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  function appendMessage(text, role) {
    const bubble = document.createElement("div");
    bubble.className = `message ${role}`;
    
    if (role === "system-msg") {
      bubble.textContent = text;
    } else {
      bubble.innerHTML = renderMarkdown(text);
    }
    
    chatMessagesContainer.appendChild(bubble);
  }

  // Basic client-side Markdown rendering (handles code blocks, headers, lists, and bold text)
  function renderMarkdown(md) {
    let html = md
      // Escaping HTML entities to prevent script injection
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      const parts = code.trim().split("\n");
      let lang = "";
      let actualCode = code;
      if (parts[0].length < 15 && !parts[0].includes(" ") && !parts[0].includes(":") && parts[0].toLowerCase() !== parts[0].toUpperCase()) {
        lang = parts[0];
        actualCode = parts.slice(1).join("\n");
      }
      return `<pre><code class="language-${lang}">${actualCode.trim()}</code></pre>`;
    });

    // Inline Code
    html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>");

    // Headers
    html = html.replace(/^### (.*?)$/gm, "<h5>$1</h5>");
    html = html.replace(/^## (.*?)$/gm, "<h4>$1</h4>");
    html = html.replace(/^# (.*?)$/gm, "<h3>$1</h3>");

    // Bullet Lists
    html = html.replace(/^\* (.*?)$/gm, "<li>$1</li>");
    html = html.replace(/^- (.*?)$/gm, "<li>$1</li>");

    // Bold text
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // Replace linebreaks with paragraph/breaks
    html = html.split("\n\n").map(para => {
      if (para.startsWith("<li>") || para.startsWith("<pre>")) return para;
      return `<p>${para.replace(/\n/g, "<br>")}</p>`;
    }).join("");

    return html;
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
