const dynPropEq = R.apply(R.propEq)

const createFilter = R.compose(R.map(dynPropEq), R.toPairs)

const allPropEq = filterObj => R.allPass(createFilter(filterObj))

export const findResult = tPath => R.find(allPropEq(tPath))

