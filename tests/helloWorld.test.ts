import * as mocha from 'mocha';
import * as chai from 'chai';
import chaiHttp = require('chai-http');

import { appExpress } from '../src/app';

chai.use(chaiHttp);
const expect = chai.expect;

describe('baseRoute', () => {

  it('should be json', () => {
    return chai.request(appExpress).get('/v0/orders')
    .then(res => {
      expect(res.status).to.eql(201);
    });
  });

});