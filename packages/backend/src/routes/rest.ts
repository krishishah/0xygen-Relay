import { Router, Request, Response, NextFunction } from 'express';
import { BigNumber } from '@0xproject/utils/lib/configured_bignumber';
import { Service, Container } from 'typedi';
import { RestService } from '../services/restService';
import { SignedOrder } from '0x.js';
import { SerializerUtils } from '../utils/serialization';
import { SignedOrderSchema } from '../types/schemas';

@Service()
export class V0RestApiRouter {
    
    router: Router;

    /**
     * Initialize the RestApiRouter
     */
    constructor(private restService: RestService) {
        this.router = Router();
        this.init();
    }

    /**
     * GET token pairs.
     */
    public getTokenPairs(req: Request, res: Response, next: NextFunction) {
        res.statusMessage = 'Success';
        res.statusCode = 201;
        res.send();
    }

    /**
     * GET orderbook.
     */
    public getOrderBook(req: Request, res: Response, next: NextFunction) {
        const baseTokenAddress: string = req.query.baseTokenAddress;
        const quoteTokenAddress: string = req.query.quoteTokenAddress;
        this.restService.getOrderBook(baseTokenAddress, quoteTokenAddress)
        .then(orderBook => {
        res.setHeader('Content-Type', 'application/json');
        res.json(SerializerUtils.TokenPairOrderbooktoJSON(orderBook));
        res.send();
        })
        .catch(error => {
        // TODO: Sort out error handling
        res.statusMessage = error.statusMessage;
        res.statusCode = 404;
        res.send();
        });
    }

    /**
     * GET orders.
     */
    public getOrders(req: Request, res: Response, next: NextFunction) {
        res.statusMessage = 'Success';
        res.statusCode = 201;
        res.send();
    }

    /**
     * GET order.
     */
    public getOrder(req: Request, res: Response, next: NextFunction) {
        const orderHashHex: string = req.params.orderHash;
        this.restService.getOrder(orderHashHex)
        .then(order => {
        res.setHeader('Content-Type', 'application/json');
        res.json(SerializerUtils.SignedOrdertoJSON(order));
        res.send();
        })
        .catch(error => {
        res.statusMessage = error.statusMessage;
        res.statusCode = 404;
        res.send();
        });
    }

    /**
     * GET fees.
     */
    public getFees(req: Request, res: Response, next: NextFunction) {
        res.statusMessage = 'Success';
        res.statusCode = 201;
        res.send();
    }

    /**
     * POST order.
     */
    public postOrder(req: Request, res: Response, next: NextFunction) {
        const { body } = req;
        const signedOrderSchema = body as SignedOrderSchema;
        const signedOrder = SerializerUtils.SignedOrderfromJSON(signedOrderSchema);
        this.restService.postOrder(signedOrder);
        res.statusMessage = 'Success';
        res.statusCode = 201;
        res.send();
    }

    /**
     * Take each handler, and attach to one of the Express.Router's
     * endpoints.
     */
    private init() {
        this.router.get('/token_pairs', this.getTokenPairs.bind(this));
        this.router.get('/orderbook', this.getOrderBook.bind(this));
        this.router.get('/orders', this.getOrders.bind(this));
        this.router.get('/order/:orderHash', this.getOrder.bind(this));
        this.router.get('/fees', this.getFees.bind(this));
        this.router.post('/order', this.postOrder.bind(this));
    }

}