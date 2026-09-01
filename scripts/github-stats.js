const fs = require("fs");

const username = "anikh174";
const token = process.env.GITHUB_TOKEN;

async function githubAPI(endpoint) {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API Error: ${response.status}`);
  }

  return response.json();
}

function escapeXML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createStatsSVG(stats) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="320" viewBox="0 0 900 320">
  <rect width="900" height="320" rx="20" fill="#0d1117"/>

  <text x="50" y="55"
    font-family="Arial, sans-serif"
    font-size="28"
    font-weight="bold"
    fill="#ffffff">
    Anik Hossain — GitHub Stats
  </text>

  <text x="50" y="105"
    font-family="Arial, sans-serif"
    font-size="17"
    fill="#8b949e">
    Public Repositories
  </text>

  <text x="50" y="145"
    font-family="Arial, sans-serif"
    font-size="34"
    font-weight="bold"
    fill="#00f7ff">
    ${stats.repos}
  </text>

  <text x="330" y="105"
    font-family="Arial, sans-serif"
    font-size="17"
    fill="#8b949e">
    Followers
  </text>

  <text x="330" y="145"
    font-family="Arial, sans-serif"
    font-size="34"
    font-weight="bold"
    fill="#00f7ff">
    ${stats.followers}
  </text>

  <text x="610" y="105"
    font-family="Arial, sans-serif"
    font-size="17"
    fill="#8b949e">
    Following
  </text>

  <text x="610" y="145"
    font-family="Arial, sans-serif"
    font-size="34"
    font-weight="bold"
    fill="#00f7ff">
    ${stats.following}
  </text>

  <line x1="50" y1="190" x2="850" y2="190"
    stroke="#30363d"
    stroke-width="1"/>

  <text x="50" y="235"
    font-family="Arial, sans-serif"
    font-size="17"
    fill="#8b949e">
    GitHub Profile
  </text>

  <text x="50" y="275"
    font-family="Arial, sans-serif"
    font-size="22"
    fill="#ffffff">
    github.com/${escapeXML(username)}
  </text>

  <text x="850" y="275"
    text-anchor="end"
    font-family="Arial, sans-serif"
    font-size="16"
    fill="#00f7ff">
    MERN Stack Developer
  </text>
</svg>
`;
}

async function createActivitySVG() {
  const events = await githubAPI(`/users/${username}/events/public?per_page=10`);

  const recentEvents = events.slice(0, 6);

  let rows = "";

  recentEvents.forEach((event, index) => {
    let action = "GitHub Activity";
    let repo = event.repo?.name || "Unknown repository";

    if (event.type === "PushEvent") {
      action = "Pushed code";
    } else if (event.type === "PullRequestEvent") {
      action = "Pull request activity";
    } else if (event.type === "IssuesEvent") {
      action = "Issue activity";
    } else if (event.type === "CreateEvent") {
      action = "Created repository/branch";
    } else if (event.type === "WatchEvent") {
      action = "Starred repository";
    } else if (event.type === "ForkEvent") {
      action = "Forked repository";
    }

    const y = 70 + index * 42;

    rows += `
      <circle cx="35" cy="${y - 6}" r="5" fill="#00f7ff"/>

      <text x="55" y="${y}"
        font-family="Arial, sans-serif"
        font-size="15"
        fill="#ffffff">
        ${escapeXML(action)}
      </text>

      <text x="55" y="${y + 20}"
        font-family="Arial, sans-serif"
        font-size="12"
        fill="#8b949e">
        ${escapeXML(repo)}
      </text>
    `;
  });

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="350" viewBox="0 0 900 350">
  <rect width="900" height="350" rx="20" fill="#0d1117"/>

  <text x="35" y="35"
    font-family="Arial, sans-serif"
    font-size="24"
    font-weight="bold"
    fill="#ffffff">
    📈 Recent GitHub Activity
  </text>

  ${rows}
</svg>
`;
}

async function main() {
  try {
    console.log("Fetching GitHub profile...");

    const profile = await githubAPI(`/users/${username}`);

    const stats = {
      repos: profile.public_repos,
      followers: profile.followers,
      following: profile.following,
    };

    fs.mkdirSync("generated", { recursive: true });

    fs.writeFileSync(
      "generated/github-stats.svg",
      createStatsSVG(stats)
    );

    fs.writeFileSync(
      "generated/github-activity.svg",
      await createActivitySVG()
    );

    console.log("✅ GitHub stats generated successfully!");
    console.log("✅ GitHub activity generated successfully!");
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
}

main();
