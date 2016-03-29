var createInstance = require('construct')
var debug = require('debug')('ast-to-reql')
var exists = require('101/exists')
var inverse = require('object-loops/inverse')
var isObject = require('101/is-object')
var map = require('object-loops/map')
var protoDef = require('rethinkdb/proto-def')
var rethinkdb = require('rethinkdb')
var termClasses = require('validate-reql/lib/term-classes.js')

var termTypeById = inverse(protoDef.Term.TermType) // { '<id>': '<TERM>', ... }

module.exports = astToReQl

function astToReQl (ast) {
  if (Array.isArray(ast)) {
    debug('ast is array %o', JSON.stringify(ast))
    return astTermToReQL(ast)
  } else if (isObject(ast)) {
    debug('ast is object %o', ast)
    var termType = ast['$reql_type$']
    if ('$reql_type$' in ast && termType in termClasses) {
      // if nested reql type it is a binary term see rethinkdb/ast.js `build` methods
      var BinaryTerm = termClasses[termType]
      return new BinaryTerm(new Buffer(ast.data, 'base64'))
    } else {
      return map(ast, astToReQl)
    }
  } else if (ast === undefined) {
    debug('ast is undefined %o', ast)
    return undefined
  } else {
    debug('ast is expr %o', ast)
    return rethinkdb.expr(ast)
  }
}

function astTermToReQL (ast) {
  debug('ast term length %o', ast.length, ast.length <= 3)
  assertErr(ast.length <= 3, 'Unexpected term array length', { ast: ast })
  // parse ast array
  var termId = ast[0]
  var termArgs = ast[1]
  var termOpts = ast[2]
  var termType = termTypeById[termId] // basically term name
  debug('ast term parts %o: %o %o, %o', termType, termId, termArgs, termOpts)
  // assert parsed data
  assertErr(termType, 'Unexpected term command id', { ast: ast })
  // assertErr(!Array.isArray(termArgs), 'Unexpected term args, expected an array', { ast: ast })
  assertErr(termOpts === undefined || isObject(termOpts), 'Unexpected term opts, expected undefined or object', { ast: ast })
  // build ast
  termArgs = termArgs.map(astToReQl)
  termOpts = astToReQl(termOpts)
  // get term classes
  var constructArgs = [termOpts].concat(termArgs)
  return createTerm(termType, constructArgs)
}

function createTerm (termType, constructArgs) {
  var TermClass = termClasses[termType]
  var TermSuperClass = TermClass.__super__.constructor
  // create reql
  // ignore coverage for else, bc it is just a safety case for unknown classes.
  /* istanbul ignore else */
  if (TermSuperClass.name === 'RDBOp') {
    const termReQL = Object.create(TermClass.prototype)
    debug('create ast term instance RDBOp: %o', TermClass.name, termReQL, constructArgs)
    return TermSuperClass.apply(termReQL, constructArgs)
  } else if (TermSuperClass.name === 'RDBConstant') {
    debug('create ast term instance RDBConstant: %o', TermClass.name, constructArgs)
    return createInstance(TermClass, constructArgs)
  } else {
    // this case is to handle the unknown.
    debug('unexpected term type %o, %o', TermClass.name, TermSuperClass.name)
    var err = new Error('Unexpected term type')
    err.data = { ast: ast, termType: termType }
    throw err
  }
}

function assertErr (bool, msg, data) {
  if (!bool) {
    var err = new Error(msg)
    err.data = data
    Error.captureStackTrace(err, assertErr)
    throw err
  }
}