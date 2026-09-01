const fs = require("fs");

const username = "anikh174";

async function github(query) {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { username },
    }),
  });

  const result = await response.json();

  if (result.errors) {
    console.error(result.errors);
    process.exit(1);
  }

  return result.data;
}

function calculateStreak(contributions) {
  const days = contributions
    .filter((day) => day.contributionCount > 0)
    .map((day) => day.date)
    .sort();

  if (!days.length) {
    return {
      current: 0,
      longest: 0,
    };
  }

  let longest = 1;
  let current = 1;

  for (let i = 1; i < days.length; i++) {
    const previous = new Date(days[i - 1]);
    const currentDate = new Date(days[i]);

    const diff =
      (currentDate - previous) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  const today = new Date().toISOString().split("T")[0];

  let currentStreak = 0;

  for (let i = days.length - 1; i >= 0; i--) {
    if (i === days.length - 1) {
      const lastDate = new Date(days[i]);
      const todayDate = new Date(today);

      const diff =
        (todayDate - lastDate) / (1000 * 60 * 60 * 24);

      if (diff > 1) break;
    }

    if (
      i === days.length - 1 ||
      new Date(days[i + 1]) - new Date(days[i]) ===
        1000 * 60 * 60 * 24
    ) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    current: currentStreak,
    longest,
  };
}

function createSvg(stats) {
  return `
<svg width="900" height="300" viewBox="0 0 900 300"
xmlns="http://www.w3.org/2000/svg">

<rect width="900" height="300" rx="20"
fill="#0d1117"/>

<text
x="40"
y="50"
fill="#ffffff"
font-size="28"
font-family="Arial"
font-weight="bold">
Anik Hossain — GitHub Stats
</text>

<text
x="40"
y="82"
fill="#8b949e"
font-size="15"
font-family="Arial">
Real GitHub contribution data
</text>

<!-- Commits -->
<rect x="40" y="115" width="180" height="120"
rx="15" fill="#161b22"/>

<text x="60" y="150"
fill="#58a6ff"
font-size="15"
font-family="Arial">
COMMITS
</text>

<text x="60" y="195"
fill="#ffffff"
font-size="34"
font-family="Arial"
font-weight="bold">
${stats.commits}
</text>

<!-- Contributions -->
<rect x="240" y="115" width="180" height="120"
rx="15" fill="#161b22"/>

<text x="260" y="150"
fill="#3fb950"
font-size="15"
font-family="Arial">
CONTRIBUTIONS
</text>

<text x="260" y="195"
fill="#ffffff"
font-size="34"
font-family="Arial"
font-weight="bold">
${stats.contributions}
</text>

<!-- Current Streak -->
<rect x="440" y="115" width="180" height="120"
rx="15" fill="#161b22"/>

<text x="460" y="150"
fill="#f0883e"
font-size="15"
font-family="Arial">
CURRENT STREAK
</text>

<text x="460" y="195"
fill="#ffffff"
font-size="34"
font-family="Arial"
font-weight="bold">
${stats.currentStreak} days
</text>

<!-- Longest Streak -->
<rect x="640" y="115" width="220" height="120"
rx="15" fill="#161b22"/>

<text x="660" y="150"
fill="#bc8cff"
font-size="15"
font-family="Arial">
LONGEST STREAK
</text>

<text x="660" y="195"
fill="#ffffff"
font-size="34"
font-family="Arial"
font-weight="bold">
${stats.longestStreak} days
</text>

<text
x="40"
y="270"
fill="#8b949e"
font-size="13"
font-family="Arial">
github.com/${username}
</text>

</svg>
`;
}

async function main() {
  const query = `
    query($username: String!) {
      user(login: $username) {

        contributionsCollection {
          totalCommitContributions
          totalIssueContributions
          totalPullRequestContributions
          totalRepositoryContributions

          contributionCalendar {
            totalContributions

            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }

        repositories(ownerAffiliations: OWNER, first: 100) {
          totalCount
        }
      }
    }
  `;

  const data = await github(query);

  const collection = data.user.contributionsCollection;

  const contributions = collection.contributionCalendar.weeks.flatMap(
    (week) => week.contributionDays
  );

  const streak = calculateStreak(contributions);

  const stats = {
    commits: collection.totalCommitContributions,
    contributions:
      collection.contributionCalendar.totalContributions,
    issues: collection.totalIssueContributions,
    pullRequests:
      collection.totalPullRequestContributions,
    repositories:
      data.user.repositories.totalCount,
    currentStreak: streak.current,
    longestStreak: streak.longest,
  };

  console.log(stats);

  fs.mkdirSync("generated", {
    recursive: true,
  });

  fs.writeFileSync(
    "generated/github-stats.svg",
    createSvg(stats)
  );

  fs.writeFileSync(
    "generated/github-stats.json",
    JSON.stringify(stats, null, 2)
  );
}

main();
