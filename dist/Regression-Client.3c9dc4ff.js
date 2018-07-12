// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({6:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.h = h;
exports.app = app;
function h(name, attributes) {
  var rest = [];
  var children = [];
  var length = arguments.length;

  while (length-- > 2) rest.push(arguments[length]);

  while (rest.length) {
    var node = rest.pop();
    if (node && node.pop) {
      for (length = node.length; length--;) {
        rest.push(node[length]);
      }
    } else if (node != null && node !== true && node !== false) {
      children.push(node);
    }
  }

  return typeof name === "function" ? name(attributes || {}, children) : {
    nodeName: name,
    attributes: attributes || {},
    children: children,
    key: attributes && attributes.key
  };
}

function app(state, actions, view, container) {
  var map = [].map;
  var rootElement = container && container.children[0] || null;
  var oldNode = rootElement && recycleElement(rootElement);
  var lifecycle = [];
  var skipRender;
  var isRecycling = true;
  var globalState = clone(state);
  var wiredActions = wireStateToActions([], globalState, clone(actions));

  scheduleRender();

  return wiredActions;

  function recycleElement(element) {
    return {
      nodeName: element.nodeName.toLowerCase(),
      attributes: {},
      children: map.call(element.childNodes, function (element) {
        return element.nodeType === 3 // Node.TEXT_NODE
        ? element.nodeValue : recycleElement(element);
      })
    };
  }

  function resolveNode(node) {
    return typeof node === "function" ? resolveNode(node(globalState, wiredActions)) : node != null ? node : "";
  }

  function render() {
    skipRender = !skipRender;

    var node = resolveNode(view);

    if (container && !skipRender) {
      rootElement = patch(container, rootElement, oldNode, oldNode = node);
    }

    isRecycling = false;

    while (lifecycle.length) lifecycle.pop()();
  }

  function scheduleRender() {
    if (!skipRender) {
      skipRender = true;
      setTimeout(render);
    }
  }

  function clone(target, source) {
    var out = {};

    for (var i in target) out[i] = target[i];
    for (var i in source) out[i] = source[i];

    return out;
  }

  function setPartialState(path, value, source) {
    var target = {};
    if (path.length) {
      target[path[0]] = path.length > 1 ? setPartialState(path.slice(1), value, source[path[0]]) : value;
      return clone(source, target);
    }
    return value;
  }

  function getPartialState(path, source) {
    var i = 0;
    while (i < path.length) {
      source = source[path[i++]];
    }
    return source;
  }

  function wireStateToActions(path, state, actions) {
    for (var key in actions) {
      typeof actions[key] === "function" ? function (key, action) {
        actions[key] = function (data) {
          var result = action(data);

          if (typeof result === "function") {
            result = result(getPartialState(path, globalState), actions);
          }

          if (result && result !== (state = getPartialState(path, globalState)) && !result.then // !isPromise
          ) {
              scheduleRender(globalState = setPartialState(path, clone(state, result), globalState));
            }

          return result;
        };
      }(key, actions[key]) : wireStateToActions(path.concat(key), state[key] = clone(state[key]), actions[key] = clone(actions[key]));
    }

    return actions;
  }

  function getKey(node) {
    return node ? node.key : null;
  }

  function eventListener(event) {
    return event.currentTarget.events[event.type](event);
  }

  function updateAttribute(element, name, value, oldValue, isSvg) {
    if (name === "key") {} else if (name === "style") {
      for (var i in clone(oldValue, value)) {
        var style = value == null || value[i] == null ? "" : value[i];
        if (i[0] === "-") {
          element[name].setProperty(i, style);
        } else {
          element[name][i] = style;
        }
      }
    } else {
      if (name[0] === "o" && name[1] === "n") {
        name = name.slice(2);

        if (element.events) {
          if (!oldValue) oldValue = element.events[name];
        } else {
          element.events = {};
        }

        element.events[name] = value;

        if (value) {
          if (!oldValue) {
            element.addEventListener(name, eventListener);
          }
        } else {
          element.removeEventListener(name, eventListener);
        }
      } else if (name in element && name !== "list" && !isSvg) {
        element[name] = value == null ? "" : value;
      } else if (value != null && value !== false) {
        element.setAttribute(name, value);
      }

      if (value == null || value === false) {
        element.removeAttribute(name);
      }
    }
  }

  function createElement(node, isSvg) {
    var element = typeof node === "string" || typeof node === "number" ? document.createTextNode(node) : (isSvg = isSvg || node.nodeName === "svg") ? document.createElementNS("http://www.w3.org/2000/svg", node.nodeName) : document.createElement(node.nodeName);

    var attributes = node.attributes;
    if (attributes) {
      if (attributes.oncreate) {
        lifecycle.push(function () {
          attributes.oncreate(element);
        });
      }

      for (var i = 0; i < node.children.length; i++) {
        element.appendChild(createElement(node.children[i] = resolveNode(node.children[i]), isSvg));
      }

      for (var name in attributes) {
        updateAttribute(element, name, attributes[name], null, isSvg);
      }
    }

    return element;
  }

  function updateElement(element, oldAttributes, attributes, isSvg) {
    for (var name in clone(oldAttributes, attributes)) {
      if (attributes[name] !== (name === "value" || name === "checked" ? element[name] : oldAttributes[name])) {
        updateAttribute(element, name, attributes[name], oldAttributes[name], isSvg);
      }
    }

    var cb = isRecycling ? attributes.oncreate : attributes.onupdate;
    if (cb) {
      lifecycle.push(function () {
        cb(element, oldAttributes);
      });
    }
  }

  function removeChildren(element, node) {
    var attributes = node.attributes;
    if (attributes) {
      for (var i = 0; i < node.children.length; i++) {
        removeChildren(element.childNodes[i], node.children[i]);
      }

      if (attributes.ondestroy) {
        attributes.ondestroy(element);
      }
    }
    return element;
  }

  function removeElement(parent, element, node) {
    function done() {
      parent.removeChild(removeChildren(element, node));
    }

    var cb = node.attributes && node.attributes.onremove;
    if (cb) {
      cb(element, done);
    } else {
      done();
    }
  }

  function patch(parent, element, oldNode, node, isSvg) {
    if (node === oldNode) {} else if (oldNode == null || oldNode.nodeName !== node.nodeName) {
      var newElement = createElement(node, isSvg);
      parent.insertBefore(newElement, element);

      if (oldNode != null) {
        removeElement(parent, element, oldNode);
      }

      element = newElement;
    } else if (oldNode.nodeName == null) {
      element.nodeValue = node;
    } else {
      updateElement(element, oldNode.attributes, node.attributes, isSvg = isSvg || node.nodeName === "svg");

      var oldKeyed = {};
      var newKeyed = {};
      var oldElements = [];
      var oldChildren = oldNode.children;
      var children = node.children;

      for (var i = 0; i < oldChildren.length; i++) {
        oldElements[i] = element.childNodes[i];

        var oldKey = getKey(oldChildren[i]);
        if (oldKey != null) {
          oldKeyed[oldKey] = [oldElements[i], oldChildren[i]];
        }
      }

      var i = 0;
      var k = 0;

      while (k < children.length) {
        var oldKey = getKey(oldChildren[i]);
        var newKey = getKey(children[k] = resolveNode(children[k]));

        if (newKeyed[oldKey]) {
          i++;
          continue;
        }

        if (newKey != null && newKey === getKey(oldChildren[i + 1])) {
          if (oldKey == null) {
            removeElement(element, oldElements[i], oldChildren[i]);
          }
          i++;
          continue;
        }

        if (newKey == null || isRecycling) {
          if (oldKey == null) {
            patch(element, oldElements[i], oldChildren[i], children[k], isSvg);
            k++;
          }
          i++;
        } else {
          var keyedNode = oldKeyed[newKey] || [];

          if (oldKey === newKey) {
            patch(element, keyedNode[0], keyedNode[1], children[k], isSvg);
            i++;
          } else if (keyedNode[0]) {
            patch(element, element.insertBefore(keyedNode[0], oldElements[i]), keyedNode[1], children[k], isSvg);
          } else {
            patch(element, oldElements[i], null, children[k], isSvg);
          }

          newKeyed[newKey] = children[k];
          k++;
        }
      }

      while (i < oldChildren.length) {
        if (getKey(oldChildren[i]) == null) {
          removeElement(element, oldElements[i], oldChildren[i]);
        }
        i++;
      }

      for (var i in oldKeyed) {
        if (!newKeyed[i]) {
          removeElement(element, oldKeyed[i][0], oldKeyed[i][1]);
        }
      }
    }
    return element;
  }
}
},{}],7:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.a = a;
exports.abbr = abbr;
exports.address = address;
exports.area = area;
exports.article = article;
exports.aside = aside;
exports.audio = audio;
exports.b = b;
exports.bdi = bdi;
exports.bdo = bdo;
exports.blockquote = blockquote;
exports.br = br;
exports.button = button;
exports.canvas = canvas;
exports.caption = caption;
exports.cite = cite;
exports.code = code;
exports.col = col;
exports.colgroup = colgroup;
exports.data = data;
exports.datalist = datalist;
exports.dd = dd;
exports.del = del;
exports.details = details;
exports.dfn = dfn;
exports.dialog = dialog;
exports.div = div;
exports.dl = dl;
exports.dt = dt;
exports.em = em;
exports.embed = embed;
exports.fieldset = fieldset;
exports.figcaption = figcaption;
exports.figure = figure;
exports.footer = footer;
exports.form = form;
exports.h1 = h1;
exports.h2 = h2;
exports.h3 = h3;
exports.h4 = h4;
exports.h5 = h5;
exports.h6 = h6;
exports.header = header;
exports.hr = hr;
exports.i = i;
exports.iframe = iframe;
exports.img = img;
exports.input = input;
exports.ins = ins;
exports.kbd = kbd;
exports.label = label;
exports.legend = legend;
exports.li = li;
exports.main = main;
exports.map = map;
exports.mark = mark;
exports.menu = menu;
exports.menuitem = menuitem;
exports.meter = meter;
exports.nav = nav;
exports.object = object;
exports.ol = ol;
exports.optgroup = optgroup;
exports.option = option;
exports.output = output;
exports.p = p;
exports.param = param;
exports.pre = pre;
exports.progress = progress;
exports.q = q;
exports.rp = rp;
exports.rt = rt;
exports.rtc = rtc;
exports.ruby = ruby;
exports.s = s;
exports.samp = samp;
exports.section = section;
exports.select = select;
exports.small = small;
exports.source = source;
exports.span = span;
exports.strong = strong;
exports.sub = sub;
exports.summary = summary;
exports.sup = sup;
exports.svg = svg;
exports.table = table;
exports.tbody = tbody;
exports.td = td;
exports.textarea = textarea;
exports.tfoot = tfoot;
exports.th = th;
exports.thead = thead;
exports.time = time;
exports.tr = tr;
exports.track = track;
exports.u = u;
exports.ul = ul;
exports.video = video;
exports.wbr = wbr;

var _hyperapp = require("hyperapp");

function vnode(name) {
  return function (attributes, children) {
    return typeof attributes === "object" && !Array.isArray(attributes) ? (0, _hyperapp.h)(name, attributes, children) : (0, _hyperapp.h)(name, {}, attributes);
  };
}

function a(attributes, children) {
  return vnode("a")(attributes, children);
}

function abbr(attributes, children) {
  return vnode("abbr")(attributes, children);
}

function address(attributes, children) {
  return vnode("address")(attributes, children);
}

function area(attributes, children) {
  return vnode("area")(attributes, children);
}

function article(attributes, children) {
  return vnode("article")(attributes, children);
}

function aside(attributes, children) {
  return vnode("aside")(attributes, children);
}

function audio(attributes, children) {
  return vnode("audio")(attributes, children);
}

function b(attributes, children) {
  return vnode("b")(attributes, children);
}

function bdi(attributes, children) {
  return vnode("bdi")(attributes, children);
}

function bdo(attributes, children) {
  return vnode("bdo")(attributes, children);
}

function blockquote(attributes, children) {
  return vnode("blockquote")(attributes, children);
}

function br(attributes, children) {
  return vnode("br")(attributes, children);
}

function button(attributes, children) {
  return vnode("button")(attributes, children);
}

function canvas(attributes, children) {
  return vnode("canvas")(attributes, children);
}

function caption(attributes, children) {
  return vnode("caption")(attributes, children);
}

function cite(attributes, children) {
  return vnode("cite")(attributes, children);
}

function code(attributes, children) {
  return vnode("code")(attributes, children);
}

function col(attributes, children) {
  return vnode("col")(attributes, children);
}

function colgroup(attributes, children) {
  return vnode("colgroup")(attributes, children);
}

function data(attributes, children) {
  return vnode("data")(attributes, children);
}

function datalist(attributes, children) {
  return vnode("datalist")(attributes, children);
}

function dd(attributes, children) {
  return vnode("dd")(attributes, children);
}

function del(attributes, children) {
  return vnode("del")(attributes, children);
}

function details(attributes, children) {
  return vnode("details")(attributes, children);
}

function dfn(attributes, children) {
  return vnode("dfn")(attributes, children);
}

function dialog(attributes, children) {
  return vnode("dialog")(attributes, children);
}

function div(attributes, children) {
  return vnode("div")(attributes, children);
}

function dl(attributes, children) {
  return vnode("dl")(attributes, children);
}

function dt(attributes, children) {
  return vnode("dt")(attributes, children);
}

function em(attributes, children) {
  return vnode("em")(attributes, children);
}

function embed(attributes, children) {
  return vnode("embed")(attributes, children);
}

function fieldset(attributes, children) {
  return vnode("fieldset")(attributes, children);
}

function figcaption(attributes, children) {
  return vnode("figcaption")(attributes, children);
}

function figure(attributes, children) {
  return vnode("figure")(attributes, children);
}

function footer(attributes, children) {
  return vnode("footer")(attributes, children);
}

function form(attributes, children) {
  return vnode("form")(attributes, children);
}

function h1(attributes, children) {
  return vnode("h1")(attributes, children);
}

function h2(attributes, children) {
  return vnode("h2")(attributes, children);
}

function h3(attributes, children) {
  return vnode("h3")(attributes, children);
}

function h4(attributes, children) {
  return vnode("h4")(attributes, children);
}

function h5(attributes, children) {
  return vnode("h5")(attributes, children);
}

function h6(attributes, children) {
  return vnode("h6")(attributes, children);
}

function header(attributes, children) {
  return vnode("header")(attributes, children);
}

function hr(attributes, children) {
  return vnode("hr")(attributes, children);
}

function i(attributes, children) {
  return vnode("i")(attributes, children);
}

function iframe(attributes, children) {
  return vnode("iframe")(attributes, children);
}

function img(attributes, children) {
  return vnode("img")(attributes, children);
}

function input(attributes, children) {
  return vnode("input")(attributes, children);
}

function ins(attributes, children) {
  return vnode("ins")(attributes, children);
}

function kbd(attributes, children) {
  return vnode("kbd")(attributes, children);
}

function label(attributes, children) {
  return vnode("label")(attributes, children);
}

function legend(attributes, children) {
  return vnode("legend")(attributes, children);
}

function li(attributes, children) {
  return vnode("li")(attributes, children);
}

function main(attributes, children) {
  return vnode("main")(attributes, children);
}

function map(attributes, children) {
  return vnode("map")(attributes, children);
}

function mark(attributes, children) {
  return vnode("mark")(attributes, children);
}

function menu(attributes, children) {
  return vnode("menu")(attributes, children);
}

function menuitem(attributes, children) {
  return vnode("menuitem")(attributes, children);
}

function meter(attributes, children) {
  return vnode("meter")(attributes, children);
}

function nav(attributes, children) {
  return vnode("nav")(attributes, children);
}

function object(attributes, children) {
  return vnode("object")(attributes, children);
}

function ol(attributes, children) {
  return vnode("ol")(attributes, children);
}

function optgroup(attributes, children) {
  return vnode("optgroup")(attributes, children);
}

function option(attributes, children) {
  return vnode("option")(attributes, children);
}

function output(attributes, children) {
  return vnode("output")(attributes, children);
}

function p(attributes, children) {
  return vnode("p")(attributes, children);
}

function param(attributes, children) {
  return vnode("param")(attributes, children);
}

function pre(attributes, children) {
  return vnode("pre")(attributes, children);
}

function progress(attributes, children) {
  return vnode("progress")(attributes, children);
}

function q(attributes, children) {
  return vnode("q")(attributes, children);
}

function rp(attributes, children) {
  return vnode("rp")(attributes, children);
}

function rt(attributes, children) {
  return vnode("rt")(attributes, children);
}

function rtc(attributes, children) {
  return vnode("rtc")(attributes, children);
}

function ruby(attributes, children) {
  return vnode("ruby")(attributes, children);
}

function s(attributes, children) {
  return vnode("s")(attributes, children);
}

function samp(attributes, children) {
  return vnode("samp")(attributes, children);
}

function section(attributes, children) {
  return vnode("section")(attributes, children);
}

function select(attributes, children) {
  return vnode("select")(attributes, children);
}

function small(attributes, children) {
  return vnode("small")(attributes, children);
}

function source(attributes, children) {
  return vnode("source")(attributes, children);
}

function span(attributes, children) {
  return vnode("span")(attributes, children);
}

function strong(attributes, children) {
  return vnode("strong")(attributes, children);
}

function sub(attributes, children) {
  return vnode("sub")(attributes, children);
}

function summary(attributes, children) {
  return vnode("summary")(attributes, children);
}

function sup(attributes, children) {
  return vnode("sup")(attributes, children);
}

function svg(attributes, children) {
  return vnode("svg")(attributes, children);
}

function table(attributes, children) {
  return vnode("table")(attributes, children);
}

function tbody(attributes, children) {
  return vnode("tbody")(attributes, children);
}

function td(attributes, children) {
  return vnode("td")(attributes, children);
}

function textarea(attributes, children) {
  return vnode("textarea")(attributes, children);
}

function tfoot(attributes, children) {
  return vnode("tfoot")(attributes, children);
}

function th(attributes, children) {
  return vnode("th")(attributes, children);
}

function thead(attributes, children) {
  return vnode("thead")(attributes, children);
}

function time(attributes, children) {
  return vnode("time")(attributes, children);
}

function tr(attributes, children) {
  return vnode("tr")(attributes, children);
}

function track(attributes, children) {
  return vnode("track")(attributes, children);
}

function u(attributes, children) {
  return vnode("u")(attributes, children);
}

function ul(attributes, children) {
  return vnode("ul")(attributes, children);
}

function video(attributes, children) {
  return vnode("video")(attributes, children);
}

function wbr(attributes, children) {
  return vnode("wbr")(attributes, children);
}
},{"hyperapp":6}],403:[function(require,module,exports) {
var bundleURL = null;
function getBundleURLCached() {
  if (!bundleURL) {
    bundleURL = getBundleURL();
  }

  return bundleURL;
}

function getBundleURL() {
  // Attempt to find the URL of the current script and use that as the base URL
  try {
    throw new Error();
  } catch (err) {
    var matches = ('' + err.stack).match(/(https?|file|ftp):\/\/[^)\n]+/g);
    if (matches) {
      return getBaseURL(matches[0]);
    }
  }

  return '/';
}

function getBaseURL(url) {
  return ('' + url).replace(/^((?:https?|file|ftp):\/\/.+)\/[^/]+$/, '$1') + '/';
}

exports.getBundleURL = getBundleURLCached;
exports.getBaseURL = getBaseURL;
},{}],402:[function(require,module,exports) {
var bundle = require('./bundle-url');

function updateLink(link) {
  var newLink = link.cloneNode();
  newLink.onload = function () {
    link.remove();
  };
  newLink.href = link.href.split('?')[0] + '?' + Date.now();
  link.parentNode.insertBefore(newLink, link.nextSibling);
}

var cssTimeout = null;
function reloadCSS() {
  if (cssTimeout) {
    return;
  }

  cssTimeout = setTimeout(function () {
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
      if (bundle.getBaseURL(links[i].href) === bundle.getBundleURL()) {
        updateLink(links[i]);
      }
    }

    cssTimeout = null;
  }, 50);
}

module.exports = reloadCSS;
},{"./bundle-url":403}],401:[function(require,module,exports) {

var reloadCSS = require('_css_loader');
module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":402}],404:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var dynPropEq = R.apply(R.propEq);

var createFilter = R.compose(R.map(dynPropEq), R.toPairs);

var allPropEq = function allPropEq(filterObj) {
  return R.allPass(createFilter(filterObj));
};

var findResult = exports.findResult = function findResult(tPath) {
  return R.find(allPropEq(tPath));
};
},{}],2:[function(require,module,exports) {
var global = arguments[3];
"use strict";

var _hyperapp = require("hyperapp");

var _html = require("@hyperapp/html");

require("./main.css");

var _utils = require("./utils");

var logger = function logger(r) {
  console.log(r);
  return r;
};
var sanitizeText = R.compose(R.replace(/\s|\W/g, '_'), function (r) {
  return r.toString();
}, R.defaultTo('index'));

var getTargets = function getTargets(state, actions) {
  return fetch(global.mysecretkeys.serverIP + 'targets').then(function (r) {
    return r.json();
  }).then(actions.onGetTargets);
};
var getResults = function getResults(state, actions) {
  actions.startLoading();
  return fetch(global.mysecretkeys.serverIP + 'compare').then(function (r) {
    return r.json();
  }).then(actions.onGetResults);
};

var state = {
  loading: false,
  targets: [],
  results: []
};

var actions = {
  startLoading: function startLoading() {
    return function (state) {
      return { loading: true };
    };
  },
  loadTargets: function loadTargets() {
    return getTargets;
  },
  loadResults: function loadResults() {
    return getResults;
  },
  onGetTargets: function onGetTargets(value) {
    return R.mergeDeepLeft({ targets: value });
  },
  onGetResults: function onGetResults(value) {
    return R.mergeDeepLeft({ results: value, loading: false });
  }
};

var renderResults = function renderResults(r) {
  return function (t) {

    var renderBreakpoint = function renderBreakpoint(b) {
      var renderOneElement = function renderOneElement(e) {
        var filterPath = {
          route: R.prop('route', t),
          width: R.prop('width', b),
          targetelem: e
        };
        var currentShot = (0, _utils.findResult)(filterPath)(r);
        var diff = R.compose(R.defaultTo(1), R.prop('numDiffPixels'))(currentShot);
        return (0, _html.div)({ className: "anelem " + (diff ? 'anelem--show' : 'anelem--hide') }, [(0, _html.h3)(e + " - " + diff), (0, _html.div)({ className: 'screenshots' }, [(0, _html.img)({ className: 'screenshot golden', src: "" + global.mysecretkeys.serverIP + global.mysecretkeys.goldenDir + "/" + sanitizeText(R.prop('route', t)) + "/" + R.prop('width', b) + "/" + sanitizeText(e) + ".png" }), (0, _html.img)({ className: "screenshot test " + (diff > 1 ? 'regressed' : 'same'), src: "" + global.mysecretkeys.serverIP + global.mysecretkeys.testDir + "/" + sanitizeText(R.prop('route', t)) + "/" + R.prop('width', b) + "/" + sanitizeText(e) + ".png" })])]);
      };
      return (0, _html.div)({ className: 'awidth' }, [(0, _html.h2)(R.prop('width', b)), (0, _html.div)({ className: 'elemlist' }, R.compose(R.map(renderOneElement), R.prop('elements'))(b))]);
    };
    return (0, _html.div)({ className: 'target' }, [(0, _html.h1)(R.prop('route', t)), R.compose(R.map(renderBreakpoint), R.prop('targets'))(t)]);
  };
};

var view = function view(state, actions) {
  return (0, _html.div)({ className: 'main' }, [(0, _html.h1)('Screenshots list'), (0, _html.h2)({ className: state.loading ? 'loader loader--visible' : 'loader loader--hidden' }, 'Regression server is comparing latest screenshots...'), (0, _html.button)({ onclick: actions.loadTargets }, "load baseline"), (0, _html.button)({ onclick: actions.loadResults }, "load regressions"), (0, _html.div)(R.map(renderResults(state.results), state.targets))]);
};

(0, _hyperapp.app)(state, actions, view, document.body);
},{"hyperapp":6,"@hyperapp/html":7,"./main.css":401,"./utils":404}],18:[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';

var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };

  module.bundle.hotData = null;
}

module.bundle.Module = Module;

var parent = module.bundle.parent;
if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = '' || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + '53472' + '/');
  ws.onmessage = function (event) {
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      console.clear();

      data.assets.forEach(function (asset) {
        hmrApply(global.parcelRequire, asset);
      });

      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          hmrAccept(global.parcelRequire, asset.id);
        }
      });
    }

    if (data.type === 'reload') {
      ws.close();
      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');

      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);

      removeErrorOverlay();

      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);
  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  // html encode message and stack trace
  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;

  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';

  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];
      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(+k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAccept(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAccept(bundle.parent, id);
  }

  var cached = bundle.cache[id];
  bundle.hotData = {};
  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);

  cached = bundle.cache[id];
  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAccept(global.parcelRequire, id);
  });
}
},{}]},{},[18,2], null)
//# sourceMappingURL=/Regression-Client.3c9dc4ff.map