# ast-to-reql [![Build Status](https://travis-ci.org/tjmehta/ast-to-reql.svg)](https://travis-ci.org/tjmehta/ast-to-reql) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)
Create ReQL from RethinkDB AST

# Installation
```bash
npm i --save ast-to-reql
```

# Usage
silly example that converts reql to ast and then back to reql
```js
var astToReQL = require('ast-to-reql')

var reql = r.db('heroes').tableCreate('dc_universe')
var ast = reql.build()

var generateReQL = astToReQL(ast)
console.log(generateReQL.toString()) // 'r.db("heroes").tableCreate("dc_universe")'
```

# License
MIT