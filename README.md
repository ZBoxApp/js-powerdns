# PowerDNS API Javascript Wrapper

This is a Wrapper for the [PowerDNS REST API](https://doc.powerdns.com/3/httpapi/api_spec/).

### Important NGINX
Given a [Bug](https://github.com/PowerDNS/pdns/issues/3723) on PowerDNS, we are using NGINX
to proxy the request to PowerDNS.

Following is an example configuration for NGINX:

```
upstream pdns {
   server localhost:8091;
}

server {
  listen  8081;
  server_name pdns;

  location / {
    proxy_set_header Host $http_host;
    proxy_pass http://pdns/;
    proxy_buffering off;
    proxy_read_timeout 300s;
    gzip off;
  }

  client_max_body_size 4G;
  keepalive_timeout 10;
}
```

## Table of Contents
- [SOA Serial Update](#soa-serial-update)
- [Example](#example)
- [Install](#install)
- [Callback](#callback)
- [Errors](#errors)
- [Common Functions](#common-functions)


## SOA Serial Update
The PowerDNS API can update the serial number for you automatically, but for this you
**must** create the zone whit the options `soa_edit_api: 'DEFAULT'`, like:

```javascript
const jsPowerdns = require('js-powerdns');
const api = new jsPowerdns({ url: 'http://127.0.0.1:8081', token: 'otto' });
const zone_name = 'tempdomain.com.';
const soa = {
  "name": "tempdomain.com",
  "type": "SOA",
  "content": "ns1.tempdomain.com root.tempdomain.com 0 10800 3600 604800 3600",
  "disabled": false,
  "ttl": 86400,
  "priority": 0
};
const records = [ soa ];
const zone_data = {
  'name': zone_name,
  'soa_edit': 'DEFAULT', 'soa_edit_api': 'DEFAULT', // <== THIS IS THE SAUCE
  'kind': 'Master', nameservers: ['ns1.tempdomain.com'],
  'masters': []
};
api.createZoneWithRecords(zone_data, records, callback);
```

## Example

First, instantiate the wrapper.
```javascript
const jsPowerdns = require('js-powerdns');
const api = new jsPowerdns({ url: 'http://127.0.0.1:8081', token: 'otto' });

var callback = function(err, data) {
  if (err) return console.log(err);
  console.log(data);
};

// Get all the Zones
api.getZones(callback);
// [Zone, Zone, Zone]

jsPowerdns.version();
// "0.0.1"
```

## Install
node:

```
$ npm install js-powerdns
```

webpack:

```
TODO
```

## Callback
You have to pass a `callback` to all the functions, that receives to params:

1. `error`, if any
2. `data`, if any

For this documentations `callback` will always be:

```javascript
function(err, data) {
  if (err) return console.log(err);
  console.log(data);
};
```

## Errors

If an error happens, the library return an Object:

```javascript
Error {
  status: 401 // HTTP result Code,
  reason: 'Unauthorized' // Text error description
}
```

## Common Functions
### Get all Zones

```javascript
api.getZones(callback);
// [Zone, Zone...]
```

### Get a Zone

**Important**: you have to use the zone name with a `.` at the end of it. For example if the zone name is `example.com`, you **must** use `example.com.`.

```javascript
api.getZone("example.com.", callback);
// Zone {
//  url: '/servers/localhost/zones/example.com.',
//  id: 'example.com.',
//  name: 'example.com.',
//  dnssec: false,
//  account: '',
//  masters: [],
//  records: undefined,
// }
```

### Create a Zone

```javascript
const zone_object = { name: 'example.org', kind: 'Master', nameservers: [] };
api.createZone(zone_object, callback);
// Zone {}
```

### Create a Zone with Records

```javascript
// New Zone object
const zone_object = { name: 'example.org', kind: 'Master', nameservers: [] };

// New Records objects
const records = [];
const record1 = { "name": "record1.example.org", "content": "192.0.5.1",
                 "disabled": false, "ttl": 86400, "type": "A"
               };
const record2 = { "name": "record2.example.org", "content": "192.0.5.1",
                "disabled": false, "ttl": 86400, "type": "A"
              };
records.push(record1);
records.push(record2);

api.createZoneWithRecords(zone_data, records, callback);
// Zone {}
```

### Delete Zone

```javascript
api.deleteZone("example.com.", callback);
// {}
```

### Delete Records

You need to use an object with `name` and `content` attributes to reference the Record.

```javascript
// Record to delete
const record = { "name": "record1.example.org", "content": "192.0.5.1" }

// deleteRecords(zone_url, records_to_be_deleted, callback)
api.deleteRecords('/servers/localhost/zones/example.org.', record, callback)

// Zone {} with records deleted
```

If you have a `Zone` object you can use:

```javascript
// Record to delete
const record = { "name": "record1.example.org", "content": "192.0.5.1" }

// zone is a Zone {}
zone.deleteRecords(record, callback);
```

### Create or Modify Records

The function `createOrModifyRecords` update the Record information if there is a match for the `content` and `name` of the record object.

If no match, a new Record is created.

```javascript
// Record to add
const record = { "name": "record1.example.org", "content": "192.0.5.1" }

// Add new Record
zone.createOrModifyRecords(record, callback);

record.content = '1.1.1.2';

// Modify Record
zone.createOrModifyRecords(record, callback);
```
