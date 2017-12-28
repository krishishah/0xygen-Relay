import {Router, Request, Response, NextFunction} from 'express';

export class V0RestApiRouter {
  router: Router

  /**
   * Initialize the HeroRouter
   */
  constructor() {
    this.router = Router();
    this.init();
  }

  /**
   * GET token pairs.
   */
  public getTokenPairs(req: Request, res: Response, next: NextFunction) {
    res.statusMessage = "Success";
    res.statusCode = 201;
  }

  /**
   * GET orderbook.
   */
  public getOrderBook(req: Request, res: Response, next: NextFunction) {
    res.statusMessage = "Success";
    res.statusCode = 201;
  }

  /**
   * GET orders.
   */
  public getOrders(req: Request, res: Response, next: NextFunction) {
    res.statusMessage = "Success";
    res.statusCode = 201;
  }

  /**
   * GET order.
   */
  public getOrder(req: Request, res: Response, next: NextFunction) {
    res.statusMessage = "Success";
    res.statusCode = 201;
  }

  /**
   * GET fees.
   */
  public getFees(req: Request, res: Response, next: NextFunction) {
    res.statusMessage = "Success";
    res.statusCode = 201;
  }

  /**
   * POST order.
   */
  public postOrder(req: Request, res: Response, next: NextFunction) {
    res.statusMessage = "Success";
    res.statusCode = 201;
  }

  /**
   * GET tokens.
   */
  public getTokens(req: Request, res: Response, next: NextFunction) {
    res.statusMessage = "Success";
    res.statusCode = 201;
  }

  /**
   * Take each handler, and attach to one of the Express.Router's
   * endpoints.
   */
  init() {
    this.router.get('/token_pairs', this.getTokenPairs);
    this.router.get('/orderbook', this.getOrderBook);
    this.router.get('/orders', this.getOrder);
    this.router.get('/order/:orderHash', this.getOrder);
    this.router.get('/fees', this.getFees);
    this.router.post('/order', this.postOrder);
    this.router.get('/tokens', this.getTokens);
  }

}

// Create the HeroRouter, and export its configured Express.Router
const v0RestApiRoutes = new V0RestApiRouter();
v0RestApiRoutes.init();

export default v0RestApiRoutes.router;