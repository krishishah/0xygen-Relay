import { Router, Request, Response, NextFunction } from 'express';
import { BigNumber } from '@0xproject/utils/lib/configured_bignumber';
import { Service, Container } from 'typedi';
import { PaymentNetworkService } from '../services/paymentNetworkService';
import { SignedOrder } from '0x.js';
import { SerializerUtils } from '../utils/serialization';
import { OffChainSignedOrderSchema, OffChainSignedOrder, SetBalancesSchema, TokenBalances } from '../types/schemas';
import { ZeroEx } from '0x.js/lib/src/0x';
import { WebSocketHandler } from './webSocket';

@Service()
export class RestApiRoutes {

    router: Router;

    /**
     * Initialize the RestApiRouter
     */
    constructor(private service: PaymentNetworkService) {
        this.router = Router();
        this.init();
    }

    /**
     * GET token balances.
     */
    public getTokenBalances(req: Request, res: Response, next: NextFunction) {
        const address: string = req.params.address;
        this.service
            .getUserTokenBalances(address)
            .then((tokenBalances: TokenBalances) => {
                res.status(201).json(SerializerUtils.TokenBalancesToJson(address, tokenBalances));
            }
        );
    }

    /**
     * POST token balances.
     * For testing only.
     */
    public setTokenBalances(req: Request, res: Response, next: NextFunction) {
        const { body } = req;
        const setBalancesSchema = body as SetBalancesSchema;
        const tokenBalances = SerializerUtils.StringTokenBalancesToBigNumber(setBalancesSchema.balances);
        this.service
            .setUserTokenBalances(setBalancesSchema.userAddress, tokenBalances)
            .then(v => {
                res.statusMessage = 'Success';
                res.status(201).send({});
            }
        );
    }

    /**
     * POST Fill a single order given a taker fill amount
     */
    public fillOrder(req: Request, res: Response, next: NextFunction) {
        const { body } = req;
        const signedOrderSchema = body as OffChainSignedOrderSchema;
        const signedOrder = SerializerUtils.SignedOrderfromJSON(signedOrderSchema);
    }

    /**
     * POST batch fill trades up to the taker amount.
     */
    public batchFillOrderUpTo(req: Request, res: Response, next: NextFunction) {
        const { body } = req;
        const signedOrderSchemas = body as OffChainSignedOrderSchema[];
        const signedOrders: OffChainSignedOrder[] = signedOrderSchemas.map(
            (order: OffChainSignedOrderSchema) => {
                return SerializerUtils.SignedOrderfromJSON(order);
            }
        );
    }

    /**
     * POST Cancel a single order given a maker cancel amount
     */
    public cancelOrder(req: Request, res: Response, next: NextFunction) {
        const { body } = req;
        const signedOrderSchema = body as OffChainSignedOrderSchema;
        const signedOrder = SerializerUtils.SignedOrderfromJSON(signedOrderSchema);
    }

    /**
     * GET Order status
     */
    public getOrderStatus(req: Request, res: Response, next: NextFunction) {
        const { body } = req;
        const signedOrderSchema = body as OffChainSignedOrderSchema;
        const signedOrder = SerializerUtils.SignedOrderfromJSON(signedOrderSchema);
    }

    /**
     * Take each handler, and attach to one of the Express.Router's
     * endpoints.
     */
    private init() {
        this.router.get('/balances/:address', this.getTokenBalances.bind(this));
        this.router.post('/balances', this.setTokenBalances.bind(this));
        this.router.get('/exchange/order/status/:orderHash', this.getOrderStatus.bind(this));
        this.router.post('/exchange/order/fill', this.fillOrder.bind(this));
        this.router.post('/exchange/order/batch_fill_up_to', this.batchFillOrderUpTo.bind(this));
        this.router.post('/exchange/order/cancel', this.cancelOrder.bind(this));
    }
    
}