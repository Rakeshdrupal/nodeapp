'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

app.server = _http2.default.createServer(app);
// CORS - 3rd party middleware
app.use((0, _cors2.default)());
// This is required by falcor-express middleware to work correctly with falcor-browser
app.use(_bodyParser2.default.json({ extended: false }));
app.use(_bodyParser2.default.urlencoded({ extended: false }));

app.use(_express2.default.static('dist'));

app.server.listen(process.env.PORT || 3000);
console.log('Started on port ' + app.server.address().port);

exports.default = app;