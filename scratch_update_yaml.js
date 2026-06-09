const fs = require('fs');
const yaml = require('js-yaml');

try {
  const fileContents = fs.readFileSync('lib/api-spec/openapi.yaml', 'utf8');
  const spec = yaml.load(fileContents);

  if (!spec.tags) spec.tags = [];
  if (!spec.tags.find(t => t.name === 'wallet')) {
    spec.tags.push({ name: 'wallet', description: 'Wallet and Prepaid Cards' });
  }

  const newPaths = {
    '/wallet/balance': {
      get: {
        operationId: 'getWalletBalance',
        tags: ['wallet'],
        summary: 'Get current wallet balance and recent transactions',
        responses: {
          '200': {
            description: 'Wallet balance and transactions',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WalletBalanceResponse' }
              }
            }
          }
        }
      }
    },
    '/prepaid-cards/redeem': {
      post: {
        operationId: 'redeemPrepaidCard',
        tags: ['wallet'],
        summary: 'Redeem a prepaid card',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RedeemCardRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Card redeemed successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          '400': {
            description: 'Invalid or expired card',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/prepaid-cards/generate': {
      post: {
        operationId: 'generatePrepaidCards',
        tags: ['wallet'],
        summary: 'Generate prepaid cards (admin only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GenerateCardsRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Cards generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/PrepaidCard' }
                }
              }
            }
          }
        }
      }
    }
  };

  spec.paths = { ...spec.paths, ...newPaths };

  const newSchemas = {
    WalletTransaction: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        amount: { type: 'string' },
        type: { type: 'string', enum: ['credit', 'debit'] },
        referenceType: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' }
      },
      required: ['id', 'amount', 'type', 'createdAt']
    },
    WalletBalanceResponse: {
      type: 'object',
      properties: {
        balance: { type: 'string' },
        transactions: {
          type: 'array',
          items: { $ref: '#/components/schemas/WalletTransaction' }
        }
      },
      required: ['balance', 'transactions']
    },
    RedeemCardRequest: {
      type: 'object',
      properties: {
        code: { type: 'string' }
      },
      required: ['code']
    },
    GenerateCardsRequest: {
      type: 'object',
      properties: {
        count: { type: 'integer', minimum: 1 },
        value: { type: 'number', minimum: 1 }
      },
      required: ['count', 'value']
    },
    PrepaidCard: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        code: { type: 'string' },
        value: { type: 'string' },
        status: { type: 'string', enum: ['active', 'used', 'expired'] },
        createdAt: { type: 'string', format: 'date-time' }
      },
      required: ['id', 'code', 'value', 'status', 'createdAt']
    }
  };

  if (!spec.components) spec.components = {};
  if (!spec.components.schemas) spec.components.schemas = {};

  spec.components.schemas = { ...spec.components.schemas, ...newSchemas };

  const newYaml = yaml.dump(spec, { noRefs: true, lineWidth: -1 });
  fs.writeFileSync('lib/api-spec/openapi.yaml', newYaml, 'utf8');
  console.log('YAML updated successfully');
} catch (e) {
  console.log(e);
}
