import {Router, Request, Response, NextFunction} from 'express';

class V0RestApiRouter {
  router: Router

  /**
   * Initialize the RestApiRouter
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
    res.send();
  }

  /**
   * GET orderbook.
   */
  public getOrderBook(req: Request, res: Response, next: NextFunction) {
    res.statusMessage = "Success";
    res.statusCode = 201;
    res.send();
  }

  /**
   * GET orders.
   */
  public getOrders(req: Request, res: Response, next: NextFunction) {
    res.statusMessage = "Success";
    res.statusCode = 201;
    res.send();
  }

  /**
   * GET order.
   */
  public getOrder(req: Request, res: Response, next: NextFunction) {
    res.statusMessage = "Success";
    res.statusCode = 201;
    res.send();
  }

  /**
   * GET fees.
   */
  public getFees(req: Request, res: Response, next: NextFunction) {
    res.statusMessage = "Success";
    res.statusCode = 201;
    res.send();
  }

  /**
   * POST order.
   */
  public postOrder(req: Request, res: Response, next: NextFunction) {
    res.statusMessage = "Success";
    res.statusCode = 201;
    res.send();
  }

  /**
   * GET tokens.
   */
  public getTokens(req: Request, res: Response, next: NextFunction) {
    res.statusMessage = "Success";
    res.statusCode = 201;
    res.send();
  }

  /**
   * Take each handler, and attach to one of the Express.Router's
   * endpoints.
   */
  private init() {
    this.router.get('/token_pairs', this.getTokenPairs);
    this.router.get('/orderbook', this.getOrderBook);
    this.router.get('/orders', this.getOrder);
    this.router.get('/order/:orderHash', this.getOrder);
    this.router.get('/fees', this.getFees);
    this.router.post('/order', this.postOrder);
    this.router.get('/tokens', this.getTokens);
  }

}

// Create the v0RestApiRoutes, and export its configured Express.Router
export const v0RestApiRoutes = new V0RestApiRouter().router;
