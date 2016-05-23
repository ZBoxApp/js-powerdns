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
  const uri = this.url + originalOptions.path;
  const req = superagent.del(uri)
              .accept('application/json')
              .set('X-API-Key', this.token);

  const that = this;
  req.end(function(err, data) {
    return that.parseResponse(callback, err, data);
  });
};

CommunicationApi.prototype.getRequest = function (originalOptions, callback) {
  const uri = this.url + originalOptions.path;
  const req = superagent.get(uri)
              .accept('application/json')
              .set('X-API-Key', this.token);

  const that = this;
  req.end(function(err, data) {
    return that.parseResponse(callback, err, data);
  });
};

CommunicationApi.prototype.patchRequest = function (originalOptions, callback) {
  const uri = this.url + originalOptions.path;
  const req = superagent.patch(uri)
              .accept('application/json')
              .set('X-API-Key', this.token)
              .send(JSON.stringify(originalOptions.data));

  const that = this;
  req.end(function(err, data) {
    return that.parseResponse(callback, err, data);
  });
};

CommunicationApi.prototype.parseResponse = function(callback, err, data){
  if (err) {
    const error = {};
    error.status = data.status;
    error.path = data.error.path;
    error.reason = JSON.parse(data.text).error;
    return callback(error);
  }
  return callback(null, data.body);
};

CommunicationApi.prototype.postRequest = function (originalOptions, callback) {
  const uri = this.url + originalOptions.path;
  const req = superagent.post(uri)
              .accept('application/json')
              .set('X-API-Key', this.token)
              .send(JSON.stringify(originalOptions.data));

  const that = this;
  req.end(function(err, data) {
    return that.parseResponse(callback, err, data);
  });
};

module.exports = CommunicationApi;
