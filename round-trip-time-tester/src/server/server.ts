import Koa from 'koa';
import { useMiddleware } from './middleware';
import { storageAdapter } from '@src/storage';
import { Adapters } from '@src/types';
import { addRestRoutes } from '@src/rest';
import { messageAdapter } from '@src/deviceMessage';

const PORT_HTTP = 5050;

export const startServer = async () => {
  const server = new Koa();

  const adapters: Adapters = {
    storageAdapter: await storageAdapter(),
    messageAdapter: messageAdapter(),
  };

  server.context.adapters = adapters;

  useMiddleware(server);

  addRestRoutes(server);

  server.listen(PORT_HTTP, '0.0.0.0');

  console.log(`HTTP server listening on port ${PORT_HTTP}`);
};
