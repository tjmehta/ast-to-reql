var expect = require('chai').expect

var astToReQL = require('../index.js')
var reqlQueries = require('./fixtures/reql-queries.js')

var describe = global.describe
var it = global.it

describe('ast-to-reql', function () {
  reqlQueries().forEach(function (reql, i) {
    it('should convert ast-to-reql ' + i, function (done) {
      var ast = reql.build()
      var reql2 = astToReQL(ast)
      expect(reql2.build()).to.deep.equal(ast)
      expect(reql2.toString()).to.equal(reql.toString())
      done()
    })
  })

  it('should error if array is unexpected length', function (done) {
    expect(function () {
      astToReQL(['b', 'o', 'g', 'u', 's'])
    }).to.throw()
    done()
  })
})
