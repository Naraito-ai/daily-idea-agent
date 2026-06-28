import os
import json
import datetime
import xml.etree.ElementTree as ET
import requests
import google.generativeai as genai

# Configure APIs
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Warning: GEMINI_API_KEY environment variable not found. Using placeholder ideas.")

def fetch_github_trending():
    """Fetch top starred AI & Automation repositories created in the last 7 days."""
    try:
        last_week = (datetime.date.today() - datetime.timedelta(days=7)).isoformat()
        # Query for AI / ML
        ai_url = f"https://api.github.com/search/repositories?q=created:>{last_week}+topic:machine-learning+sort:stars&order=desc&per_page=5"
        # Query for Automation / Productivity
        auto_url = f"https://api.github.com/search/repositories?q=created:>{last_week}+topic:automation+sort:stars&order=desc&per_page=5"
        
        headers = {"User-Agent": "Daily-Idea-Agent"}
        repos = []
        
        # Fetch AI
        res = requests.get(ai_url, headers=headers, timeout=10)
        if res.status_code == 200:
            items = res.json().get("items", [])
            for item in items:
                repos.append({
                    "name": item["name"],
                    "owner": item["owner"]["login"],
                    "description": item["description"],
                    "stars": item["stargazers_count"],
                    "url": item["html_url"],
                    "category": "AI / ML"
                })
        
        # Fetch Automation
        res = requests.get(auto_url, headers=headers, timeout=10)
        if res.status_code == 200:
            items = res.json().get("items", [])
            for item in items:
                repos.append({
                    "name": item["name"],
                    "owner": item["owner"]["login"],
                    "description": item["description"],
                    "stars": item["stargazers_count"],
                    "url": item["html_url"],
                    "category": "Automation / Productivity"
                })
                
        return repos
    except Exception as e:
        print(f"Error fetching GitHub: {e}")
        return []

def fetch_hacker_news():
    """Fetch top stories on Hacker News."""
    try:
        top_ids_url = "https://hacker-news.firebaseio.com/v0/topstories.json"
        res = requests.get(top_ids_url, timeout=10)
        if res.status_code != 200:
            return []
        
        ids = res.json()[:15]
        stories = []
        for sid in ids:
            story_url = f"https://hacker-news.firebaseio.com/v0/item/{sid}.json"
            sres = requests.get(story_url, timeout=5)
            if sres.status_code == 200:
                sdata = sres.json()
                if "url" in sdata and any(word in sdata.get("title", "").lower() for word in ["ai", "model", "llm", "automate", "script", "workflow", "developer", "tool", "open source"]):
                    stories.append({
                        "title": sdata["title"],
                        "url": sdata["url"],
                        "score": sdata.get("score", 0)
                    })
            if len(stories) >= 5:
                break
        return stories
    except Exception as e:
        print(f"Error fetching Hacker News: {e}")
        return []

def fetch_arxiv_papers():
    """Fetch latest AI/ML papers from arXiv."""
    try:
        url = "http://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL&sortBy=submittedDate&sortOrder=descending&max_results=5"
        res = requests.get(url, timeout=10)
        if res.status_code != 200:
            return []
        
        root = ET.fromstring(res.content)
        papers = []
        
        # Namespace map
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        for entry in root.findall('atom:entry', ns):
            title = entry.find('atom:title', ns).text.strip().replace('\n', ' ')
            summary = entry.find('atom:summary', ns).text.strip().replace('\n', ' ')
            link = entry.find('atom:id', ns).text
            papers.append({
                "title": title,
                "summary": summary[:200] + "...",
                "url": link
            })
        return papers
    except Exception as e:
        print(f"Error fetching arXiv: {e}")
        return []

def fetch_devto_articles():
    """Fetch trending articles on productivity and automation from Dev.to."""
    try:
        url = "https://dev.to/api/articles?tag=productivity&top=7"
        res = requests.get(url, timeout=10)
        articles = []
        if res.status_code == 200:
            for item in res.json()[:5]:
                articles.append({
                    "title": item["title"],
                    "description": item["description"],
                    "url": item["url"],
                    "reactions": item["public_reactions_count"]
                })
        return articles
    except Exception as e:
        print(f"Error fetching Dev.to: {e}")
        return []

def generate_ideas_and_actions(github_data, hn_data, arxiv_data, devto_data):
    """Call Gemini to generate implementation ideas and actionable next steps."""
    if not GEMINI_API_KEY:
        # Return fallback mock data if no key is configured
        return get_mock_ideas()
        
    prompt = f"""
    You are an advanced agentic technology consultant and product strategist.
    I will provide you with trending data scraped today in AI, Machine Learning, Automation, and Productivity.
    Your task is to analyze these trends and synthesize:
    1. A summary of the general tech trends today.
    2. Exactly 3 highly creative, practical, and implementable project ideas that the user (a software developer) can build or implement using these trends. Each project idea should have a title, detailed explanation, how it aligns with today's trends, and step-by-step developer implementation tasks.
    3. Exactly 4 immediate personal developer "action items" or "quick habits" based on the productivity and automation trends.

    Scraped Data:
    ---
    GitHub Repositories:
    {json.dumps(github_data, indent=2)}
    
    Hacker News Articles:
    {json.dumps(hn_data, indent=2)}
    
    arXiv AI/ML Papers:
    {json.dumps(arxiv_data, indent=2)}
    
    Dev.to Productivity Articles:
    {json.dumps(devto_data, indent=2)}
    ---

    Response Format:
    You must output a valid JSON object ONLY. Do not wrap the JSON in ```json markdown formatting. Just output the clean JSON string.
    The JSON structure must match this EXACT scheme:
    {{
      "trend_summary": "string summarizing today's key technical insights and themes",
      "ideas": [
        {{
          "title": "Clear Idea Title",
          "difficulty": "Easy / Medium / Hard",
          "estimated_hours": 4, 
          "description": "Comprehensive explanation of what to build, why it's valuable, and how it solves a problem.",
          "tech_stack": ["List", "of", "technologies"],
          "source_inspiration": "Which trending repo, paper, or article inspired this",
          "steps": [
            "Task 1: Detailed action...",
            "Task 2: Detailed action...",
            "Task 3: Detailed action..."
          ]
        }}
      ],
      "quick_actions": [
        "Action 1: Clean instruction to do today",
        "Action 2",
        "Action 3",
        "Action 4"
      ]
    }}
    """
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        data = json.loads(response.text.strip())
        return data
    except Exception as e:
        print(f"Error generating content via Gemini: {e}")
        return get_mock_ideas()

def get_mock_ideas():
    """Mock implementation if API key or generation fails."""
    return {
        "trend_summary": "Today's trends center on lightweight AI agent architectures, local model orchestration, and developer workflow automation tools that reduce context-switching.",
        "ideas": [
          {
            "title": "Local Markdown LLM Refactoring Companion",
            "difficulty": "Easy",
            "estimated_hours": 4,
            "description": "A CLI tool that reads a directory of markdown draft files and uses local LLMs (via Ollama or Llamafile) to automatically clean up notes, format action items, and cross-reference research topics.",
            "tech_stack": ["Python", "Ollama", "Markdown-IT"],
            "source_inspiration": "Local LLM wrappers and developer workspace tools.",
            "steps": [
              "Set up a local Python environment and install the Ollama client library.",
              "Write a file scanner that reads files with .md extension in the target path.",
              "Feed markdown chunks to LLM to summarize and format to standard templates."
            ]
          },
          {
            "title": "Automated Dev.to to Social Thread Synthesizer",
            "difficulty": "Medium",
            "estimated_hours": 8,
            "description": "A GitHub Action-based workflow that monitors your Dev.to rss feed and automatically converts long-form developer articles into highly engaging micro-threads or summary graphics using canvas rendering.",
            "tech_stack": ["Node.js", "GitHub Actions", "Puppeteer", "Canvas API"],
            "source_inspiration": "Dev.to tags and GitHub Actions automation templates.",
            "steps": [
              "Create a Node script to parse your Dev.to user RSS feed.",
              "Integrate an image generation library or HTML-to-image converter to generate slide summaries.",
              "Configure a daily cron scheduler in a GitHub repository."
            ]
          },
          {
            "title": "Smart Clipboard Agent for Terminal Commands",
            "difficulty": "Hard",
            "estimated_hours": 12,
            "description": "A background utility that listens to terminal commands and copies execution failures directly to your clipboard, translates the error with an LLM, and suggests a corrected command or shell script in real-time.",
            "tech_stack": ["Rust or Python", "Local LLM", "Clipboard API", "Shell Integration"],
            "source_inspiration": "AI-powered terminal assistants.",
            "steps": [
              "Create a shell hook (e.g. preexec/precmd in zsh/powershell) to intercept command exit codes.",
              "When an exit code is non-zero, capture stderr and query the local LLM.",
              "Push the recommended fix directly to clipboard and print a clean notice."
            ]
          }
        ],
        "quick_actions": [
          "Set up an alias in your bash/zshrc to automate your most common git commit messages.",
          "Check the latest release of Ollama and pull a smaller, faster model (like Phi-3 or Gemma 2B) for fast local processing.",
          "Document your current side-project architecture in a single README.md file using Mermaid diagrams.",
          "Review open issues on your favorite open-source tool and search for the 'good first issue' label."
        ]
    }

def main():
    print("Fetching GitHub...")
    github = fetch_github_trending()
    
    print("Fetching Hacker News...")
    hn = fetch_hacker_news()
    
    print("Fetching arXiv...")
    arxiv = fetch_arxiv_papers()
    
    print("Fetching Dev.to...")
    devto = fetch_devto_articles()
    
    print("Generating ideas...")
    generated = generate_ideas_and_actions(github, hn, arxiv, devto)
    
    # Save the output format
    output_data = {
        "last_updated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "scraped_sources": {
            "github": github,
            "hacker_news": hn,
            "arxiv": arxiv,
            "devto": devto
        },
        "trends": generated.get("trend_summary", ""),
        "ideas": generated.get("ideas", []),
        "quick_actions": generated.get("quick_actions", [])
    }
    
    output_path = os.path.join(os.path.dirname(__file__), "data.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
        
    print(f"Daily update completed successfully! Saved to: {output_path}")

if __name__ == "__main__":
    main()
