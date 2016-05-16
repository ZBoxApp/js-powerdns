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
  let options = { path: '/servers/localhost/zones' };
  return this.client.getRequest(options, (err, data) => {
    if (err) return callback(err);
    let results = [];
    data.forEach((z) => {
      results.push(new Zone(z, this));
    });
    return callback(null, results);
  });
};

jsPowerdns.prototype.getZone = function (name, callback) {
  // The names must have and ending '.'
  name = name.match(/\.$/) ? name : name + '.';
  const path = `/servers/localhost/zones/${name}`;
  const options = { path: path };
  return this.client.getRequest(options, (err, data) => {
    if (err) return callback(err);
    if (data) {
      const zone = new Zone(data, this);
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
  return this.client.postRequest(options, (err, data) => {
    if (err) return callback(err);
    if (data) {
      const zone = new Zone(data, this);
      return callback(null, zone);
    }
  });
};

jsPowerdns.prototype.createZoneWithRecords = function (zone_object, records, callback) {
  this.createZone(zone_object, (err, data) => {
    if (err) return callback(err);
    const zone = new Zone(data, this);
    const rrsets = this.rrSetsForZone(records, 'REPLACE');
    const options = { path: zone.url, data: { rrsets: rrsets } };
    this.client.patchRequest(options, function(err, data){
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

jsPowerdns.prototype.deleteRecords = function(zone_url, records, callback) {
  const rrsets = this.rrSetsForZone(records, 'DELETE');
  const options = { path: zone_url, data: { rrsets: rrsets } };
  this.client.patchRequest(options, function(err, data){
    if (err) return callback(err);
    return callback(null, data);
  });
};

jsPowerdns.prototype.createOrModifyRecords = function(zone_url, records, callback) {
  const rrsets = this.rrSetsForZone(records, 'REPLACE');
  const options = { path: zone_url, data: { rrsets: rrsets } };
  this.client.patchRequest(options, function(err, data){
    if (err) return callback(err);
    return callback(null, data);
  });
};

// According to this: https://doc.powerdns.com/md/httpapi/api_spec/#zones
jsPowerdns.prototype.rrSetsForZone = function(records, changetype) {
  const rrsets = [];
  if (!Array.isArray(records)) return rrsets;
  records.forEach((r) => {
    rrsets.push({
      name: r.name,
      type: r.type,
      changetype: changetype, // Because is a new Zone
      records: [ r ]
    });
  });
  return rrsets;
};

jsPowerdns.prototype.version = function() {
  return jsPowerdns.version();
};


// Return the library version
jsPowerdns.version = function() {
  return pjson.version;
};

module.exports = jsPowerdns;
