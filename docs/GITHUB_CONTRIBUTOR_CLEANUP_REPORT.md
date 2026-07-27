# GitHub Contributor Cleanup Report

This report analyzes the repository's git commit history and outlines options to safely remove the unwanted contributor **Adytm404** (Ogya Adyatma Putra) from the GitHub contributors list by rewriting commit authorship.

---

## 1. Issue Diagnosis

### Why does **Adytm404** appear as a contributor?
GitHub compiles its contributors list directly from the **authorship email addresses** embedded in all commits in the repository history.

A diagnostic check of the commit logs (`git log --format="%h %an <%ae>" --all`) shows:
- **Total commits in history:** 78
- **Commits authored by `itscasaa` (Owner):** 1 (the HEAD commit `4f2938c`)
- **Commits authored by `adytm404 <ogyaadyatma@gmail.com>` (Unwanted Contributor):** 77 commits (representing almost the entire project history from its inception up to the second-to-last commit `5960568`)

Because the vast majority of the commits were authored with the email `ogyaadyatma@gmail.com` (which is linked to the GitHub account **Adytm404**), GitHub lists them as the primary developer/contributor of the repository.

---

## 2. Git Configuration Audit

Before proceeding with history rewriting, we verified the current local git configuration to ensure all subsequent commits will be created under the correct author identity:

- **Command Run:** `git config user.name && git config user.email`
- **Current Settings:**
  - `user.name`: `"itscasaa"`
  - `user.email`: `"ampremium12z@gmail.com"` (GitHub Owner email)

All future commits created locally on this system will now be correctly authored by `itscasaa <ampremium12z@gmail.com>`.

---

## 3. History Cleanup & Remediation Options

Because nearly the entire commit history is affected (77 out of 78 commits), we cannot use a simple interactive rebase (`git rebase -i`) as it would require manually picking and resolving 77 commits. Instead, we must perform a bulk history rewrite.

Below are the two safest and most standard ways to rewrite the authorship of the 77 commits from `adytm404` to `itscasaa`.

> [!CAUTION]
> Rewriting git history modifies the cryptographically signed hashes of every single commit in the repository.
> 1. **Do not run these commands if other developers have active local branches**, as their branches will diverge.
> 2. **A force push (`git push --force`) is required** to update the remote repository on GitHub after rewriting. Do not force push until you are ready to update the remote origin.

### Option A: Using `git filter-branch` (Built-in, Recommended if `git-filter-repo` is not installed)

Since `git-filter-repo` is not installed by default on your system, you can use Git's built-in `git filter-branch` tool to rewrite the author name and email of all commits in the history matching `ogyaadyatma@gmail.com`.

Run the following command in your terminal (`git` bash or a standard shell):

```bash
git filter-branch --env-filter '
OLD_EMAIL="ogyaadyatma@gmail.com"
CORRECT_NAME="itscasaa"
CORRECT_EMAIL="ampremium12z@gmail.com"

if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags
```

*Note: You may need to add the `-f` flag to overwrite any existing backup refs from previous rewrite attempts if prompted.*

---

### Option B: Using `git-filter-repo` (Modern and Faster)

`git-filter-repo` is the modern, officially recommended tool for rewriting histories, but it requires installing it first (usually via Python pip or a package manager).

#### Step 1: Install `git-filter-repo`
On Windows, you can install it using Python:
```bash
pip install git-filter-repo
```

#### Step 2: Create a Mailmap file
Create a file named `.mailmap` in the root of the repository with the following line to map the old email/name to the new one:
```text
itscasaa <ampremium12z@gmail.com> Ogya Adyatma Putra <ogyaadyatma@gmail.com>
itscasaa <ampremium12z@gmail.com> adytm404 <ogyaadyatma@gmail.com>
```

#### Step 3: Run the rewrite
Run the command:
```bash
git filter-repo --mailmap .mailmap --force
```

---

## 4. Finalizing the Cleanup (Force Push)

Once the history has been successfully rewritten locally, verify the changes by running:
```bash
git log --format="%h %an <%ae>" --all
```
You should see all 78 commits listed under `itscasaa <ampremium12z@gmail.com>`.

To update the remote repository on GitHub and remove the unwanted contributor from the contributor graph, run:
```bash
git push origin main --force
```
*(Replace `main` with your default branch name if different).*

Within a few minutes of the force push, GitHub will re-index the repository and update the contributors tab to list only **itscasaa**.
