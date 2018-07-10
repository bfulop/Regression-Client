import { h, app } from "hyperapp"
import { div, h1, button, pre } from "@hyperapp/html"
// import * as R from 'ramda'

const getTargets = (state, actions) => {
  return fetch(global.mysecretkeys.serverIP + 'targets')
    .then(r => r.json())
    .then(actions.onGetTargets)
}

const state = {
  count: 0,
  targets: [{route: 'hehe'}]
}

const actions = {
  down: () => state => ({ count: state.count - 1 }),
  up: () => state => ({ count: state.count + 1 }),
  loadTargets: () => getTargets,
  onGetTargets: value => state => ({ count: state.count + 1, targets: value })
}

const renderResults = R.prop('route')

const view = (state, actions) =>
  div([
    h1(state.count),
    div(R.map(renderResults, state.targets)),
    button({ onclick: actions.up }, "+"),
    button({ onclick: actions.loadTargets }, "load targets")
  ])

app(state, actions, view, document.body)
