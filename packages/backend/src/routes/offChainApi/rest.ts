import { Router, Request, Response, NextFunction } from 'express';
import { BigNumber } from '@0xproject/utils/lib/configured_bignumber';
import { Service, Container } from 'typedi';
import { OffChainOrderService } from '../../services/offChainOrderService';
import { SignedOrder } from '0x.js';
import { SerializerUtils } from '../../utils/serialization';
import { SignedOrderSchema } from '../../types/schemas';
import { ZeroEx } from '0x.js/lib/src/0x';

@Service()
export class OffChainPaymentNetworkRestRoutes {

    router: Router;

    /**
     * Initialize the RestApiRouter
     */
    constructor(private orderService: OffChainOrderService) {
        this.router = Router();
        this.init();
    }

    /**
     * GET orderbook.
     */
    public getOrderbook(req: Request, res: Response, next: NextFunction) {
        const baseTokenAddress: string = req.query.baseTokenAddress;
        const quoteTokenAddress: string = req.query.quoteTokenAddress;
        this.orderService.getOrderbook(baseTokenAddress, quoteTokenAddress)
            .then(orderBook => {
                res.status(201).json(SerializerUtils.OffChainTokenPairOrderbooktoJSON(orderBook));
            })
            .catch(error => {
                // TODO: Sort out error handling
                res.status(404).send({
                    error: error.statusMessage
                });
            }
        );
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
        this.orderService
            .getOrder(orderHashHex)
            .then(order => {
                    res.status(201).json(SerializerUtils.OffChainSignedOrdertoJSON(order));
                }
            )
            .catch(error => {
                    res.status(404).send({
                        error: error.statusMessage
                    });
                }
            );
    }

    /**
     * POST order.
     */
    public postOrder(req: Request, res: Response, next: NextFunction) {
        const { body } = req;
        const signedOrderSchema = body as SignedOrderSchema;
        const signedOrder = SerializerUtils.SignedOrderfromJSON(signedOrderSchema);
        this.orderService
            .postOrder(signedOrder)
            .then((value: void) => {
                res.statusMessage = 'Success';
                res.status(201).send({});
            })
            .catch(e => {
                res.statusMessage = `Invalid Order Error: ${e.message}`;
                res.status(101).send({});
            }
        );

    }

    /**
     * Take each handler, and attach to one of the Express.Router's
     * endpoints.
     */
    private init() {
        this.router.get('/orderbook', this.getOrderbook.bind(this));
        this.router.get('/orders', this.getOrders.bind(this));
        this.router.get('/order/:orderHash', this.getOrder.bind(this));
        this.router.post('/order', this.postOrder.bind(this));
    }
    
}