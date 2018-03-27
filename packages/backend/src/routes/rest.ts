import { Router, Request, Response, NextFunction } from 'express';
import { BigNumber } from '@0xproject/utils/lib/configured_bignumber';
import { Service, Container } from 'typedi';
import { RestService } from '../services/restService';
import { SignedOrder } from '0x.js';
import { SerializerUtils } from '../utils/serialization';
import { SignedOrderSchema } from '../types/schemas';
import { ZeroEx } from '0x.js/lib/src/0x';

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
        res.status(201).send({});

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
                res.status(404).send({
                    error: error.statusMessage
                });
            });
    }

    /**
     * GET orders.
     */
    public getOrders(req: Request, res: Response, next: NextFunction) {
        res.statusMessage = 'Success';
        res.status(201).send({});
    }

    /**
     * GET order.
     */
    public getOrder(req: Request, res: Response, next: NextFunction) {
        const orderHashHex: string = req.params.orderHash;
        this.restService
            .getOrder(orderHashHex)
            .then(
            order => {
                res.setHeader('Content-Type', 'application/json');
                res.json(SerializerUtils.SignedOrdertoJSON(order));
                res.status(201).send();
            })
            .catch(
            error => {
                res.status(404).send({
                    error: error.statusMessage
                });
            });
    }

    /**
     * POST fees.
     */
    public postFees(req: Request, res: Response, next: NextFunction) {
        const makerFee = new BigNumber(0).toString();
        const takerFee = ZeroEx.toBaseUnitAmount(new BigNumber(10), 18).toString();
        res.status(201).send({
            feeRecipient: ZeroEx.NULL_ADDRESS,
            makerFee,
            takerFee,
        });
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
        res.status(201).send({});
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
        this.router.post('/fees', this.postFees.bind(this));
        this.router.post('/order', this.postOrder.bind(this));
    }
    
}