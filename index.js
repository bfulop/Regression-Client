import { h, app } from 'hyperapp'
import { div, h1, h2, h3, img, button, pre, a } from '@hyperapp/html'
import './main.css'
import { findResult } from './utils'
import io from 'socket.io-client'

var socket = io('http://localhost:3033')
socket.on('connect', function() {
  console.log('connected')
})
socket.on('update', function(data) {
  main.onGetResults(JSON.parse(data))
})
socket.on('disconnect', function() {})

const logger = r => {
  console.log(r)
  return r
}
const sanitizeText = R.compose(
  R.replace(/\s|\W/g, '_'),
  r => r.toString(),
  R.defaultTo('index')
)

const getTargets = (state, actions) => {
  return fetch(global.mysecretkeys.serverIP + 'targets')
    .then(r => r.json())
    .then(actions.onGetTargets)
}
const getResults = (state, actions) => {
  actions.startLoading()
  return fetch(global.mysecretkeys.serverIP + 'compare')
    .then(r => r.json())
    .then(actions.onGetResults)
}

const state = {
  loading: false,
  targets: [],
  results: []
}

const actions = {
  startLoading: () => state => ({ loading: true }),
  loadTargets: () => getTargets,
  loadResults: () => getResults,
  onGetTargets: value => R.mergeDeepLeft({ targets: value }),
  onGetResults: value => R.mergeDeepLeft({ results: value, loading: false })
}

const randomNum = R.compose(
  Math.round,
  R.multiply(100000),
  Math.random
)

const renderLink = u => a(
          {href: `http://104.225.222.139:8080/app_dev.php/${u}`},
          R.defaultTo('index', u)
        )
const renderResults = r => t => {
  const renderBreakpoint = b => {
    const renderOneElement = e => {
      const filterPath = {
        route: R.prop('route', t),
        width: R.prop('width', b),
        targetelem: e
      }
      const currentShot = findResult(filterPath)(r)
      const diff = R.compose(
        R.defaultTo(1),
        R.prop('numDiffPixels')
      )(currentShot)
      let shotslist = [
        img({
          className: 'screenshot golden',
          src: `${global.mysecretkeys.serverIP}${
            global.mysecretkeys.goldenDir
          }/${sanitizeText(R.prop('route', t))}/${R.prop(
            'width',
            b
          )}/${sanitizeText(e)}.png`
        })
      ]
      if (diff > 0) {
        shotslist = R.append(
          img({
            className: `screenshot test ${diff > 1 ? 'regressed' : 'same'}`,
            src: `${global.mysecretkeys.serverIP}${
              global.mysecretkeys.testDir
            }/${sanitizeText(R.prop('route', t))}/${R.prop(
              'width',
              b
            )}/${sanitizeText(e)}.png?${randomNum()}`
          }),
          shotslist
        )
      }
      return div(
        { className: `anelem ${diff ? 'anelem--show' : 'anelem--hide'}` },
        [h3(`${e} - ${diff}`), div({ className: 'screenshots' }, shotslist)]
      )
    }
    return div({ className: 'awidth' }, [
      h2(R.prop('width', b)),
      div(
        { className: 'elemlist' },
        R.compose(
          R.map(renderOneElement),
          R.prop('elements')
        )(b)
      )
    ])
  }
  return div({ className: 'target' }, [
    h1(
      [
        R.compose(
          renderLink,
          R.prop('route')
        )(t)
      ]
    ),
    R.compose(
      R.map(renderBreakpoint),
      R.prop('targets')
    )(t)
  ])
}

const view = (state, actions) =>
  div({ className: 'main' }, [
    h1('Screenshots list'),
    h2(
      {
        className: state.loading
          ? 'loader loader--visible'
          : 'loader loader--hidden'
      },
      'Regression server is comparing latest screenshots...'
    ),
    button({ onclick: actions.loadTargets }, 'load baseline'),
    button({ onclick: actions.loadResults }, 'load regressions'),
    div(R.map(renderResults(state.results), state.targets))
  ])

const main = app(state, actions, view, document.body)
