'use strict';

var Communication = require('./api/communication');
var Zone = require('./api/zone');
var pjson = require('../package.json');


/**
 *
 * @param {AuthOptions} => url, token, timeout
 *
 */
function jsPowerdns (AuthOptions) {
  this.client = new Communication(AuthOptions);
}

jsPowerdns.prototype.getZones = function (callback) {
  const options = { path: '/servers/localhost/zones' };
  const that = this;
  return this.client.getRequest(options, function(err, data) {
    if (err) return callback(err);
    const results = [];
    data.forEach(function(z) {
      results.push(new Zone(z, that));
    });
    return callback(null, results);
  });
};

jsPowerdns.prototype.getZone = function (name, callback) {
  // The names must have and ending '.'
  name = name.match(/\.$/) ? name : name + '.';
  const path = '/servers/localhost/zones/' + name;
  const options = { path: path };
  const that = this;
  return this.client.getRequest(options, function(err, data) {
    if (err) return callback(err);
    if (data) {
      const zone = new Zone(data, that);
      return callback(null, zone);
    }
  });
};

// zone_object =
// {"name":"", "kind": "Master", "masters": [], "nameservers": ["ns1.example.org", "ns2.example.org"]}'
jsPowerdns.prototype.createZone = function (zone_object, callback) {
  const path = '/servers/localhost/zones';
  const data = zone_object;
  const options = { path: path, data: data };
  const that = this;
  return this.client.postRequest(options, function(err, data) {
    if (err) return callback(err);
    if (data) {
      const zone = new Zone(data, that);
      return callback(null, zone);
    }
  });
};

jsPowerdns.prototype.createZoneWithRecords = function (zone_object, records, callback) {
  const that = this;
  this.createZone(zone_object, function(err, data) {
    if (err) return callback(err);
    const zone = new Zone(data, that);
    const rrsets = that.rrSetsForZone(records, 'REPLACE');
    const options = { path: zone.url, data: { rrsets: rrsets } };
    that.client.patchRequest(options, function(err, data){
      if (err) return callback(err);
      return callback(null, data);
    });
  });
};

jsPowerdns.prototype.deleteZone = function(zone_url, callback) {
  const options = { path: zone_url };
  this.client.deleteRequest(options, function(err, data){
    if (err) return callback(err);
    return callback(null, data);
  });
};

jsPowerdns.prototype.deleteRecords = function(zone, records, callback) {
  const that = this;
  const updateSerialRecord = records.pop();
  const rrsets = this.rrSetsForZone(records, 'DELETE');
  rrsets.push(this.rrSetsForZone([updateSerialRecord], 'REPLACE')[0]);
  const options = { path: zone.url, data: { rrsets: rrsets } };
  this.client.patchRequest(options, function(err, data){
    if (err) return callback(err);
    const zone = new Zone(data, that);
    return callback(null, zone);
  });
};

jsPowerdns.prototype.createOrModifyRecords = function(zone, records, callback) {
  const that = this;
  const rrsets = this.rrSetsForZone(records, 'REPLACE');
  const options = { path: zone.url, data: { rrsets: rrsets } };
  this.client.patchRequest(options, function(err, data){
    if (err) return callback(err);
    const zone = new Zone(data, that);
    return callback(null, zone);
  });
};

// According to this: https://doc.powerdns.com/md/httpapi/api_spec/#zones
jsPowerdns.prototype.rrSetsForZone = function(records, changetype) {
  const rrsets = {};
  const results = [];
  const that = this;
  if (!Array.isArray(records)) return rrsets;
  records.forEach(function(r) {
    if (that.invalidRecord(r)) return;
    if (rrsets[r.name] && rrsets[r.name].type === r.type ) {
      rrsets[r.name].records.push(r);
    } else {
      const rrset = { name: r.name, type: r.type, changetype: changetype, records: [ r ] };
      rrsets[r.name] = rrset;
    }
  });
  const keys = Object.keys(rrsets);

  keys.forEach(function(key) {
    results.push(rrsets[key]);
  });
  
  return results;
};

jsPowerdns.prototype.invalidRecord = function(record) {
  const r = record;
  if (r.name && r.content && r.type && r.ttl && (r.disabled !== undefined) && r.ttl && r.type){
    return false;
  } else {
    return true;
  }
};

jsPowerdns.prototype.version = function() {
  return jsPowerdns.version();
};


// Return the library version
jsPowerdns.version = function() {
  return pjson.version;
};

module.exports = jsPowerdns;
