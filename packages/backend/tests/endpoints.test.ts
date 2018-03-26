import * as mocha from 'mocha';
import * as chai from 'chai';
import chaiHttp = require('chai-http');
import expressApp from '../src/index';
import { create } from 'domain';
import { error } from 'util';
import { client } from '../src/index';

before(async () => {
  return await client;
});

chai.use(chaiHttp);
const expect = chai.expect;
const hostport: string = 'http://localhost:3000';

describe('baseRoute', () => {

  it('should be json', () => {

    return chai.request(hostport).get('/v0/orders')
    .then(res => {
      expect(res.status).to.eql(201);
    });
  });

  it('should return 404 not found', () => {
    return chai.request(hostport).get('/v0/order/12345')
    .catch(err => {
      expect(err.status).to.eql(404);
    });
  });

});