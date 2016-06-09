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
  this.soa = this.getSoaRecord();
  this.soaSerial = this.getSoaSerial();
  this.api = api; // API access
}

Zone.prototype.getSoaRecord = function () {
  if (!this.records) return null;
  const soa = this.records.filter(function(r){
    return r.type === "SOA";
  });
  if (soa.length >= 1) return soa[0];
  return null;
};

Zone.prototype.getSoaSerial = function () {
  if (!this.soa) return null;
  return this.soa.content.split(/ /)[2];
};

Zone.prototype.delete = function(callback) {
  this.api.deleteZone(this.url, callback);
};

Zone.prototype.deleteRecords = function(records, callback) {
  const records_arry = [].concat.apply([], [records]);
  records_arry.push(this.updateSoaSerialRecord());
  this.api.deleteRecords(this, records_arry, callback);
};

Zone.prototype.createOrModifyRecords = function(records, callback) {
  const records_arry = [].concat.apply([], [records]);
  records_arry.push(this.updateSoaSerialRecord());
  this.api.createOrModifyRecords(this, records_arry, callback);
};

Zone.prototype.updateSoaSerial = function() {
  const orgContentArray = this.soa.content.split(/ /);
  orgContentArray[2] = parseInt(this.soaSerial) + 1;
  return orgContentArray.join(" ");
};

Zone.prototype.updateSoaSerialRecord = function() {
  const record = {
    name: this.soa.name,
    ttl: this.soa.ttl,
    type: this.soa.type,
    disabled: this.soa.disabled,
    content: this.updateSoaSerial()
  };
  return record;
};

module.exports = Zone;
