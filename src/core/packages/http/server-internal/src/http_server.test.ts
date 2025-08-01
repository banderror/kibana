/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { setTlsConfigMock } from './http_server.test.mocks';
import { Server } from 'http';
import { rm, mkdtemp, readFile, writeFile } from 'fs/promises';
import supertest from 'supertest';
import { omit } from 'lodash';
import { join } from 'path';
import { ByteSizeValue, schema } from '@kbn/config-schema';
import { loggingSystemMock } from '@kbn/core-logging-server-mocks';
import type {
  KibanaRequest,
  KibanaResponseFactory,
  RequestHandler,
  RouteValidationResultFactory,
  RouteValidationFunction,
  RequestHandlerContextBase,
} from '@kbn/core-http-server';
import { Router, type RouterOptions } from '@kbn/core-http-router-server-internal';
import { createServer } from '@kbn/server-http-tools';
import { HttpConfig } from './http_config';
import { HttpServer } from './http_server';
import { Readable } from 'stream';
import { KBN_CERT_PATH, KBN_KEY_PATH } from '@kbn/dev-utils';
import moment from 'moment';
import { of, Observable, BehaviorSubject } from 'rxjs';
import { mockCoreContext } from '@kbn/core-base-server-mocks';
import { createTestEnv, getEnvOptions } from '@kbn/config-mocks';

const options = getEnvOptions();
options.cliArgs.dev = false;
const env = createTestEnv({ envOptions: options });

const routerOptions: RouterOptions = {
  env,
  versionedRouterOptions: {
    defaultHandlerResolutionStrategy: 'oldest',
    useVersionResolutionStrategyForInternalPaths: [],
  },
};

const cookieOptions = {
  name: 'sid',
  encryptionKey: 'something_at_least_32_characters',
  validate: () => ({ isValid: true }),
  isSecure: false,
};

let server: HttpServer;

let config: HttpConfig;
let config$: Observable<HttpConfig>;

let configWithSSL: HttpConfig;
let configWithSSL$: Observable<HttpConfig>;

const coreContext = mockCoreContext.create();
const loggingService = coreContext.logger;
const logger = coreContext.logger.get();
const enhanceWithContext = (fn: (...args: any[]) => any) => fn.bind(null, {});

let certificate: string;
let key: string;

beforeAll(async () => {
  certificate = await readFile(KBN_CERT_PATH, 'utf8');
  key = await readFile(KBN_KEY_PATH, 'utf8');
});

beforeEach(() => {
  config = {
    name: 'kibana',
    host: '127.0.0.1',
    maxPayload: new ByteSizeValue(1024),
    port: 10002,
    ssl: { enabled: false },
    compression: { enabled: true, brotli: { enabled: false, quality: 3 } },
    requestId: {
      allowFromAnyIp: true,
      ipAllowlist: [],
    },
    cors: {
      enabled: false,
    },
    csp: {
      disableEmbedding: true,
    },
    cdn: {},
    shutdownTimeout: moment.duration(500, 'ms'),
  } as any;
  config$ = of(config);

  configWithSSL = {
    ...config,
    ssl: {
      enabled: true,
      certificate,
      cipherSuites: ['TLS_AES_256_GCM_SHA384'],
      getSecureOptions: () => 0,
      key,
      redirectHttpFromPort: config.port + 1,
    },
  } as HttpConfig;
  configWithSSL$ = of(configWithSSL);

  server = new HttpServer(coreContext, 'tests', of(config.shutdownTimeout));
});

afterEach(async () => {
  await server.stop();
  jest.clearAllMocks();
});

test('log listening address after started', async () => {
  expect(server.isListening()).toBe(false);

  await server.setup({ config$ });
  await server.start();

  expect(server.isListening()).toBe(true);
  expect(loggingSystemMock.collect(loggingService).info).toMatchInlineSnapshot(`
    Array [
      Array [
        "http server running at http://127.0.0.1:10002",
      ],
    ]
  `);
});

test('log listening address after started when configured with BasePath and rewriteBasePath = false', async () => {
  expect(server.isListening()).toBe(false);

  await server.setup({ config$: of({ ...config, basePath: '/bar', rewriteBasePath: false }) });
  await server.start();

  expect(server.isListening()).toBe(true);
  expect(loggingSystemMock.collect(loggingService).info).toMatchInlineSnapshot(`
    Array [
      Array [
        "http server running at http://127.0.0.1:10002",
      ],
    ]
  `);
});

test('log listening address after started when configured with BasePath and rewriteBasePath = true', async () => {
  expect(server.isListening()).toBe(false);

  await server.setup({ config$: of({ ...config, basePath: '/bar', rewriteBasePath: true }) });
  await server.start();

  expect(server.isListening()).toBe(true);
  expect(loggingSystemMock.collect(loggingService).info).toMatchInlineSnapshot(`
    Array [
      Array [
        "http server running at http://127.0.0.1:10002/bar",
      ],
    ]
  `);
});

test('does not allow router registration after server is listening', async () => {
  expect(server.isListening()).toBe(false);

  const { registerRouter } = await server.setup({ config$ });

  const router1 = new Router('/foo', logger, enhanceWithContext, routerOptions);
  expect(() => registerRouter(router1)).not.toThrowError();

  await server.start();

  expect(server.isListening()).toBe(true);

  const router2 = new Router('/bar', logger, enhanceWithContext, routerOptions);
  expect(() => registerRouter(router2)).toThrowErrorMatchingInlineSnapshot(
    `"Routers can be registered only when HTTP server is stopped."`
  );
});

test('allows router registration after server is listening via `registerRouterAfterListening`', async () => {
  expect(server.isListening()).toBe(false);

  const { registerRouterAfterListening } = await server.setup({ config$ });

  const router1 = new Router('/foo', logger, enhanceWithContext, routerOptions);
  expect(() => registerRouterAfterListening(router1)).not.toThrowError();

  await server.start();

  expect(server.isListening()).toBe(true);

  const router2 = new Router('/bar', logger, enhanceWithContext, routerOptions);
  expect(() => registerRouterAfterListening(router2)).not.toThrowError();
});

test('valid params', async () => {
  const router = new Router('/foo', logger, enhanceWithContext, routerOptions);

  router.get(
    {
      path: '/{test}',
      validate: {
        params: schema.object({
          test: schema.string(),
        }),
      },
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => {
      return res.ok({ body: req.params.test });
    }
  );

  const { registerRouter, server: innerServer } = await server.setup({ config$ });
  registerRouter(router);

  await server.start();

  await supertest(innerServer.listener)
    .get('/foo/some-string')
    .expect(200)
    .then((res) => {
      expect(res.text).toBe('some-string');
    });
});

test('invalid params', async () => {
  const router = new Router('/foo', logger, enhanceWithContext, routerOptions);

  router.get(
    {
      path: '/{test}',
      validate: {
        params: schema.object({
          test: schema.number(),
        }),
      },
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => {
      return res.ok({ body: String(req.params.test) });
    }
  );

  const { registerRouter, server: innerServer } = await server.setup({ config$ });
  registerRouter(router);

  await server.start();

  await supertest(innerServer.listener)
    .get('/foo/some-string')
    .expect(400)
    .then((res) => {
      expect(res.body).toEqual({
        error: 'Bad Request',
        statusCode: 400,
        message: '[request params.test]: expected value of type [number] but got [string]',
      });
    });
});

test('valid query', async () => {
  const router = new Router('/foo', logger, enhanceWithContext, routerOptions);

  router.get(
    {
      path: '/',
      validate: {
        query: schema.object({
          bar: schema.string(),
          quux: schema.number(),
        }),
      },
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => {
      return res.ok({ body: req.query });
    }
  );

  const { registerRouter, server: innerServer } = await server.setup({ config$ });
  registerRouter(router);

  await server.start();

  await supertest(innerServer.listener)
    .get('/foo/?bar=test&quux=123')
    .expect(200)
    .then((res) => {
      expect(res.body).toEqual({ bar: 'test', quux: 123 });
    });
});

test('invalid query', async () => {
  const router = new Router('/foo', logger, enhanceWithContext, routerOptions);

  router.get(
    {
      path: '/',
      validate: {
        query: schema.object({
          bar: schema.number(),
        }),
      },
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => {
      return res.ok({ body: req.query });
    }
  );

  const { registerRouter, server: innerServer } = await server.setup({ config$ });
  registerRouter(router);

  await server.start();

  await supertest(innerServer.listener)
    .get('/foo/?bar=test')
    .expect(400)
    .then((res) => {
      expect(res.body).toEqual({
        error: 'Bad Request',
        statusCode: 400,
        message: '[request query.bar]: expected value of type [number] but got [string]',
      });
    });
});

test('valid body', async () => {
  const router = new Router('/foo', logger, enhanceWithContext, routerOptions);

  router.post(
    {
      path: '/',
      validate: {
        body: schema.object({
          bar: schema.string(),
          baz: schema.number(),
        }),
      },
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => {
      return res.ok({ body: req.body });
    }
  );

  const { registerRouter, server: innerServer } = await server.setup({ config$ });
  registerRouter(router);

  await server.start();

  await supertest(innerServer.listener)
    .post('/foo/')
    .send({
      bar: 'test',
      baz: 123,
    })
    .expect(200)
    .then((res) => {
      expect(res.body).toEqual({ bar: 'test', baz: 123 });
    });
});

test('valid body with validate function', async () => {
  const router = new Router('/foo', logger, enhanceWithContext, routerOptions);

  router.post(
    {
      path: '/',
      validate: {
        body: ({ bar, baz } = {}, { ok, badRequest }) => {
          if (typeof bar === 'string' && typeof baz === 'number') {
            return ok({ bar, baz });
          } else {
            return badRequest('Wrong payload', ['body']);
          }
        },
      },
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => {
      return res.ok({ body: req.body });
    }
  );

  const { registerRouter, server: innerServer } = await server.setup({ config$ });
  registerRouter(router);

  await server.start();

  await supertest(innerServer.listener)
    .post('/foo/')
    .send({
      bar: 'test',
      baz: 123,
    })
    .expect(200)
    .then((res) => {
      expect(res.body).toEqual({ bar: 'test', baz: 123 });
    });
});

test('not inline validation - specifying params', async () => {
  const router = new Router('/foo', logger, enhanceWithContext, routerOptions);

  const bodyValidation = (
    { bar, baz }: any = {},
    { ok, badRequest }: RouteValidationResultFactory
  ) => {
    if (typeof bar === 'string' && typeof baz === 'number') {
      return ok({ bar, baz });
    } else {
      return badRequest('Wrong payload', ['body']);
    }
  };

  router.post(
    {
      path: '/',
      validate: {
        body: bodyValidation,
      },
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => {
      return res.ok({ body: req.body });
    }
  );

  const { registerRouter, server: innerServer } = await server.setup({ config$ });
  registerRouter(router);

  await server.start();

  await supertest(innerServer.listener)
    .post('/foo/')
    .send({
      bar: 'test',
      baz: 123,
    })
    .expect(200)
    .then((res) => {
      expect(res.body).toEqual({ bar: 'test', baz: 123 });
    });
});

test('not inline validation - specifying validation handler', async () => {
  const router = new Router('/foo', logger, enhanceWithContext, routerOptions);

  const bodyValidation: RouteValidationFunction<{ bar: string; baz: number }> = (
    { bar, baz } = {},
    { ok, badRequest }
  ) => {
    if (typeof bar === 'string' && typeof baz === 'number') {
      return ok({ bar, baz });
    } else {
      return badRequest('Wrong payload', ['body']);
    }
  };

  router.post(
    {
      path: '/',
      validate: {
        body: bodyValidation,
      },
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => {
      return res.ok({ body: req.body });
    }
  );

  const { registerRouter, server: innerServer } = await server.setup({ config$ });
  registerRouter(router);

  await server.start();

  await supertest(innerServer.listener)
    .post('/foo/')
    .send({
      bar: 'test',
      baz: 123,
    })
    .expect(200)
    .then((res) => {
      expect(res.body).toEqual({ bar: 'test', baz: 123 });
    });
});

// https://github.com/elastic/kibana/issues/47047
test('not inline handler - KibanaRequest', async () => {
  const router = new Router('/foo', logger, enhanceWithContext, routerOptions);

  const handler = (
    context: RequestHandlerContextBase,
    req: KibanaRequest<unknown, unknown, { bar: string; baz: number }>,
    res: KibanaResponseFactory
  ) => {
    const body = {
      bar: req.body.bar.toUpperCase(),
      baz: req.body.baz.toString(),
    };

    return res.ok({ body });
  };

  router.post(
    {
      path: '/',
      validate: {
        body: ({ bar, baz } = {}, { ok, badRequest }) => {
          if (typeof bar === 'string' && typeof baz === 'number') {
            return ok({ bar, baz });
          } else {
            return badRequest('Wrong payload', ['body']);
          }
        },
      },
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    handler
  );

  const { registerRouter, server: innerServer } = await server.setup({ config$ });
  registerRouter(router);

  await server.start();

  await supertest(innerServer.listener)
    .post('/foo/')
    .send({
      bar: 'test',
      baz: 123,
    })
    .expect(200)
    .then((res) => {
      expect(res.body).toEqual({ bar: 'TEST', baz: '123' });
    });
});

test('not inline handler - RequestHandler', async () => {
  const router = new Router('/foo', logger, enhanceWithContext, routerOptions);

  const handler: RequestHandler<unknown, unknown, { bar: string; baz: number }> = (
    context,
    req,
    res
  ) => {
    const body = {
      bar: req.body.bar.toUpperCase(),
      baz: req.body.baz.toString(),
    };

    return res.ok({ body });
  };

  router.post(
    {
      path: '/',
      validate: {
        body: ({ bar, baz } = {}, { ok, badRequest }) => {
          if (typeof bar === 'string' && typeof baz === 'number') {
            return ok({ bar, baz });
          } else {
            return badRequest('Wrong payload', ['body']);
          }
        },
      },
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    handler
  );

  const { registerRouter, server: innerServer } = await server.setup({ config$ });
  registerRouter(router);

  await server.start();

  await supertest(innerServer.listener)
    .post('/foo/')
    .send({
      bar: 'test',
      baz: 123,
    })
    .expect(200)
    .then((res) => {
      expect(res.body).toEqual({ bar: 'TEST', baz: '123' });
    });
});

test('invalid body', async () => {
  const router = new Router('/foo', logger, enhanceWithContext, routerOptions);

  router.post(
    {
      path: '/',
      validate: {
        body: schema.object({
          bar: schema.number(),
        }),
      },
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => {
      return res.ok({ body: req.body });
    }
  );

  const { registerRouter, server: innerServer } = await server.setup({ config$ });
  registerRouter(router);

  await server.start();

  await supertest(innerServer.listener)
    .post('/foo/')
    .send({ bar: 'test' })
    .expect(400)
    .then((res) => {
      expect(res.body).toEqual({
        error: 'Bad Request',
        statusCode: 400,
        message: '[request body.bar]: expected value of type [number] but got [string]',
      });
    });
});

test('handles putting', async () => {
  const router = new Router('/foo', logger, enhanceWithContext, routerOptions);

  router.put(
    {
      path: '/',
      validate: {
        body: schema.object({
          key: schema.string(),
        }),
      },
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => {
      return res.ok({ body: req.body });
    }
  );

  const { registerRouter, server: innerServer } = await server.setup({ config$ });
  registerRouter(router);

  await server.start();

  await supertest(innerServer.listener)
    .put('/foo/')
    .send({ key: 'new value' })
    .expect(200)
    .then((res) => {
      expect(res.body).toEqual({ key: 'new value' });
    });
});

test('handles deleting', async () => {
  const router = new Router('/foo', logger, enhanceWithContext, routerOptions);

  router.delete(
    {
      path: '/{id}',
      validate: {
        params: schema.object({
          id: schema.number(),
        }),
      },
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => {
      return res.ok({ body: { key: req.params.id } });
    }
  );

  const { registerRouter, server: innerServer } = await server.setup({ config$ });
  registerRouter(router);

  await server.start();

  await supertest(innerServer.listener)
    .delete('/foo/3')
    .expect(200)
    .then((res) => {
      expect(res.body).toEqual({ key: 3 });
    });
});

describe('with `basepath: /bar` and `rewriteBasePath: false`', () => {
  let configWithBasePath: HttpConfig;
  let innerServerListener: Server;

  beforeEach(async () => {
    configWithBasePath = {
      ...config,
      basePath: '/bar',
      rewriteBasePath: false,
    } as HttpConfig;

    const router = new Router('/', logger, enhanceWithContext, routerOptions);
    router.get(
      {
        path: '/',
        validate: false,
        security: {
          authz: {
            requiredPrivileges: ['foo'],
          },
        },
      },
      (context, req, res) => res.ok({ body: 'value:/' })
    );
    router.get(
      {
        path: '/foo',
        validate: false,
        security: {
          authz: {
            requiredPrivileges: ['foo'],
          },
        },
      },
      (context, req, res) => res.ok({ body: 'value:/foo' })
    );

    const { registerRouter, server: innerServer } = await server.setup({
      config$: of(configWithBasePath),
    });
    registerRouter(router);

    await server.start();
    innerServerListener = innerServer.listener;
  });

  test('/bar => 404', async () => {
    await supertest(innerServerListener).get('/bar').expect(404);
  });

  test('/bar/ => 404', async () => {
    await supertest(innerServerListener).get('/bar/').expect(404);
  });

  test('/bar/foo => 404', async () => {
    await supertest(innerServerListener).get('/bar/foo').expect(404);
  });

  test('/ => /', async () => {
    await supertest(innerServerListener)
      .get('/')
      .expect(200)
      .then((res) => {
        expect(res.text).toBe('value:/');
      });
  });

  test('/foo => /foo', async () => {
    await supertest(innerServerListener)
      .get('/foo')
      .expect(200)
      .then((res) => {
        expect(res.text).toBe('value:/foo');
      });
  });
});

describe('with `basepath: /bar` and `rewriteBasePath: true`', () => {
  let configWithBasePath: HttpConfig;
  let innerServerListener: Server;

  beforeEach(async () => {
    configWithBasePath = {
      ...config,
      basePath: '/bar',
      rewriteBasePath: true,
    } as HttpConfig;

    const router = new Router('/', logger, enhanceWithContext, routerOptions);
    router.get(
      {
        path: '/',
        validate: false,
        security: {
          authz: {
            requiredPrivileges: ['foo'],
          },
        },
      },
      (context, req, res) => res.ok({ body: 'value:/' })
    );
    router.get(
      {
        path: '/foo',
        validate: false,
        security: {
          authz: {
            requiredPrivileges: ['foo'],
          },
        },
      },
      (context, req, res) => res.ok({ body: 'value:/foo' })
    );

    const { registerRouter, server: innerServer } = await server.setup({
      config$: of(configWithBasePath),
    });
    registerRouter(router);

    await server.start();
    innerServerListener = innerServer.listener;
  });

  test('/bar => /', async () => {
    await supertest(innerServerListener)
      .get('/bar')
      .expect(200)
      .then((res) => {
        expect(res.text).toBe('value:/');
      });
  });

  test('/bar/ => /', async () => {
    await supertest(innerServerListener)
      .get('/bar/')
      .expect(200)
      .then((res) => {
        expect(res.text).toBe('value:/');
      });
  });

  test('/bar/foo => /foo', async () => {
    await supertest(innerServerListener)
      .get('/bar/foo')
      .expect(200)
      .then((res) => {
        expect(res.text).toBe('value:/foo');
      });
  });

  test('/ => 404', async () => {
    await supertest(innerServerListener).get('/').expect(404);
  });

  test('/foo => 404', async () => {
    await supertest(innerServerListener).get('/foo').expect(404);
  });
});

test('with defined `redirectHttpFromPort`', async () => {
  const router = new Router('/', logger, enhanceWithContext, routerOptions);
  router.get(
    {
      path: '/',
      validate: false,
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => res.ok({ body: 'value:/' })
  );

  const { registerRouter } = await server.setup({ config$: configWithSSL$ });
  registerRouter(router);

  await server.start();
});

test('returns server and connection options on start', async () => {
  const configWithPort = {
    ...config,
    port: 12345,
  };
  const { server: innerServer } = await server.setup({ config$: of(configWithPort) });

  expect(innerServer).toBeDefined();
  expect(innerServer).toBe((server as any).server);
});

test('throws an error if starts without set up', async () => {
  await expect(server.start()).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Http server is not setup up yet"`
  );
});

test('allows attaching metadata to attach meta-data tag strings to a route', async () => {
  const tags = ['my:tag'];
  const { registerRouter, server: innerServer } = await server.setup({ config$ });

  const router = new Router('', logger, enhanceWithContext, routerOptions);
  router.get(
    {
      path: '/with-tags',
      validate: false,
      options: { tags },
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => res.ok({ body: { tags: req.route.options.tags } })
  );
  router.get(
    {
      path: '/without-tags',
      validate: false,
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => res.ok({ body: { tags: req.route.options.tags } })
  );
  registerRouter(router);

  await server.start();
  await supertest(innerServer.listener).get('/with-tags').expect(200, { tags });

  await supertest(innerServer.listener).get('/without-tags').expect(200, { tags: [] });
});

test('allows declaring route access to flag a route as public or internal', async () => {
  const access = 'internal';
  const { registerRouter, server: innerServer } = await server.setup({ config$ });

  const router = new Router('', logger, enhanceWithContext, routerOptions);
  router.get(
    {
      path: '/with-access',
      validate: false,
      options: { access },
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => res.ok({ body: { access: req.route.options.access } })
  );
  router.get(
    {
      path: '/without-access',
      validate: false,
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => res.ok({ body: { access: req.route.options.access } })
  );
  registerRouter(router);

  await server.start();
  await supertest(innerServer.listener).get('/with-access').expect(200, { access: 'internal' });

  await supertest(innerServer.listener).get('/without-access').expect(200, { access: 'internal' });
});

test(`sets access flag to 'internal' if not defined`, async () => {
  const { registerRouter, server: innerServer } = await server.setup({ config$ });

  const router = new Router('', logger, enhanceWithContext, routerOptions);
  router.get(
    {
      path: '/internal/foo',
      validate: false,
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => res.ok({ body: { access: req.route.options.access } })
  );
  router.get(
    {
      path: '/random/foo',
      validate: false,
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => res.ok({ body: { access: req.route.options.access } })
  );
  router.get(
    {
      path: '/random/internal/foo',
      validate: false,
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => res.ok({ body: { access: req.route.options.access } })
  );

  router.get(
    {
      path: '/api/foo/internal/my-foo',
      validate: false,
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => res.ok({ body: { access: req.route.options.access } })
  );
  registerRouter(router);

  await server.start();
  await supertest(innerServer.listener).get('/internal/foo').expect(200, { access: 'internal' });

  await supertest(innerServer.listener).get('/random/foo').expect(200, { access: 'internal' });
  await supertest(innerServer.listener)
    .get('/random/internal/foo')
    .expect(200, { access: 'internal' });
  await supertest(innerServer.listener)
    .get('/api/foo/internal/my-foo')
    .expect(200, { access: 'internal' });
});

test('exposes route details of incoming request to a route handler', async () => {
  const { registerRouter, server: innerServer } = await server.setup({ config$ });

  const router = new Router('', logger, enhanceWithContext, routerOptions);
  router.get(
    {
      path: '/',
      validate: false,
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => res.ok({ body: req.route })
  );
  registerRouter(router);

  await server.start();
  await supertest(innerServer.listener)
    .get('/')
    .expect(200, {
      method: 'get',
      path: '/',
      routePath: '/',
      options: {
        authRequired: true,
        xsrfRequired: false,
        access: 'internal',
        tags: [],
        timeout: {},
        security: {
          authz: {
            requiredPrivileges: ['foo'],
          },
        },
      },
    });
});

describe('conditional compression', () => {
  async function setupServer(innerConfig: HttpConfig) {
    const { registerRouter, server: innerServer } = await server.setup({
      config$: of(innerConfig),
    });
    const router = new Router('', logger, enhanceWithContext, routerOptions);
    // we need the large body here so that compression would normally be used
    const largeRequest = {
      body: 'hello'.repeat(500),
      headers: { 'Content-Type': 'text/html; charset=UTF-8' },
    };
    router.get(
      {
        path: '/',
        validate: false,
        security: {
          authz: {
            requiredPrivileges: ['foo'],
          },
        },
      },
      (_context, _req, res) => res.ok(largeRequest)
    );
    registerRouter(router);
    await server.start();
    return innerServer.listener;
  }

  test('with `compression.enabled: true`', async () => {
    const listener = await setupServer(config);

    const response = await supertest(listener).get('/').set('accept-encoding', 'gzip');

    expect(response.header).toHaveProperty('content-encoding', 'gzip');
  });

  test('with `compression.enabled: false`', async () => {
    const listener = await setupServer({
      ...config,
      compression: { enabled: false, brotli: { enabled: false, quality: 3 } },
    });

    const response = await supertest(listener).get('/').set('accept-encoding', 'gzip');

    expect(response.header).not.toHaveProperty('content-encoding');
  });

  test('with `compression.brotli.enabled: false`', async () => {
    const listener = await setupServer({
      ...config,
      compression: { enabled: true, brotli: { enabled: false, quality: 3 } },
    });

    const response = await supertest(listener).get('/').set('accept-encoding', 'br');

    expect(response.header).not.toHaveProperty('content-encoding', 'br');
  });

  test('with `compression.brotli.enabled: true`', async () => {
    const listener = await setupServer({
      ...config,
      compression: { enabled: true, brotli: { enabled: true, quality: 3 } },
    });

    const response = await supertest(listener).get('/').set('accept-encoding', 'br');

    expect(response.header).toHaveProperty('content-encoding', 'br');
  });

  describe('with defined `compression.referrerWhitelist`', () => {
    let listener: Server;
    beforeEach(async () => {
      listener = await setupServer({
        ...config,
        compression: {
          enabled: true,
          referrerWhitelist: ['foo'],
          brotli: { enabled: false, quality: 3 },
        },
      });
    });

    test('enables compression for no referer', async () => {
      const response = await supertest(listener).get('/').set('accept-encoding', 'gzip');

      expect(response.header).toHaveProperty('content-encoding', 'gzip');
    });

    test('enables compression for whitelisted referer', async () => {
      const response = await supertest(listener)
        .get('/')
        .set('accept-encoding', 'gzip')
        .set('referer', 'http://foo:1234');

      expect(response.header).toHaveProperty('content-encoding', 'gzip');
    });

    test('disables compression for non-whitelisted referer', async () => {
      const response = await supertest(listener)
        .get('/')
        .set('accept-encoding', 'gzip')
        .set('referer', 'http://bar:1234');

      expect(response.header).not.toHaveProperty('content-encoding');
    });

    test('disables compression for invalid referer', async () => {
      const response = await supertest(listener)
        .get('/')
        .set('accept-encoding', 'gzip')
        .set('referer', 'http://asdf$%^');

      expect(response.header).not.toHaveProperty('content-encoding');
    });
  });
});

describe('response headers', () => {
  test('allows to configure "keep-alive" header', async () => {
    const { registerRouter, server: innerServer } = await server.setup({
      config$: of({
        ...config,
        keepaliveTimeout: 100_000,
      }),
    });

    const router = new Router('', logger, enhanceWithContext, routerOptions);
    router.get(
      {
        path: '/',
        validate: false,
        security: {
          authz: {
            requiredPrivileges: ['foo'],
          },
        },
      },
      (context, req, res) => res.ok({ body: req.route })
    );
    registerRouter(router);

    await server.start();
    const response = await supertest(innerServer.listener)
      .get('/')
      .set('Connection', 'keep-alive')
      .expect(200);

    expect(response.header.connection).toBe('keep-alive');
    expect(response.header['keep-alive']).toBe('timeout=100');
  });

  test('default headers', async () => {
    const { registerRouter, server: innerServer } = await server.setup({ config$ });

    const router = new Router('', logger, enhanceWithContext, routerOptions);
    router.get(
      {
        path: '/',
        validate: false,
        security: {
          authz: {
            requiredPrivileges: ['foo'],
          },
        },
      },
      (context, req, res) => res.ok({ body: req.route })
    );
    registerRouter(router);

    await server.start();
    const response = await supertest(innerServer.listener).get('/').expect(200);

    const restHeaders = omit(response.header, ['date', 'content-length']);
    expect(restHeaders).toMatchInlineSnapshot(`
      Object {
        "accept-ranges": "bytes",
        "cache-control": "private, no-cache, no-store, must-revalidate",
        "connection": "close",
        "content-type": "application/json; charset=utf-8",
      }
    `);
  });
});

test('exposes route details of incoming request to a route handler (POST + payload options)', async () => {
  const { registerRouter, server: innerServer } = await server.setup({ config$ });

  const router = new Router('', logger, enhanceWithContext, routerOptions);
  router.post(
    {
      path: '/',
      validate: { body: schema.object({ test: schema.number() }) },
      options: { body: { accepts: 'application/json' } },
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => res.ok({ body: req.route })
  );
  registerRouter(router);

  await server.start();
  await supertest(innerServer.listener)
    .post('/')
    .send({ test: 1 })
    .expect(200, {
      method: 'post',
      path: '/',
      routePath: '/',
      options: {
        authRequired: true,
        xsrfRequired: true,
        access: 'internal',
        tags: [],
        timeout: {
          payload: 10000,
        },
        security: {
          authz: {
            requiredPrivileges: ['foo'],
          },
        },
        body: {
          parse: true, // hapi populates the default
          maxBytes: 1024, // hapi populates the default
          accepts: ['application/json'],
          output: 'data',
        },
      },
    });
});

describe('body options', () => {
  test('should reject the request because the Content-Type in the request is not valid', async () => {
    const { registerRouter, server: innerServer } = await server.setup({ config$ });

    const router = new Router('', logger, enhanceWithContext, routerOptions);
    router.post(
      {
        path: '/',
        validate: { body: schema.object({ test: schema.number() }) },
        options: { body: { accepts: 'multipart/form-data' } }, // supertest sends 'application/json'
        security: {
          authz: {
            requiredPrivileges: ['foo'],
          },
        },
      },
      (context, req, res) => res.ok({ body: req.route })
    );
    registerRouter(router);

    await server.start();
    await supertest(innerServer.listener).post('/').send({ test: 1 }).expect(415, {
      statusCode: 415,
      error: 'Unsupported Media Type',
      message: 'Unsupported Media Type',
    });
  });

  test('should reject the request because the payload is too large', async () => {
    const { registerRouter, server: innerServer } = await server.setup({ config$ });

    const router = new Router('', logger, enhanceWithContext, routerOptions);
    router.post(
      {
        path: '/',
        validate: { body: schema.object({ test: schema.number() }) },
        options: { body: { maxBytes: 1 } },
        security: {
          authz: {
            requiredPrivileges: ['foo'],
          },
        },
      },
      (context, req, res) => res.ok({ body: req.route })
    );
    registerRouter(router);

    await server.start();
    await supertest(innerServer.listener).post('/').send({ test: 1 }).expect(413, {
      statusCode: 413,
      error: 'Request Entity Too Large',
      message: 'Payload content length greater than maximum allowed: 1',
    });
  });

  test('should not parse the content in the request', async () => {
    const { registerRouter, server: innerServer } = await server.setup({ config$ });

    const router = new Router('', logger, enhanceWithContext, routerOptions);
    router.post(
      {
        path: '/',
        validate: { body: schema.buffer() },
        options: { body: { parse: false } },
        security: {
          authz: {
            requiredPrivileges: ['foo'],
          },
        },
      },
      (context, req, res) => {
        expect(req.body).toBeInstanceOf(Buffer);
        expect(req.body.toString()).toBe(JSON.stringify({ test: 1 }));
        return res.ok({ body: req.route.options.body });
      }
    );
    registerRouter(router);

    await server.start();
    await supertest(innerServer.listener).post('/').send({ test: 1 }).expect(200, {
      parse: false,
      maxBytes: 1024, // hapi populates the default
      output: 'data',
    });
  });
});

describe('timeout options', () => {
  describe('payload timeout', () => {
    test('POST routes set the payload timeout', async () => {
      const { registerRouter, server: innerServer } = await server.setup({ config$ });

      const router = new Router('', logger, enhanceWithContext, routerOptions);
      router.post(
        {
          path: '/',
          validate: false,
          options: {
            timeout: {
              payload: 300000,
            },
          },
          security: {
            authz: {
              requiredPrivileges: ['foo'],
            },
          },
        },
        (context, req, res) => {
          return res.ok({
            body: {
              timeout: req.route.options.timeout,
            },
          });
        }
      );
      registerRouter(router);
      await server.start();
      await supertest(innerServer.listener)
        .post('/')
        .send({ test: 1 })
        .expect(200, {
          timeout: {
            payload: 300000,
          },
        });
    });

    test('DELETE routes set the payload timeout', async () => {
      const { registerRouter, server: innerServer } = await server.setup({ config$ });

      const router = new Router('', logger, enhanceWithContext, routerOptions);
      router.delete(
        {
          path: '/',
          validate: false,
          options: {
            timeout: {
              payload: 300000,
            },
          },
          security: {
            authz: {
              requiredPrivileges: ['foo'],
            },
          },
        },
        (context, req, res) => {
          return res.ok({
            body: {
              timeout: req.route.options.timeout,
            },
          });
        }
      );
      registerRouter(router);
      await server.start();
      await supertest(innerServer.listener)
        .delete('/')
        .expect(200, {
          timeout: {
            payload: 300000,
          },
        });
    });

    test('PUT routes set the payload timeout and automatically adjusts the idle socket timeout', async () => {
      const { registerRouter, server: innerServer } = await server.setup({ config$ });

      const router = new Router('', logger, enhanceWithContext, routerOptions);
      router.put(
        {
          path: '/',
          validate: false,
          options: {
            timeout: {
              payload: 300000,
            },
          },
          security: {
            authz: {
              requiredPrivileges: ['foo'],
            },
          },
        },
        (context, req, res) => {
          return res.ok({
            body: {
              timeout: req.route.options.timeout,
            },
          });
        }
      );
      registerRouter(router);
      await server.start();
      await supertest(innerServer.listener)
        .put('/')
        .expect(200, {
          timeout: {
            payload: 300000,
          },
        });
    });

    test('PATCH routes set the payload timeout and automatically adjusts the idle socket timeout', async () => {
      const { registerRouter, server: innerServer } = await server.setup({ config$ });

      const router = new Router('', logger, enhanceWithContext, routerOptions);
      router.patch(
        {
          path: '/',
          validate: false,
          options: {
            timeout: {
              payload: 300000,
            },
          },
          security: {
            authz: {
              requiredPrivileges: ['foo'],
            },
          },
        },
        (context, req, res) => {
          return res.ok({
            body: {
              timeout: req.route.options.timeout,
            },
          });
        }
      );
      registerRouter(router);
      await server.start();
      await supertest(innerServer.listener)
        .patch('/')
        .expect(200, {
          timeout: {
            payload: 300000,
          },
        });
    });
  });

  describe('idleSocket timeout', () => {
    test('uses server socket timeout when not specified in the route', async () => {
      const { registerRouter, server: innerServer } = await server.setup({
        config$: of({
          ...config,
          socketTimeout: 11000,
        }),
      });

      const router = new Router('', logger, enhanceWithContext, routerOptions);
      router.get(
        {
          path: '/',
          validate: { body: schema.maybe(schema.any()) },
          security: {
            authz: {
              requiredPrivileges: ['foo'],
            },
          },
        },
        (context, req, res) => {
          return res.ok({
            body: {
              timeout: req.route.options.timeout,
            },
          });
        }
      );
      registerRouter(router);

      await server.start();
      await supertest(innerServer.listener)
        .get('/')
        .send()
        .expect(200, {
          timeout: {
            idleSocket: 11000,
          },
        });
    });

    test('sets the socket timeout when specified in the route', async () => {
      const { registerRouter, server: innerServer } = await server.setup({
        config$: of({
          ...config,
          socketTimeout: 11000,
        }),
      });

      const router = new Router('', logger, enhanceWithContext, routerOptions);
      router.get(
        {
          path: '/',
          validate: { body: schema.maybe(schema.any()) },
          options: { timeout: { idleSocket: 12000 } },
          security: {
            authz: {
              requiredPrivileges: ['foo'],
            },
          },
        },
        (context, req, res) => {
          return res.ok({
            body: {
              timeout: req.route.options.timeout,
            },
          });
        }
      );
      registerRouter(router);

      await server.start();
      await supertest(innerServer.listener)
        .get('/')
        .send()
        .expect(200, {
          timeout: {
            idleSocket: 12000,
          },
        });
    });

    test('idleSocket timeout can be smaller than the payload timeout', async () => {
      const { registerRouter } = await server.setup({ config$ });

      const router = new Router('', logger, enhanceWithContext, routerOptions);
      router.post(
        {
          path: '/',
          validate: { body: schema.any() },
          options: {
            timeout: {
              payload: 1000,
              idleSocket: 10,
            },
          },
          security: {
            authz: {
              requiredPrivileges: ['foo'],
            },
          },
        },
        (context, req, res) => {
          return res.ok({ body: { timeout: req.route.options.timeout } });
        }
      );

      registerRouter(router);

      await server.start();
    });
  });
});

test('should return a stream in the body', async () => {
  const { registerRouter, server: innerServer } = await server.setup({ config$ });

  const router = new Router('', logger, enhanceWithContext, routerOptions);
  router.put(
    {
      path: '/',
      validate: { body: schema.stream() },
      options: { body: { output: 'stream' } },
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => {
      expect(req.body).toBeInstanceOf(Readable);
      return res.ok({ body: req.route.options.body });
    }
  );
  registerRouter(router);

  await server.start();
  await supertest(innerServer.listener).put('/').send({ test: 1 }).expect(200, {
    parse: true,
    maxBytes: 1024, // hapi populates the default
    output: 'stream',
  });
});

test('closes sockets on timeout', async () => {
  const { registerRouter, server: innerServer } = await server.setup({
    config$: of({
      ...config,
      socketTimeout: 1000,
    }),
  });
  const router = new Router('', logger, enhanceWithContext, routerOptions);

  router.get(
    {
      path: '/a',
      validate: false,
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    async (context, req, res) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return res.ok({});
    }
  );
  router.get(
    {
      path: '/b',
      validate: false,
      security: {
        authz: {
          requiredPrivileges: ['foo'],
        },
      },
    },
    (context, req, res) => res.ok({})
  );

  registerRouter(router);

  registerRouter(router);

  await server.start();

  expect(supertest(innerServer.listener).get('/a')).rejects.toThrow('socket hang up');

  await supertest(innerServer.listener).get('/b').expect(200);
});

describe('setup contract', () => {
  describe('#createSessionStorage', () => {
    test('creates session storage factory', async () => {
      const { createCookieSessionStorageFactory } = await server.setup({ config$ });
      const sessionStorageFactory = await createCookieSessionStorageFactory(cookieOptions);

      expect(sessionStorageFactory.asScoped).toBeDefined();
    });

    test('creates session storage factory only once', async () => {
      const { createCookieSessionStorageFactory } = await server.setup({ config$ });
      const create = async () => await createCookieSessionStorageFactory(cookieOptions);

      await create();
      expect(create()).rejects.toThrowError('A cookieSessionStorageFactory was already created');
    });

    test('does not throw if called after stop', async () => {
      const { createCookieSessionStorageFactory } = await server.setup({ config$ });
      await server.stop();
      expect(() => {
        createCookieSessionStorageFactory(cookieOptions);
      }).not.toThrow();
    });
  });

  describe('#getServerInfo', () => {
    test('returns correct information', async () => {
      let { getServerInfo } = await server.setup({ config$ });

      expect(getServerInfo()).toEqual({
        hostname: '127.0.0.1',
        name: 'kibana',
        port: 10002,
        protocol: 'http',
      });

      ({ getServerInfo } = await server.setup({
        config$: of({
          ...config,
          port: 12345,
          name: 'custom-name',
          host: 'localhost',
        }),
      }));

      expect(getServerInfo()).toEqual({
        hostname: 'localhost',
        name: 'custom-name',
        port: 12345,
        protocol: 'http',
      });
    });

    test('returns correct protocol when ssl is enabled', async () => {
      const { getServerInfo } = await server.setup({ config$: configWithSSL$ });

      expect(getServerInfo().protocol).toEqual('https');
    });
  });

  describe('#registerStaticDir', () => {
    const assetFolder = join(__dirname, '__fixtures', 'static');
    let tempDir: string;

    beforeAll(async () => {
      tempDir = await mkdtemp('cache-test');
    });

    afterAll(async () => {
      if (tempDir) {
        await rm(tempDir, { recursive: true });
      }
    });

    test('registers routes with expected options', async () => {
      const { registerStaticDir } = await server.setup({ config$ });
      expect(createServer).toHaveBeenCalledTimes(1);
      const [{ value: myServer }] = (createServer as jest.Mock).mock.results;
      jest.spyOn(myServer, 'route');
      expect(myServer.route).toHaveBeenCalledTimes(0);
      registerStaticDir('/static/{path*}', assetFolder);
      expect(myServer.route).toHaveBeenCalledTimes(1);
      expect(myServer.route).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          options: {
            app: {
              access: 'public',
              excludeFromRateLimiter: true,
              security: {
                authz: {
                  enabled: false,
                  reason: 'Route serves static assets',
                },
              },
            },
            auth: false,
            cache: {
              privacy: 'public',
              otherwise: 'must-revalidate',
            },
          },
        })
      );
    });

    test('does not throw if called after stop', async () => {
      const { registerStaticDir } = await server.setup({ config$ });
      await server.stop();
      expect(() => {
        registerStaticDir('/path1/{path*}', '/path/to/resource');
      }).not.toThrow();
    });

    test('returns correct headers for static assets', async () => {
      const { registerStaticDir, server: innerServer } = await server.setup({ config$ });

      registerStaticDir('/static/{path*}', assetFolder);

      await server.start();
      const response = await supertest(innerServer.listener)
        .get('/static/some_json.json')
        .expect(200);

      expect(response.get('cache-control')).toEqual('must-revalidate');
      expect(response.get('etag')).not.toBeUndefined();
    });

    test('returns compressed version if present', async () => {
      const { registerStaticDir, server: innerServer } = await server.setup({ config$ });

      registerStaticDir('/static/{path*}', assetFolder);

      await server.start();
      const response = await supertest(innerServer.listener)
        .get('/static/compression_available.json')
        .set('accept-encoding', 'gzip')
        .expect(200);

      expect(response.get('cache-control')).toEqual('must-revalidate');
      expect(response.get('etag')).not.toBeUndefined();
      expect(response.get('content-encoding')).toEqual('gzip');
    });

    test('returns uncompressed version if compressed asset is not available', async () => {
      const { registerStaticDir, server: innerServer } = await server.setup({ config$ });

      registerStaticDir('/static/{path*}', assetFolder);

      await server.start();
      const response = await supertest(innerServer.listener)
        .get('/static/some_json.json')
        .set('accept-encoding', 'gzip')
        .expect(200);

      expect(response.get('cache-control')).toEqual('must-revalidate');
      expect(response.get('etag')).not.toBeUndefined();
      expect(response.get('content-encoding')).toBeUndefined();
    });

    test('returns a 304 if etag value matches', async () => {
      const { registerStaticDir, server: innerServer } = await server.setup({ config$ });

      registerStaticDir('/static/{path*}', assetFolder);

      await server.start();
      const response = await supertest(innerServer.listener)
        .get('/static/some_json.json')
        .expect(200);

      const etag = response.get('etag')!;
      expect(etag).not.toBeUndefined();

      await supertest(innerServer.listener)
        .get('/static/some_json.json')
        .set('If-None-Match', etag)
        .expect(304);
    });

    test('serves content if etag values does not match', async () => {
      const { registerStaticDir, server: innerServer } = await server.setup({ config$ });

      registerStaticDir('/static/{path*}', assetFolder);

      await server.start();

      await supertest(innerServer.listener)
        .get('/static/some_json.json')
        .set('If-None-Match', `"definitely not a valid etag"`)
        .expect(200);
    });

    test('dynamically updates depending on the content of the file', async () => {
      const tempFile = join(tempDir, 'some_file.json');

      const { registerStaticDir, server: innerServer } = await server.setup({ config$ });
      registerStaticDir('/static/{path*}', tempDir);

      await server.start();

      await supertest(innerServer.listener).get('/static/some_file.json').expect(404);

      await writeFile(tempFile, `{ "over": 9000 }`);

      let response = await supertest(innerServer.listener)
        .get('/static/some_file.json')
        .expect(200);

      const etag1 = response.get('etag');

      await writeFile(tempFile, `{ "over": 42 }`);

      response = await supertest(innerServer.listener).get('/static/some_file.json').expect(200);

      const etag2 = response.get('etag');

      expect(etag1).not.toEqual(etag2);
    });
  });

  describe('#registerOnPreRouting', () => {
    test('does not throw if called after stop', async () => {
      const { registerOnPreRouting } = await server.setup({ config$ });
      await server.stop();
      expect(() => {
        registerOnPreRouting((req, res) => res.unauthorized());
      }).not.toThrow();
    });
  });

  describe('#registerOnPreAuth', () => {
    test('does not throw if called after stop', async () => {
      const { registerOnPreAuth } = await server.setup({ config$ });
      await server.stop();
      expect(() => {
        registerOnPreAuth((req, res) => res.unauthorized());
      }).not.toThrow();
    });
  });

  describe('#registerOnPostAuth', () => {
    test('does not throw if called after stop', async () => {
      const { registerOnPostAuth } = await server.setup({ config$ });
      await server.stop();
      expect(() => {
        registerOnPostAuth((req, res) => res.unauthorized());
      }).not.toThrow();
    });
  });

  describe('#registerOnPreResponse', () => {
    test('does not throw if called after stop', async () => {
      const { registerOnPreResponse } = await server.setup({ config$ });
      await server.stop();
      expect(() => {
        registerOnPreResponse((req, res, t) => t.next());
      }).not.toThrow();
    });
  });

  describe('#registerAuth', () => {
    test('does not throw if called after stop', async () => {
      const { registerAuth } = await server.setup({ config$ });
      await server.stop();
      expect(() => {
        registerAuth((req, res) => res.unauthorized());
      }).not.toThrow();
    });
  });
});

describe('configuration change', () => {
  it('logs a warning in case of incompatible config change', async () => {
    const configSubject = new BehaviorSubject(configWithSSL);

    await server.setup({ config$: configSubject });
    await server.start();

    const nextConfig = {
      ...configWithSSL,
      ssl: {
        ...configWithSSL.ssl,
        getSecureOptions: () => 0,
        enabled: false,
      },
    } as HttpConfig;

    configSubject.next(nextConfig);

    expect(loggingService.get().warn).toHaveBeenCalledWith(
      'Incompatible TLS config change detected - TLS cannot be toggled without a full server reboot.'
    );
  });

  it('calls setTlsConfig and logs an info message when config changes', async () => {
    const configSubject = new BehaviorSubject(configWithSSL);

    const { server: innerServer } = await server.setup({ config$: configSubject });
    await server.start();

    const nextConfig = {
      ...configWithSSL,
      ssl: {
        ...configWithSSL.ssl,
        isEqualTo: () => false,
        getSecureOptions: () => 0,
      },
    } as HttpConfig;

    configSubject.next(nextConfig);

    expect(setTlsConfigMock).toHaveBeenCalledTimes(1);
    expect(setTlsConfigMock).toHaveBeenCalledWith(innerServer, nextConfig.ssl);

    expect(loggingService.get().info).toHaveBeenCalledWith(
      'TLS configuration change detected - reloading TLS configuration.'
    );
  });
});

test('exposes authentication details of incoming request to a route handler', async () => {
  const { registerRouter, registerAuth, server: innerServer } = await server.setup({ config$ });

  const router = new Router('', logger, enhanceWithContext, routerOptions);
  router.get(
    {
      path: '/',
      validate: false,
      security: {
        authc: { enabled: false, reason: 'test' },
        authz: { enabled: false, reason: 'test' },
      },
    },
    (context, req, res) => res.ok({ body: req.route })
  );
  router.get(
    {
      path: '/foo',
      validate: false,
      security: {
        authc: { enabled: 'optional' },
        authz: { enabled: false, reason: 'test' },
      },
    },
    (context, req, res) => res.ok({ body: req.route })
  );
  // mocking to have `authRegistered` filed set to true
  registerAuth((req, res) => res.unauthorized());
  registerRouter(router);

  await server.start();
  await supertest(innerServer.listener)
    .get('/')
    .expect(200, {
      method: 'get',
      path: '/',
      routePath: '/',
      options: {
        authRequired: false,
        xsrfRequired: false,
        access: 'internal',
        tags: [],
        timeout: {},
        security: {
          authc: { enabled: false, reason: 'test' },
          authz: { enabled: false, reason: 'test' },
        },
      },
    });
  await supertest(innerServer.listener)
    .get('/foo')
    .expect(200, {
      method: 'get',
      path: '/foo',
      routePath: '/foo',
      options: {
        authRequired: 'optional',
        xsrfRequired: false,
        access: 'internal',
        tags: [],
        timeout: {},
        security: {
          authc: { enabled: 'optional' },
          authz: { enabled: false, reason: 'test' },
        },
      },
    });
});
