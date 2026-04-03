#!/bin/bash
# Deploy Creative OS report to GitHub Pages
# Prerequisites: gh CLI authenticated, or git remote configured
#
# Usage:
#   ./deploy.sh                    # generate report + push to GitHub
#   ./deploy.sh --setup REPO_NAME  # first-time setup: create repo + enable Pages

set -e

REPO_NAME="${2:-barilife-creative-os}"

if [ "$1" = "--setup" ]; then
  echo "Setting up GitHub repo: $REPO_NAME"
  gh repo create "$REPO_NAME" --public --description "Bari Life Creative OS Dashboard" --source . --push
  gh api "repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)/pages" \
    -X POST -f source.branch=main -f source.path=/docs 2>/dev/null || \
    echo "Enable GitHub Pages manually: Settings > Pages > Source: main, /docs"
  echo "Done! Pages will be live at: https://$(gh repo view --json owner -q .owner.login).github.io/$REPO_NAME/"
  exit 0
fi

echo "Generating report..."
node generate-report.js

echo "Committing and pushing..."
git add docs/index.html
git commit -m "Update Creative OS report $(date +%Y-%m-%d)

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
git push

echo "Done! Report updated on GitHub Pages."
