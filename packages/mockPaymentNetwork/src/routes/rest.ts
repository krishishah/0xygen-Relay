import { Router, Request, Response, NextFunction } from 'express';
import { BigNumber } from '@0xproject/utils/lib/configured_bignumber';
import { Service, Container } from 'typedi';
import { PaymentNetworkService } from '../services/paymentNetworkService';
import { SignedOrder } from '0x.js';
import { SerializerUtils } from '../utils/serialization';
import { 
    OffChainSignedOrderSchema, 
    OffChainSignedOrder, 
    SetBalancesSchema, 
    TokenBalances, 
    OffChainFillOrderRequestSchema, 
    OffChainSignedOrderStatus, 
    OffChainBatchFillOrderRequestSchema,
    OrderFilledQuantities
} from '../types/schemas';
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
            })
            .catch(e => {
                res.statusMessage = e.statusMessage;
                res.status(404).send({});
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
            })
            .catch(e => {
                res.statusMessage = e.statusMessage;
                res.status(500).send({});
            }
        );
    }

    /**
     * POST Fill a single order given a taker fill amount
     */
    public fillOrder(req: Request, res: Response, next: NextFunction) {
        const { body } = req;
        const schema = body as OffChainFillOrderRequestSchema;
        const fillOrderRequest = SerializerUtils.FillOrderRequestFromJSON(schema);
        this.service
            .fillOrderOrThrow(fillOrderRequest)
            .then(() => {
                res.statusMessage = 'Success';
                res.status(201).send({});
            })
            .catch(e => {
                res.statusMessage = e.statusMessage;
                res.status(500).send({});
            }
        );
    }

    /**
     * POST batch fill trades up to the taker amount.
     */
    public batchFillOrderUpTo(req: Request, res: Response, next: NextFunction) {
        const { body } = req;
        const schema = body as OffChainBatchFillOrderRequestSchema;
        const batchFillOrderReq = SerializerUtils.OffChainBatchFillOrderRequestFromJSON(schema);
        console.log('received batch fill request: ', schema);
        this.service
            .batchFillUpTo(batchFillOrderReq)
            .then((quantities: OrderFilledQuantities) => {
                const response = SerializerUtils.OrderFilledQuantitiesToJSON(quantities);
                res.status(201).send(response);
            })
            .catch(e => {
                res.statusMessage = e.statusMessage;
                res.status(500).send({});
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
     * POST Order status
     */
    public getOrderStatus(req: Request, res: Response, next: NextFunction) {
        const { body } = req;
        const signedOrderSchema = body as OffChainSignedOrderSchema;
        console.log(signedOrderSchema);
        const signedOrder = SerializerUtils.SignedOrderfromJSON(signedOrderSchema);
        this.service
            .getOrderStatus(signedOrder)
            .then((status: OffChainSignedOrderStatus) => {
                const schema = SerializerUtils.OrderStatusToJSON(status);
                res.status(201).send(schema);
            })
            .catch(e => {
                res.statusMessage = e.statusMessage;
                res.status(501).send({});
            }
        );
    }

    /**
     * Take each handler, and attach to one of the Express.Router's
     * endpoints.
     */
    private init() {
        this.router.get('/balances/:address', this.getTokenBalances.bind(this));
        this.router.post('/balances', this.setTokenBalances.bind(this));
        this.router.post('/exchange/order/status', this.getOrderStatus.bind(this));
        this.router.post('/exchange/order/fill', this.fillOrder.bind(this));
        this.router.post('/exchange/order/batch_fill_up_to', this.batchFillOrderUpTo.bind(this));
        this.router.post('/exchange/order/cancel', this.cancelOrder.bind(this));
    }
    
}