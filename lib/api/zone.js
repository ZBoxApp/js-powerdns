'use strict';

var LOG = console;

function Zone (constructorOptions, api) {
  this.url = constructorOptions.url;
  this.id = constructorOptions.id;
  this.name = constructorOptions.id;
  this.dnssec = constructorOptions.dnssec;
  this.account = constructorOptions.account;
  this.masters = constructorOptions.masters;
  this.serial = constructorOptions.serial;
  this.notified_serial = constructorOptions.notified_serial;
  this.last_check = constructorOptions.last_check;
  this.records = constructorOptions.records;
  this.api = api; // API access
}

Zone.prototype.delete = function(callback) {
  this.api.deleteZone(this.url, callback);
};

Zone.prototype.deleteRecords = function(records, callback) {
  const records_arry = [].concat.apply([], [records]);
  this.api.deleteRecords(this.url, records_arry, callback);
};

Zone.prototype.createOrModifyRecords = function(records, callback) {
  const records_arry = [].concat.apply([], [records]);
  this.api.createOrModifyRecords(this.url, records_arry, callback);
};

module.exports = Zone;
