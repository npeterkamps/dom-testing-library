import {fuzzyMatches, matches} from './matches'
import {getNodeText} from './get-node-text'
import {prettyDOM} from './pretty-dom'

function debugDOM(htmlElement) {
  const limit =  process.env.DEBUG_PRINT_LIMIT || 7000
  const inNode = (typeof module !== 'undefined' && module.exports)
  const inBrowser = (typeof window !== 'undefined' && window.document)
  const inCypress = (typeof window !== 'undefined' && window.Cypress)
  if (inCypress) {
    return ''
  }
  if (inBrowser && !inNode) {
    return `\n\n${prettyDOM(htmlElement, limit, { highlight: false })}`
  }
  return `\n\n${prettyDOM(htmlElement, limit)}`
}

// Here are the queries for the library.
// The queries here should only be things that are accessible to both users who are using a screen reader
// and those who are not using a screen reader (with the exception of the data-testid attribute query).

function firstResultOrNull(queryFunction, ...args) {
  const result = queryFunction(...args)
  if (result.length === 0) return null
  return result[0]
}

function queryAllLabelsByText(
  container,
  text,
  {exact = true, trim = true, collapseWhitespace = true} = {},
) {
  const matcher = exact ? matches : fuzzyMatches
  const matchOpts = {collapseWhitespace, trim}
  return Array.from(container.querySelectorAll('label')).filter(label =>
    matcher(label.textContent, label, text, matchOpts),
  )
}

function queryAllByLabelText(
  container,
  text,
  {selector = '*', exact = true, collapseWhitespace = true, trim = true} = {},
) {
  const matchOpts = {collapseWhitespace, trim}
  const labels = queryAllLabelsByText(container, text, {exact, ...matchOpts})
  const labelledElements = labels
    .map(label => {
      if (label.control) {
        return label.control
      }
      /* istanbul ignore if */
      if (label.getAttribute('for')) {
        // we're using this notation because with the # selector we would have to escape special characters e.g. user.name
        // see https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector#Escaping_special_characters
        // <label for="someId">text</label><input id="someId" />

        // .control support has landed in jsdom (https://github.com/jsdom/jsdom/issues/2175)
        /* istanbul ignore next */
        return container.querySelector(`[id="${label.getAttribute('for')}"]`)
      }
      if (label.getAttribute('id')) {
        // <label id="someId">text</label><input aria-labelledby="someId" />
        return container.querySelector(
          `[aria-labelledby="${label.getAttribute('id')}"]`,
        )
      }
      if (label.childNodes.length) {
        // <label>text: <input /></label>
        return label.querySelector(selector)
      }
      return null
    })
    .filter(label => label !== null)
    .concat(queryAllByAttribute('aria-label', container, text, {exact}))

  return labelledElements
}

function queryByLabelText(...args) {
  return firstResultOrNull(queryAllByLabelText, ...args)
}

function queryAllByText(
  container,
  text,
  {selector = '*', exact = true, collapseWhitespace = true, trim = true} = {},
) {
  const matcher = exact ? matches : fuzzyMatches
  const matchOpts = {collapseWhitespace, trim}
  return Array.from(container.querySelectorAll(selector)).filter(node =>
    matcher(getNodeText(node), node, text, matchOpts),
  )
}

function queryByText(...args) {
  return firstResultOrNull(queryAllByText, ...args)
}

// this is just a utility and not an exposed query.
// There are no plans to expose this.
function queryAllByAttribute(
  attribute,
  container,
  text,
  {exact = true, collapseWhitespace = true, trim = true} = {},
) {
  const matcher = exact ? matches : fuzzyMatches
  const matchOpts = {collapseWhitespace, trim}
  return Array.from(container.querySelectorAll(`[${attribute}]`)).filter(node =>
    matcher(node.getAttribute(attribute), node, text, matchOpts),
  )
}

// this is just a utility and not an exposed query.
// There are no plans to expose this.
function queryByAttribute(...args) {
  return firstResultOrNull(queryAllByAttribute, ...args)
}

const queryByPlaceholderText = queryByAttribute.bind(null, 'placeholder')
const queryAllByPlaceholderText = queryAllByAttribute.bind(null, 'placeholder')
const queryByTestId = queryByAttribute.bind(null, 'data-testid')
const queryAllByTestId = queryAllByAttribute.bind(null, 'data-testid')
const queryByTitle = queryByAttribute.bind(null, 'title')
const queryAllByTitle = queryAllByAttribute.bind(null, 'title')
const queryByValue = queryByAttribute.bind(null, 'value')
const queryAllByValue = queryAllByAttribute.bind(null, 'value')

function queryAllByAltText(
  container,
  alt,
  {exact = true, collapseWhitespace = true, trim = true} = {},
) {
  const matcher = exact ? matches : fuzzyMatches
  const matchOpts = {collapseWhitespace, trim}
  return Array.from(container.querySelectorAll('img,input,area')).filter(node =>
    matcher(node.getAttribute('alt'), node, alt, matchOpts),
  )
}

function queryByAltText(...args) {
  return firstResultOrNull(queryAllByAltText, ...args)
}

// getters
// the reason we're not dynamically generating these functions that look so similar:
// 1. The error messages are specific to each one and depend on arguments
// 2. The stack trace will look better because it'll have a helpful method name.

function getAllByTestId(container, id, ...rest) {
  const els = queryAllByTestId(container, id, ...rest)
  if (!els.length) {
    throw new Error(
      `Unable to find an element by: [data-testid="${id}"] ${debugDOM(
        container,
      )}`,
    )
  }
  return els
}

function getByTestId(...args) {
  return firstResultOrNull(getAllByTestId, ...args)
}

function getAllByTitle(container, title, ...rest) {
  const els = queryAllByTitle(container, title, ...rest)
  if (!els.length) {
    throw new Error(
      `Unable to find an element with the title: ${title}. ${debugDOM(
        container,
      )}`,
    )
  }
  return els
}

function getByTitle(...args) {
  return firstResultOrNull(getAllByTitle, ...args)
}

function getAllByValue(container, value, ...rest) {
  const els = queryAllByValue(container, value, ...rest)
  if (!els.length) {
    throw new Error(
      `Unable to find an element with the value: ${value}. ${debugDOM(
        container,
      )}`,
    )
  }
  return els
}

function getByValue(...args) {
  return firstResultOrNull(getAllByValue, ...args)
}

function getAllByPlaceholderText(container, text, ...rest) {
  const els = queryAllByPlaceholderText(container, text, ...rest)
  if (!els.length) {
    throw new Error(
      `Unable to find an element with the placeholder text of: ${text} ${debugDOM(
        container,
      )}`,
    )
  }
  return els
}

function getByPlaceholderText(...args) {
  return firstResultOrNull(getAllByPlaceholderText, ...args)
}

function getAllByLabelText(container, text, ...rest) {
  const els = queryAllByLabelText(container, text, ...rest)
  if (!els.length) {
    const labels = queryAllLabelsByText(container, text, ...rest)
    if (labels.length) {
      throw new Error(
        `Found a label with the text of: ${text}, however no form control was found associated to that label. Make sure you're using the "for" attribute or "aria-labelledby" attribute correctly. ${debugDOM(
          container,
        )}`,
      )
    } else {
      throw new Error(
        `Unable to find a label with the text of: ${text} ${debugDOM(
          container,
        )}`,
      )
    }
  }
  return els
}

function getByLabelText(...args) {
  return firstResultOrNull(getAllByLabelText, ...args)
}

function getAllByText(container, text, ...rest) {
  const els = queryAllByText(container, text, ...rest)
  if (!els.length) {
    throw new Error(
      `Unable to find an element with the text: ${text}. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible. ${debugDOM(
        container,
      )}`,
    )
  }
  return els
}

function getByText(...args) {
  return firstResultOrNull(getAllByText, ...args)
}

function getAllByAltText(container, alt, ...rest) {
  const els = queryAllByAltText(container, alt, ...rest)
  if (!els.length) {
    throw new Error(
      `Unable to find an element with the alt text: ${alt} ${debugDOM(
        container,
      )}`,
    )
  }
  return els
}

function getByAltText(...args) {
  return firstResultOrNull(getAllByAltText, ...args)
}

export {
  queryByPlaceholderText,
  queryAllByPlaceholderText,
  getByPlaceholderText,
  getAllByPlaceholderText,
  queryByText,
  queryAllByText,
  getByText,
  getAllByText,
  queryByLabelText,
  queryAllByLabelText,
  getByLabelText,
  getAllByLabelText,
  queryByAltText,
  queryAllByAltText,
  getByAltText,
  getAllByAltText,
  queryByTestId,
  queryAllByTestId,
  getByTestId,
  getAllByTestId,
  queryByTitle,
  queryAllByTitle,
  getByTitle,
  getAllByTitle,
  queryByValue,
  queryAllByValue,
  getByValue,
  getAllByValue,
}

/* eslint complexity:["error", 14] */
