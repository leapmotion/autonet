#!/usr/bin/env bash

########################################
#              Deploy                  #
########################################

# Be sure to run this from the master branch

# Build deployed version
git checkout master
grunt build

# Fill gh-pages with static website content
git branch -D gh-pages
git checkout --orphan gh-pages
git rm -rf .
git add dist
git mv dist/* .
rm -rf dist/

# Create CNAME
echo "visualizer.autowiring.io" > CNAME
git add CNAME

# Deploy
git commit -m "deploying autonet"
git push origin gh-pages --force

# Cleanup
rm -rf bower_components
git checkout master
