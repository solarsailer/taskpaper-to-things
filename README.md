# TaskPaper to Things

Collection of scripts to convert a TaskPaper file to a Things project through [Alfred](https://www.alfredapp.com/) or another task runner.

Obviously, Things is a macOS app, so this is only for macOS.

## Usage

1. Open the sample TaskPaper file.
2. Run the `taskpaper-to-json.js`.
3. Pass the data to `json-to-things.js`.

With Alfred, you just need to create workflow and bind everything together.

## Motivation

I love Things: the UI is beautiful and there's an app on iOS and macOS. However, I sometime want to archive a list to keep a trace of something I did. Or to create a repeatable list for a project or a task.

With these scripts, I can create a TaskPaper file, export it to Things and archive it. :)

## About the code

This is a quick side-project, made in a few hours.

I assume the best in `taskpaper-to-json.js`: there's no check or preconditions, no recovery, etc.. I expect a well-formed TaskPaper file, and I have to cope with AppleScript/OSAScript (I love the idea behind AppleScript, but I dislike the implementation).

`json-to-things.js` is better, however. :)

Moreover, because I use these scripts in Alfred, I didn't cleanly separated the code into many modules like I would normally do. I want to repackage this into a clean npm module one day, though. And obviously, I can't use node packages in the current state of this project.

But this might be useful to someone, so here's the code. ;)

## TODO

- [ ] Alfred example.
- [ ] Tests! Setup Jest and valid the code with a full code coverage.
- [ ] Repackage as a npm module, then separate the code into modules and unify the flow into one step.
