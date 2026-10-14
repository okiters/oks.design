#!/bin/zsh
# Puts the site on Vercel (project oks-design) as the live version at oks.design:   ./deploy.sh
# It deploys a copy made outside the git repository: from inside it, Vercel reads the last commit's author
# and blocks the deployment (see Linpile's README, "Website"). The copy also carries the Switzer fonts,
# which git ignores. .vercelignore keeps tools/ and the README off the internet.
set -e
cd "${0:A:h}"
[ -d .vercel ] || { echo "No .vercel here: the project has not been set up on Vercel."; exit 1; }
COPY=$(mktemp -d)
trap 'rm -rf "$COPY"' EXIT
rsync -a --exclude .git ./ "$COPY/"
cd "$COPY"
vercel deploy --prod --yes --scope okiters-projects
