'use strict';

require('./globals');
require('./setup-qcloud-sdk');

const http = require('http');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const config = require('./config');

const superagent = require('superagent')
const cheerio = require('cheerio')

const app = express();

const MY_TOKEN = 'djb'

app.set('query parser', 'simple');
app.set('case sensitive routing', true);
app.set('jsonp callback name', 'callback');
app.set('strict routing', true);
app.set('trust proxy', true);

app.disable('x-powered-by');

// 记录请求日志
app.use(morgan('tiny'));

// parse `application/x-www-form-urlencoded`
app.use(bodyParser.urlencoded({ extended: true }));

// parse `application/json`
app.use(bodyParser.json());

// app.use('/', require('./routes'));
app.get('/', function(req, res) {res.send('helloooooo')})

app.post('/api/getimg', function(req, res) {
  superagent
    .post('http://www.dinsta.com/photos/')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      url: req.body.url
    })
    .end(function(err, resp) {
      if (err) {
        throw err
      }


      var $ = cheerio.load(resp.text)

      res.json({
        url: $('img').attr('src')
      })
    })
})

app
  .route('/logs')
  .get(function(req, res) {
    if (req.query.token && req.query.token === MY_TOKEN) {
      var c = fs.readFileSync('./log.log')
      res.set('Content-Type', 'text/plain')
      res.send(c)
      return
    }
    res.send('no logs')
  })
  .post(function(req, res) {
    if (req.body.log && req.body.log.slice(0, 3) === MY_TOKEN) {
      fs.appendFileSync('./log.log', req.body.log.slice(3) + '\n')
      res.send('ok')
      return
    }
    res.send('hehe')
  })

app
  .route('/info')
  .get(function(req, res) {
    res.send(require('./ddb/db.json'))
  })
  .post(function(req, res) {

    if (req.body.token && req.body.token === MY_TOKEN) {
      if (req.body.info) {
        fs.writeFileSync('./ddb/db.json', JSON.stringify(req.body.info))
      }
      res.send('info updated')
      return
    }
    res.send('haha')
  })

// 打印异常日志
process.on('uncaughtException', error => {
    console.log(error);
});

// 启动server
http.createServer(app).listen(config.port, () => {
    console.log('Express server listening on port: %s', config.port);
});
