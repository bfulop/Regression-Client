import { h, app } from "hyperapp"
import { div, h1, h2, h3, img, button, pre } from "@hyperapp/html"
import './main.css'


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
      return div({className: 'anelem'},[
        h3(e),
        img({className: 'screenshot golden', src:`${global.mysecretkeys.serverIP}${global.mysecretkeys.goldenDir}/${sanitizeText(R.prop('route',t))}/${R.prop('width', b)}/${sanitizeText(e)}.png`})
      ])
    }
    return div({className: 'awidth'},[
      h2(R.prop('width', b)),
      div({className: 'elemlist'},R.compose(R.map(renderOneElement), R.prop('elements'))(b))
    ])
  }
  return div({className:'target'},[
    h1(R.prop('route', t)),
    R.compose(R.map(renderBreakpoint),R.prop('targets'))(t)
  ])

}

const view = (state, actions) =>
  div({className:'main'}, [
    h1('Screenshots list'),
    button({ onclick: actions.loadTargets }, "load targets"),
    div(R.map(renderResults, state.targets))
  ])

app(state, actions, view, document.body)
