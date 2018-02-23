/**
 * This is not a _pretty_ script, but OSAScript/AppleScript is not.
 * No require, a weird API, well. ¯\_(ツ)_/¯
 *
 * **This is only designed for the TaskPaper API**. It's very fragile, and
 * we don't check many things because we assume that the data we got is from TaskPaper.
 * And well, this is a quick side-project, and if it works, that's enought for the moment.
 *
 * To test:
 * - Open ScriptEditor and a TaskPaper project.
 * - Copy the script.
 * - Run.
 *
 * The result should be a JSON string which resembles to the TaskPaper list.
 *
 * Currently, this is designed to be used with Alfred or another task runner.
 *
 * Pass the result to the other script and that should be all. :-)
 */

// All the code should be contained in the Context, otherwise the evaluate call will miss some code.
const Context = (editor, options) => {
  // Check if a body is null or empty.
  const hasNullOrEmptyBody = item => {
    return !item.bodyString || item.bodyString.trim() === ''
  }

  // Get the body of an item and clean it.
  const getBody = x => x.bodyString.replace(/^-/, '').trim()

  // Convert TP item to an useable object.
  // {id, type, body, children, parentId}
  const convertTaskPaperItem = item => {
    if (hasNullOrEmptyBody(item)) return null

    return {
      id: item.id,
      type: item.attributes['data-type'],
      body: getBody(item),
      parentId: item.parent.id,
      children: []
    }
  }

  // Remove null values.
  const removeNullValueFromArrayReducer = (list, current) => {
    return current ? [...list, current] : list
  }

  // Create final root object.
  const createRoot = () => ({
    type: 'root',
    body: '',
    id: 'Birch', // Birch is the root. Why? No idea… Taskpaper ¯\_(ツ)_/¯
    parentId: '',
    children: []
  })

  // Find an item recursively in our special object.
  // This will only work into our object and for the TaskPaper format.
  // The root object is deliberately created to look like a TaskPaper object
  // to prevent additional preconditions.
  const findItem = (current, id) => {
    // Default case: the current object is the parent.
    if (current.id === id) return current

    // Recursive.
    const {children} = current
    for (const child of children) {
      if (child.id === id) {
        return child
      } else {
        const nestedChild = findItem(child, id)
        if (nestedChild) return nestedChild
      }
    }
  }

  // Take a flat list of object and return an object with a hierarchy.
  //  [{id: 'a0', parentId: 'Birch'}, {id: 'b1', parentId: 'a0'}]
  //  =>
  //  {id: 'Birch', children: [{id: 'a0', parentId: 'Birch', children: [{id: 'b1', parentId: 'a0'}]}]}
  const restructureFlatListToHierarchyObjectReducer = (result, current) => {
    // This work because a Taskpaper is sequential and the parent if always before its children.
    // We are guarenteed to have a parent, and this removes many preconditions.
    const parent = findItem(result, current.parentId)
    parent.children.push(current)

    return result
  }

  // Process:
  const data = editor.displayedItems
    .map(convertTaskPaperItem) // Convert.
    .reduce(removeNullValueFromArrayReducer, []) // Clean.
    .reduce(restructureFlatListToHierarchyObjectReducer, createRoot()) // Hierarchy.

  return JSON.stringify(data)
}

// -------------------------------------------------------------
// OSAScript.
// -------------------------------------------------------------

// The only actual ApplScript code that starts the process:
if (Application('TaskPaper').running()) {
  Application('TaskPaper').documents[0].evaluate({
    script: Context.toString()
  })
}
