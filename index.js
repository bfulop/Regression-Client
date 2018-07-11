import { h, app } from "hyperapp"
import { div, h1, h2, h3, img, button, pre } from "@hyperapp/html"
// import * as R from 'ramda'

const sanitizeText = R.compose(R.replace(/\s|\W/g, '_'), r => r.toString(), R.defaultTo('index'))

const getTargets = (state, actions) => {
  return fetch(global.mysecretkeys.serverIP + 'targets')
    .then(r => r.json())
    .then(actions.onGetTargets)
}

const state = {
  targets: []
}

const actions = {
  loadTargets: () => getTargets,
  onGetTargets: value => state => ({ targets: value })
}

const renderResults = t => {

  const renderBreakpoint = b => {
    const renderOneElement = e => {
      return div([
        h3(e),
        img({src:`${global.mysecretkeys.serverIP}${global.mysecretkeys.goldenDir}/${sanitizeText(R.prop('route',t))}/${R.prop('width', b)}/${sanitizeText(e)}.png`})
      ])
    }
    return div([
      h2(R.prop('width', b)),
      div(R.compose(R.map(renderOneElement), R.prop('elements'))(b))
    ])
  }
  return div([
    h1(R.prop('route', t)),
    R.compose(R.map(renderBreakpoint),R.prop('targets'))(t)
  ])

}

const view = (state, actions) =>
  div([
    button({ onclick: actions.loadTargets }, "load targets"),
    div(R.map(renderResults, state.targets))
  ])

app(state, actions, view, document.body)
