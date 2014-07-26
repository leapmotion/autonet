#!/usr/bin/env bash

########################################
#              Deploy                  #
########################################

# Be sure to run this from the master branch

git checkout master
grunt build
git branch -D gh-pages
git checkout --orphan gh-pages
git rm -rf .
git add dist
git mv dist/* .
git commit -m "deploying autonet"
git push origin gh-pages --force
rm -rf bower_components
git checkout master
