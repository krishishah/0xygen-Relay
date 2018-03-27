import * as mocha from 'mocha';
import * as chai from 'chai';
import { create } from 'domain';
import { error } from 'util';
import { EventPubSub } from '../src/services/eventPubSub';

const expect = chai.expect;

let eventPubSub: EventPubSub;

before(() => {
    eventPubSub = new EventPubSub();
});

describe('EventPubSub', () => {

  it('should publish events to subscribers', () => {
    let x = 0;
    eventPubSub.subscribe('hello world', () => x++ );
    eventPubSub.publish('hello world');
    expect(x).to.eql(1);
  });

  it('subscriber handlers should be called for each publish', () => {
    let x = 0;
    eventPubSub.subscribe('hello world', () => x++ );
    eventPubSub.publish('hello world');
    eventPubSub.publish('hello world');
    expect(x).to.eql(2);
  });

  it('every subscriber handler should be called for each publish', () => {
    let x = 0;
    eventPubSub.subscribe('hello world', () => x++ );
    eventPubSub.subscribe('hello world', () => x++ );
    eventPubSub.publish('hello world');
    eventPubSub.publish('hello world');
    expect(x).to.eql(4);
  });

  it('All EventPubSub instances should share events, pubs and subs', () => {
    let x = 0;
    let eventPubSub2 = new EventPubSub();
    eventPubSub2.subscribe('hello world', () => x++ );
    eventPubSub2.subscribe('hello world', () => x++ );
    eventPubSub.publish('hello world');
    eventPubSub.publish('hello world');
    expect(x).to.eql(4);
  });

});