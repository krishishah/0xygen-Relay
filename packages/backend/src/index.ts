/** App entry point lives here */
import 'reflect-metadata';
import { useContainer as ormUseContainer, createConnection } from 'typeorm';
import { Container } from 'typedi';
import * as http from 'http';
import * as debug from 'debug';
import { App } from './app';
import { create } from 'domain';
import { Application } from 'express';
import * as express from 'express';

async function createServer(): Promise<Express.Application> {
  debug('ts-express:server');

  ormUseContainer(Container);
  // Create connection with Database
  // Config read from ormconfig.json file
  return createConnection().then(async connection => {
    const port = normalizePort(process.env.PORT || 3000);
    let app = Container.get(App).express;
    app.set('port', port);
    const server = http.createServer(app);
    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);
  
    function normalizePort(val: number|string): number|string|boolean {
      let port: number = (typeof val === 'string') ? parseInt(val, 10) : val;
      if (isNaN(port)) { return val; } else if (port >= 0) { return port; } else { return false; }
    }
    
    function onError(error: NodeJS.ErrnoException): void {
      if (error.syscall !== 'listen') { throw error; }
      let bind = (typeof port === 'string') ? 'Pipe ' + port : 'Port ' + port;
      switch (error.code) {
        case 'EACCES':
          console.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    }
    
    function onListening(): void {
      let addr = server.address();
      let bind = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`;
      debug(`Listening on ${bind}`);
    }

    return server;
  }).catch(error => {
    console.log('Error: ', error);
    return null;
  });

}

export const server = createServer();
