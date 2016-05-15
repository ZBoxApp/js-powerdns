// Copyright (c) 2016 ZBox, Spa. All Rights Reserved.
// See LICENSE.txt for license information.
'use strict';

var superagent = require('superagent');
var LOG = console;

function CommunicationApi(constructorOptions) {
  this.url = constructorOptions.url;
  this.token = constructorOptions.token;
  this.timeout = constructorOptions.timeout || 5000;
}

CommunicationApi.prototype.deleteRequest = function (originalOptions, callback) {
  let uri = this.url + originalOptions.path;
  let req = superagent.del(uri)
              .accept('application/json')
              .set('X-API-Key', this.token);

  req.end(function(err, data){
      if (err) {
        err.reason = JSON.parse(err.response.error.text).error;
        return callback(err);
      }
      return callback(null, data.body);
    });
};

CommunicationApi.prototype.getRequest = function (originalOptions, callback) {
  let uri = this.url + originalOptions.path;
  let req = superagent.get(uri)
              .accept('application/json')
              .set('X-API-Key', this.token);

  req.end(function(err, data){
      if (err) {
        err.reason = JSON.parse(err.response.error.text).error;
        return callback(err);
      }
      return callback(null, data.body);
    });
};

CommunicationApi.prototype.patchRequest = function (originalOptions, callback) {
  let uri = this.url + originalOptions.path;
  let req = superagent.patch(uri)
              .accept('application/json')
              .set('X-API-Key', this.token)
              .send(JSON.stringify(originalOptions.data));

  req.end(function(err, data){
      if (err) {
        err.reason = JSON.parse(err.response.error.text).error;
        return callback(err);
      }
      return callback(null, data.body);
    });
};

CommunicationApi.prototype.postRequest = function (originalOptions, callback) {
  let uri = this.url + originalOptions.path;
  let req = superagent.post(uri)
              .accept('application/json')
              .set('X-API-Key', this.token)
              .send(JSON.stringify(originalOptions.data));

  req.end(function(err, data){
      if (err) {
        err.reason = JSON.parse(err.response.error.text).error;
        return callback(err);
      }
      return callback(null, data.body);
    });
};

module.exports = CommunicationApi;
