import { Octokit } from "@octokit/rest";

interface PrCoords {
  owner: string;
  repo: string;
  pullNumber: number;
}

export function parsePrUrl(url: string): PrCoords {
  const match = url.trim().match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/
  );
  if (!match) {
    throw new Error(
      "Invalid GitHub PR URL. Expected format: https://github.com/{owner}/{repo}/pull/{number}"
    );
  }
  return {
    owner: match[1],
    repo: match[2],
    pullNumber: parseInt(match[3], 10),
  };
}

export interface ApproveResult {
  prTitle: string;
  prNumber: number;
  repoFullName: string;
}

export async function approvePr(
  coords: PrCoords,
  token: string
): Promise<ApproveResult> {
  const octokit = new Octokit({ auth: token });

  // Fetch PR info first to get the title
  const { data: pr } = await octokit.pulls.get({
    owner: coords.owner,
    repo: coords.repo,
    pull_number: coords.pullNumber,
  });

  await octokit.pulls.createReview({
    owner: coords.owner,
    repo: coords.repo,
    pull_number: coords.pullNumber,
    event: "APPROVE",
  });

  return {
    prTitle: pr.title,
    prNumber: pr.number,
    repoFullName: `${coords.owner}/${coords.repo}`,
  };
}

export async function approvePrAndMerge(
  coords: PrCoords,
  token: string
): Promise<ApproveResult> {
  const result = await approvePr(coords, token);

  const octokit = new Octokit({ auth: token });
  await octokit.pulls.merge({
    owner: coords.owner,
    repo: coords.repo,
    pull_number: coords.pullNumber,
    merge_method: "rebase",
  });

  return result;
}
