"use strict";

var requireHelper = require('./require_helper'),
    jsPowerdns = requireHelper('index.js'),
    expect = require('chai').expect,
    superagent = require('superagent');

(function() {


  describe('Client Api', function() {

   it('should return error if wrong token', function(done){
     let api = new jsPowerdns({ url: 'http://127.0.0.1:8081', token: 'bad' });
     api.client.getRequest({path: '/servers/localhost/zones'}, function(err, data){
       expect(err.status).to.be.equal(401);
       expect(err.reason).to.be.equal('Unauthorized');
       done();
     });
   });
  });

  describe('Getting zones', function() {

    it('should get the zones', function(done){
      let api = new jsPowerdns({ url: 'http://127.0.0.1:8081', token: 'otto' });
      api.getZones(function(err,data){
        if (err) return console.error(err);
        expect(data[0].constructor.name).to.be.equal('Zone')
        done();
      });
    });

    it('should get the zone', function(done){
      let api = new jsPowerdns({ url: 'http://127.0.0.1:8081', token: 'otto' });
      const zone_name = 'example.org.';
      api.getZone(zone_name, function(err,data){
        if (err) return console.error(err);
        expect(data.constructor.name).to.be.equal('Zone')
        expect(data.name).to.be.equal(zone_name)
        done();
      });
    });

    it('should return error if the zone does not exists', function(done){
      let api = new jsPowerdns({ url: 'http://127.0.0.1:8081', token: 'otto' });
      const zone_name = 'god.org.';
      api.getZone(zone_name, function(err,data){
        expect(err.status).to.be.equal(422);
        expect(err.path).to.be.equal('/servers/localhost/zones/god.org.');
        expect(err.reason).to.be.equal('Could not find domain \'god.org\'');
        done();
      });
    });
  });

  describe('Creating Zones', function() {

    it('should create the Zone', function(done){
      let api = new jsPowerdns({ url: 'http://127.0.0.1:8081', token: 'otto' });
      const zone_name = Date.now() + '.com.';
      const zone_data = { name: zone_name, kind: 'Master', nameservers: [] }
      api.createZone(zone_data, function(err,data){
        if (err) return console.error(err);
        api.getZone(zone_name, function(err, data){
          if (err) return console.error(err);
          expect(data.name).to.be.equal(zone_name);
          done();
        });
      });
    });

    it('should return error without Nameservers', function(done){
      let api = new jsPowerdns({ url: 'http://127.0.0.1:8081', token: 'otto' });
      const zone_name = Date.now() + '.com.';
      const zone_data = { name: zone_name, kind: 'Master' }
      api.createZone(zone_data, function(err,data){
        expect(err.status).to.be.equal(422);
        expect(err.reason).to.be.equal('Nameservers list must be given (but can be empty if NS records are supplied)');
        done();
      });
    });

    it('should create the Zone with Records', function(done){
      let api = new jsPowerdns({ url: 'http://127.0.0.1:8081', token: 'otto' });
      const zone_name = Date.now() + '.com.';
      const record_name = `test.${zone_name.replace(/\.$/, '')}`;
      const record_name2 = `test2.${zone_name.replace(/\.$/, '')}`;
      const records = [ {"content": "192.0.5.4", "disabled": false, "name": record_name, "ttl": 86400, "type": "A" } ];
      records.push({ "content": "192.0.5.5", "disabled": false, "name": record_name2, "ttl": 86400, "type": "A" });
      const zone_data = { name: zone_name, kind: 'Master', nameservers: []};
      api.createZoneWithRecords(zone_data, records, function(err,data){
        if (err) return console.error(err);
        expect(data.records[1].name).to.be.equal(record_name);
        expect(data.records[2].content).to.be.equal('192.0.5.5');
        done();
      });
    });

    it('should delete the Zone', function(done){
      let api = new jsPowerdns({ url: 'http://127.0.0.1:8081', token: 'otto' });
      const zone_name = Date.now() + '.com.';
      const zone_data = { name: zone_name, kind: 'Master', nameservers: [] }
      api.createZone(zone_data, function(err,data){
        if (err) return console.error(err);
        const zone = data;
        api.deleteZone(zone.url, function(err,data){
          expect(JSON.stringify(data)).to.be.equal('{}');
          done();
        });
      });
    });


  });

  describe('Temp Record', function() {
    var tmp_zone = null;

    beforeEach(function(done) {
      let api = new jsPowerdns({ url: 'http://127.0.0.1:8081', token: 'otto' });
      const zone_name = 'tempdomain.com.';
      const record_name = `test.${zone_name.replace(/\.$/, '')}`;
      const record_name2 = `test2.${zone_name.replace(/\.$/, '')}`;
      const records = [ {"content": "192.0.5.4", "disabled": false, "name": record_name, "ttl": 86400, "type": "A" } ];
      records.push({ "content": "192.0.5.5", "disabled": false, "name": record_name2, "ttl": 86400, "type": "A" });
      const zone_data = { name: zone_name, kind: 'Master', nameservers: []};
      api.createZoneWithRecords(zone_data, records, done);
    });

    afterEach(function(done) {
      let api = new jsPowerdns({ url: 'http://127.0.0.1:8081', token: 'otto' });
      const zone_name = 'tempdomain.com.';
      api.deleteZone('/servers/localhost/zones/' + zone_name, done);
    });

    describe('Managing Zone', function() {

      it('Should delete record from Zone', function(done){
        let api = new jsPowerdns({ url: 'http://127.0.0.1:8081', token: 'otto' });
        api.getZone('tempdomain.com.', function(err, tmp_zone){
          const org_records_size = tmp_zone.records.length;
          const record = tmp_zone.records[1];
          tmp_zone.deleteRecords(record, function(err, zone){
            if (err) return console.error(err);
            expect(zone.records.length).to.be.below(org_records_size);
            done();
          });
        });
      });

      it('Should modify record from Zone', function(done){
        let api = new jsPowerdns({ url: 'http://127.0.0.1:8081', token: 'otto' });
        api.getZone('tempdomain.com.', function(err, tmp_zone){
          const last_record = tmp_zone.records[2];
          last_record.content = '1.1.1.1';
          tmp_zone.createOrModifyRecords(last_record, function(err, zone){
            if (err) return console.error(err);
            expect(zone.records.length).to.be.equal(3);
            expect(zone.records[2].content).to.be.equal('1.1.1.1');
            done();
          });
        });
      });

      it('Should return error if wrong data', function(done){
        let api = new jsPowerdns({ url: 'http://127.0.0.1:8081', token: 'otto' });
        api.getZone('tempdomain.com.', function(err, tmp_zone){
          const last_record = tmp_zone.records[2];
          last_record.content = 'pdmdod';
          tmp_zone.createOrModifyRecords(last_record, function(err, zone){
            expect(err.status).to.be.above(400);
            expect(err.reason).to.match(/Parsing/);
            done();
          });
        });
      });

      it('Should add new Record to Zone', function(done){
        let api = new jsPowerdns({ url: 'http://127.0.0.1:8081', token: 'otto' });
        const new_record = {"content": "192.0.5.44", "disabled": false, "name": 'temp3.tempdomain.com', "ttl": 86400, "type": "A" };
        api.getZone('tempdomain.com.', function(err, tmp_zone){
          const org_records_size = tmp_zone.records.length;
          tmp_zone.createOrModifyRecords(new_record, function(err, zone){
            if (err) return console.error(err);
            expect(zone.records.length).to.be.above(org_records_size);
            done();
          });
        });
      });

    });

  });

})();
