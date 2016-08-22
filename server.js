var express = require('express')

var app = express()

app.set('port', 8080)
app.set('ip', 'localhost')

app.use(express.static(__dirname + '/public'))
app.use('/nodeScripts', express.static(__dirname + '/node_modules/'))

var server = app.listen(app.get('port'), app.get('ip'), function () {
  var address = server.address()
  console.log('[server.js] app running at http://%s:%s', address.address, address.port)
})
