import yaml
import sys

yaml.preserve_quotes = True

with open('lib/api-spec/openapi.yaml', 'r', encoding='utf-8') as f:
    spec = yaml.safe_load(f)

# Add tags
if 'tags' in spec:
    spec['tags'].append({'name': 'wallet', 'description': 'Wallet and Prepaid Cards'})

# Add paths
new_paths = {
    '/wallet/balance': {
        'get': {
            'operationId': 'getWalletBalance',
            'tags': ['wallet'],
            'summary': 'Get current wallet balance and recent transactions',
            'responses': {
                '200': {
                    'description': 'Wallet balance and transactions',
                    'content': {
                        'application/json': {
                            'schema': {
                                '$ref': '#/components/schemas/WalletBalanceResponse'
                            }
                        }
                    }
                }
            }
        }
    },
    '/prepaid-cards/redeem': {
        'post': {
            'operationId': 'redeemPrepaidCard',
            'tags': ['wallet'],
            'summary': 'Redeem a prepaid card',
            'requestBody': {
                'required': True,
                'content': {
                    'application/json': {
                        'schema': {
                            '$ref': '#/components/schemas/RedeemCardRequest'
                        }
                    }
                }
            },
            'responses': {
                '200': {
                    'description': 'Card redeemed successfully',
                    'content': {
                        'application/json': {
                            'schema': {
                                '$ref': '#/components/schemas/SuccessResponse'
                            }
                        }
                    }
                },
                '400': {
                    'description': 'Invalid or expired card',
                    'content': {
                        'application/json': {
                            'schema': {
                                '$ref': '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        }
    },
    '/prepaid-cards/generate': {
        'post': {
            'operationId': 'generatePrepaidCards',
            'tags': ['wallet'],
            'summary': 'Generate prepaid cards (admin only)',
            'requestBody': {
                'required': True,
                'content': {
                    'application/json': {
                        'schema': {
                            '$ref': '#/components/schemas/GenerateCardsRequest'
                        }
                    }
                }
            },
            'responses': {
                '201': {
                    'description': 'Cards generated successfully',
                    'content': {
                        'application/json': {
                            'schema': {
                                'type': 'array',
                                'items': {
                                    '$ref': '#/components/schemas/PrepaidCard'
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

spec['paths'].update(new_paths)

# Add schemas
new_schemas = {
    'WalletTransaction': {
        'type': 'object',
        'properties': {
            'id': {'type': 'integer'},
            'amount': {'type': 'string'},
            'type': {'type': 'string', 'enum': ['credit', 'debit']},
            'referenceType': {'type': 'string', 'nullable': True},
            'description': {'type': 'string', 'nullable': True},
            'createdAt': {'type': 'string', 'format': 'date-time'}
        },
        'required': ['id', 'amount', 'type', 'createdAt']
    },
    'WalletBalanceResponse': {
        'type': 'object',
        'properties': {
            'balance': {'type': 'string'},
            'transactions': {
                'type': 'array',
                'items': {'$ref': '#/components/schemas/WalletTransaction'}
            }
        },
        'required': ['balance', 'transactions']
    },
    'RedeemCardRequest': {
        'type': 'object',
        'properties': {
            'code': {'type': 'string'}
        },
        'required': ['code']
    },
    'GenerateCardsRequest': {
        'type': 'object',
        'properties': {
            'count': {'type': 'integer', 'minimum': 1},
            'value': {'type': 'number', 'minimum': 1}
        },
        'required': ['count', 'value']
    },
    'PrepaidCard': {
        'type': 'object',
        'properties': {
            'id': {'type': 'integer'},
            'code': {'type': 'string'},
            'value': {'type': 'string'},
            'status': {'type': 'string', 'enum': ['active', 'used', 'expired']},
            'createdAt': {'type': 'string', 'format': 'date-time'}
        },
        'required': ['id', 'code', 'value', 'status', 'createdAt']
    }
}

if 'components' not in spec:
    spec['components'] = {}
if 'schemas' not in spec['components']:
    spec['components']['schemas'] = {}

spec['components']['schemas'].update(new_schemas)

with open('lib/api-spec/openapi.yaml', 'w', encoding='utf-8') as f:
    yaml.dump(spec, f, sort_keys=False, default_flow_style=False)
