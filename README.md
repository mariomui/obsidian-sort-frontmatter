# Obsidian Sort Frontmatter

## Summary

This plugin is created for the ObsidianMD-app. Its goal is to recursively sort through the frontmatter so that the properties are alphabetical. It will sort through objects, array, and its nested inhabitants up to 5 levels.

## Implementation

See [[README_DEV.md]] for a walkthrough on the technical side.
As far as **usage** is concerned, the procedure is as follows:

- Open up the Command Pallet
- Type `Sort Frontmatter` and activate.
- The current file on the screen will have its frontmatter sorted.

## Tradeoffs

- I avoid Settings Tab and Ribbon bar because it simplifies the plugin (unix principles) but it also means that it is less apparent to new users. The benefits, however, outweigh the cons--not having to deal with manually removing unwanted ribbon icons or with absentmindedly forgetting on of the 40+ settings in your app lessens [[cognitive-load]] to more than minimal degree.
