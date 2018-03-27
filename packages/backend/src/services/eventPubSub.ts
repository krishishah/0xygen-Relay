import { Service } from 'typedi';
import * as PubSub from 'event-pubsub/es6';
import { isNullOrUndefined } from 'util';

@Service()
export class EventPubSub {

    private static eventPubSub: PubSub;

    constructor() { 
        if (isNullOrUndefined(EventPubSub.eventPubSub)) {
            EventPubSub.eventPubSub = new PubSub();
        }
    }

    // tslint:disable-next-line:no-any
    public publish(event: String, ...args: any[]) {
        EventPubSub.eventPubSub.publish(event, ...args);
    }

    // tslint:disable-next-line:typedef
    public subscribe(event: String, handler) {
        EventPubSub.eventPubSub.subscribe(event, handler);
    }

    // tslint:disable-next-line:typedef
    public unSubscribe(event: String, handler) {
        EventPubSub.eventPubSub.unSubscribe(event, handler);
    }

}