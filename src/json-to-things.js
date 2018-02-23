#!/usr/bin/env node

const exec = require('child_process').exec

/**
 * Get a JSON string and convert it to Things JSON.
 * https://support.culturedcode.com/customer/en/portal/articles/2803573
 *
 * This script creates _one project_ for one TaskPaper file. That's all.
 *
 * **This script will discard some items and that's normal.**
 *
 * Contrary to TaskPaper, Things is only two levels deep.
 * There're the headings and todos, then the checklist, and that's all.
 *
 * Todos nested more than two levels deep will be discarded
 * because they make no sense in the context of Things.
 *
 * Likewise, standalone notes (outside of the top-level) are also discarded.
 */

// -------------------------------------------------------------
// Module.
// -------------------------------------------------------------

// Grab the list of arguments.
const [, , ...args] = process.argv

// First arg is the project name, second is the area (optional).
const [projectName, areaName] = args.filter(x => !x.startsWith('-'))

// Find `-e, --execute` flag. This means that the data should be sent
// to Things url-scheme.
const shouldExecuteThingsURL = !!args.find(x => x === '-e' || x === '--execute')

// Quit if no project name.
if (!projectName || projectName.trim() === '') {
  console.error('Error: no project name provided.')
  process.exit(1)
}

// Grab the data from stdin.
getData()
  .then(data => {
    const json = JSON.parse(data.trim())

    const thingsJSON = createThingsJSON(json, {projectName, areaName})
    const thingsURL = createThingsURL(thingsJSON)

    // And export.
    if (shouldExecuteThingsURL) executeThingsURL(thingsURL)
    else console.log(getPrettyJSON(thingsJSON))
  })
  .catch(e => console.error(e))

// -------------------------------------------------------------
// Things.
// -------------------------------------------------------------

function createThingsJSON(taskpaper, {projectName, areaName}) {
  // Null, undefined, non-object or array? Stop!
  if (!taskpaper || typeof taskpaper !== 'object' || Array.isArray(taskpaper)) {
    console.error('Error:', 'data is invalid.')
    console.error('Got:', getPrettyJSON(taskpaper))
    return null
  }

  const notes = getNotes(taskpaper.children)
  const items = getItems(taskpaper.children)

  const thingsProject = {
    type: 'project',
    attributes: {
      title: projectName,
      notes,
      items
    }
  }

  // Set the area in the attributes if provided.
  if (areaName) thingsProject.attributes.area = areaName

  // Wrap in an array! This is required by Things, even with only one project.
  return [thingsProject]
}

function createThingsURL(thingsJSON) {
  return 'things:///add-json?data=' + encodeURI(JSON.stringify(thingsJSON))
}

function executeThingsURL(thingsURL) {
  exec('open ' + thingsURL)
}

// -------------------------------------------------------------
// Converters.
// -------------------------------------------------------------

function isNote(x) {
  return x.type === 'note'
}

function isHeading(x) {
  return x.type === 'project'
}

function isTodo(x) {
  return x.type === 'task'
}

function getItems(items) {
  const topLevelTodos = items.filter(isTodo).map(mapTodo)
  const headingsAndTodos = items.filter(isHeading).map(mapHeading)

  // We just got a list containing list of items.
  // We need to flatten it.
  const flatItems = [].concat(...headingsAndTodos)

  // Then, merge the top level todos and the headings.
  return [...topLevelTodos, ...flatItems]
}

// Concat all the notes at the current level into one newlines-separated list.
function getNotes(items) {
  return items
    .filter(isNote)
    .map(x => x.body)
    .join('\n')
}

function mapHeading(taskpaperHeading) {
  const heading = {
    type: 'heading',
    attributes: {
      title: taskpaperHeading.body
    }
  }

  const todos = taskpaperHeading.children.filter(isTodo).map(mapTodo)

  return [heading, ...todos]
}

function mapTodo(taskpaperTodo) {
  const {children} = taskpaperTodo

  const notes = getNotes(children)
  const checklist = children.filter(isTodo).map(mapChecklist)

  return {
    type: 'to-do',
    attributes: {
      title: taskpaperTodo.body,
      notes,
      'checklist-items': checklist
    }
  }
}

function mapChecklist(taskpaperChecklist) {
  return {
    type: 'checklist-item',
    attributes: {
      title: taskpaperChecklist.body
    }
  }
}

// -------------------------------------------------------------
// Helpers.
// -------------------------------------------------------------

function getPrettyJSON(json) {
  return JSON.stringify(json, null, 2)
}

// Code from:
// https://github.com/sindresorhus/get-stdin
function getData() {
  let data = ''

  return new Promise(resolve => {
    if (process.stdin.isTTY) {
      resolve(data)
      return
    }

    process.stdin.setEncoding('utf8')
    process.stdin.on('readable', () => {
      let chunk
      while ((chunk = process.stdin.read())) {
        data += chunk
      }
    })
    process.stdin.on('end', () => resolve(data))
  })
}
