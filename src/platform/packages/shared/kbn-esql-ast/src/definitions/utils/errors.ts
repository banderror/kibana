/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { i18n } from '@kbn/i18n';
import type {
  ESQLColumn,
  ESQLCommand,
  ESQLFunction,
  ESQLLocation,
  ESQLMessage,
  ESQLSource,
  ESQLIdentifier,
} from '../../types';
import type { ErrorTypes, ErrorValues } from '../types';

function getMessageAndTypeFromId<K extends ErrorTypes>({
  messageId,
  values,
}: {
  messageId: K;
  values: ErrorValues<K>;
}): { message: string; type?: 'error' | 'warning' } {
  // Use a less strict type instead of doing a typecast on each message type
  const out = values as unknown as Record<string, string>;
  // i18n validation wants to the values prop to be declared inline, so need to unpack and redeclare again all props
  switch (messageId) {
    case 'wrongArgumentType':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.wrongArgumentType', {
          defaultMessage:
            'Argument of [{name}] must be [{argType}], found value [{value}] type [{givenType}]',
          values: {
            name: out.name,
            argType: out.argType,
            value: out.value,
            givenType: out.givenType,
          },
        }),
      };
    case 'unknownColumn':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.unknownColumn', {
          defaultMessage: 'Unknown column [{name}]',
          values: { name: out.name },
        }),
      };
    case 'unknownIndex':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.unknownIndex', {
          defaultMessage: 'Unknown index [{name}]',
          values: { name: out.name },
        }),
      };
    case 'unknownFunction':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.missingFunction', {
          defaultMessage: 'Unknown function [{name}]',
          values: { name: out.name },
        }),
      };
    case 'wrongArgumentNumber':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.wrongArgumentExactNumber', {
          defaultMessage:
            'Error: [{fn}] function expects exactly {numArgs, plural, one {one argument} other {{numArgs} arguments}}, got {passedArgs}.',
          values: {
            fn: out.fn,
            numArgs: out.numArgs,
            passedArgs: out.passedArgs,
          },
        }),
      };
    case 'wrongArgumentNumberTooMany':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.wrongArgumentTooManyNumber', {
          defaultMessage:
            'Error: [{fn}] function expects {extraArgs, plural, =0 {} other {no more than }}{numArgs, plural, one {one argument} other {{numArgs} arguments}}, got {passedArgs}.',
          values: {
            fn: out.fn,
            numArgs: out.numArgs,
            passedArgs: out.passedArgs,
            extraArgs: out.extraArgs,
          },
        }),
      };
    case 'wrongArgumentNumberTooFew':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.wrongArgumentTooFewNumber', {
          defaultMessage:
            'Error: [{fn}] function expects {missingArgs, plural, =0 {} other {at least }}{numArgs, plural, one {one argument} other {{numArgs} arguments}}, got {passedArgs}.',
          values: {
            fn: out.fn,
            numArgs: out.numArgs,
            passedArgs: out.passedArgs,
            missingArgs: out.missingArgs,
          },
        }),
      };
    case 'noNestedArgumentSupport':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.noNestedArgumentSupport', {
          defaultMessage:
            "Aggregate function's parameters must be an attribute, literal or a non-aggregation function; found [{name}] of type [{argType}]",
          values: { name: out.name, argType: out.argType },
        }),
      };
    case 'unsupportedColumnTypeForCommand':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.unsupportedColumnTypeForCommand', {
          defaultMessage:
            '{command} only supports values of type [{type}]. Found [{column}] of type [{givenType}]',
          values: {
            command: out.command,
            type: out.type,
            column: out.column,
            givenType: out.givenType,
          },
        }),
      };
    case 'unknownDissectKeyword':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.unknownDissectKeyword', {
          defaultMessage: 'Expected [APPEND_SEPARATOR] in [DISSECT] but found [{keyword}]',
          values: {
            keyword: out.keyword,
          },
        }),
      };
    case 'unsupportedFunctionForCommand':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.unsupportedFunctionForCommand', {
          defaultMessage: '{command} does not support function {name}',
          values: {
            command: out.command,
            name: out.name,
          },
        }),
      };
    case 'unsupportedFunctionForCommandOption':
      return {
        message: i18n.translate(
          'kbn-esql-ast.esql.validation.unsupportedFunctionforCommandOption',
          {
            defaultMessage: '{command} {option} does not support function {name}',
            values: {
              command: out.command,
              option: out.option,
              name: out.name,
            },
          }
        ),
      };
    case 'fnUnsupportedAfterCommand':
      return {
        type: 'error',
        message: i18n.translate('kbn-esql-ast.esql.validation.fnUnsupportedAfterCommand', {
          defaultMessage: '[{function}] function cannot be used after {command}',
          values: {
            function: out.function,
            command: out.command,
          },
        }),
      };

    case 'unknownInterval':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.unknownInterval', {
          defaultMessage: `Unexpected time interval qualifier: ''{value}''`,
          values: {
            value: out.value,
          },
        }),
      };
    case 'unsupportedTypeForCommand':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.unsupportedTypeForCommand', {
          defaultMessage: '{command} does not support [{type}] in expression [{value}]',
          values: {
            command: out.command,
            type: out.type,
            value: out.value,
          },
        }),
      };
    case 'unknownPolicy':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.unknownPolicy', {
          defaultMessage: 'Unknown policy [{name}]',
          values: {
            name: out.name,
          },
        }),
      };
    case 'unknownAggregateFunction':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.unknowAggregateFunction', {
          defaultMessage:
            'Expected an aggregate function or group but got [{value}] of type [{type}]',
          values: {
            type: out.type,
            value: out.value,
          },
        }),
      };
    case 'unsupportedFieldType':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.unsupportedFieldType', {
          defaultMessage:
            'Field [{field}] cannot be retrieved, it is unsupported or not indexed; returning null',
          values: {
            field: out.field,
          },
        }),
        type: 'warning',
      };
    case 'unsupportedMode':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.unsupportedSettingValue', {
          defaultMessage:
            'Unrecognized value [{value}] for {command}, mode needs to be one of [{expected}]',
          values: {
            expected: out.expected,
            value: out.value,
            command: out.command,
          },
        }),
        type: 'error',
      };
    case 'unsupportedLiteralOption':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.unsupportedLiteralOption', {
          defaultMessage:
            'Invalid option [{value}] for {name}. Supported options: [{supportedOptions}].',
          values: {
            name: out.name,
            value: out.value,
            supportedOptions: out.supportedOptions,
          },
        }),
        type: 'warning',
      };
    case 'expectedConstant':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.expectedConstantValue', {
          defaultMessage: 'Argument of [{fn}] must be a constant, received [{given}]',
          values: {
            given: out.given,
            fn: out.fn,
          },
        }),
        type: 'error',
      };
    case 'metadataBracketsDeprecation':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.metadataBracketsDeprecation', {
          defaultMessage: "Square brackets '[]' need to be removed from FROM METADATA declaration",
        }),
        type: 'warning',
      };
    case 'unknownMetadataField':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.wrongMetadataArgumentType', {
          defaultMessage:
            'Metadata field [{value}] is not available. Available metadata fields are: [{availableFields}]',
          values: {
            value: out.value,
            availableFields: out.availableFields,
          },
        }),
        type: 'error',
      };
    case 'wrongDissectOptionArgumentType':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.wrongDissectOptionArgumentType', {
          defaultMessage:
            'Invalid value for DISSECT APPEND_SEPARATOR: expected a string, but was [{value}]',
          values: {
            value: out.value,
          },
        }),
        type: 'error',
      };
    case 'noAggFunction':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.noAggFunction', {
          defaultMessage:
            'At least one aggregation function required in [{command}], found [{expression}]',
          values: {
            command: out.commandName.toUpperCase(),
            expression: out.expression,
          },
        }),
        type: 'error',
      };
    case 'expressionNotAggClosed':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.expressionNotAggClosed', {
          defaultMessage:
            'Cannot combine aggregation and non-aggregation values in [{command}], found [{expression}]',
          values: {
            command: out.commandName.toUpperCase(),
            expression: out.expression,
          },
        }),
        type: 'error',
      };
    case 'aggInAggFunction':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.aggInAggFunction', {
          defaultMessage:
            'The aggregation function [{nestedAgg}] cannot be used as an argument in another aggregation function',
          values: {
            nestedAgg: out.nestedAgg,
          },
        }),
      };
    case 'onlyWhereCommandSupported':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.onlyWhereCommandSupported', {
          defaultMessage: '[{fn}] function is only supported in WHERE commands',
          values: { fn: out.fn.toUpperCase() },
        }),
      };
    case 'invalidJoinIndex':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.invalidJoinIndex', {
          defaultMessage:
            '[{identifier}] index is not a valid JOIN index.' +
            ' Please use a "lookup" mode index JOIN commands.',
          values: { identifier: out.identifier },
        }),
      };
    case 'tooManyForks':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.tooManyForks', {
          defaultMessage: '[FORK] a query cannot have more than one FORK command.',
        }),
      };
    case 'licenseRequired':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.licenseRequired', {
          defaultMessage: '{name} requires a {requiredLicense} license.',
          values: {
            name: out.name,
            requiredLicense: out.requiredLicense,
          },
        }),
      };
    case 'licenseRequiredForSignature':
      return {
        message: i18n.translate('kbn-esql-ast.esql.validation.licenseRequiredForSignature', {
          defaultMessage:
            '{name} with {signatureDescription} requires a {requiredLicense} license.',
          values: {
            name: out.name,
            signatureDescription: out.signatureDescription,
            requiredLicense: out.requiredLicense,
          },
        }),
      };
  }
  return { message: '' };
}

export function getMessageFromId<K extends ErrorTypes>({
  locations,
  ...payload
}: {
  messageId: K;
  values: ErrorValues<K>;
  locations: ESQLLocation;
}): ESQLMessage {
  const { message, type = 'error' } = getMessageAndTypeFromId(payload);
  return createMessage(type, message, locations, payload.messageId);
}

export function createMessage(
  type: 'error' | 'warning',
  message: string,
  location: ESQLLocation,
  messageId: string
): ESQLMessage {
  return {
    type,
    text: message,
    location,
    code: messageId,
  };
}

const createError = (messageId: string, location: ESQLLocation, message: string = '') =>
  createMessage('error', message, location, messageId);

export const errors = {
  unexpected: (
    location: ESQLLocation,
    message: string = i18n.translate('kbn-esql-ast.esql.validation.errors.unexpected.message', {
      defaultMessage: 'Unexpected error, this should never happen.',
    })
  ): ESQLMessage => {
    return createError('unexpected', location, message);
  },

  byId: <K extends ErrorTypes>(
    id: K,
    location: ESQLLocation,
    values: ErrorValues<K>
  ): ESQLMessage =>
    getMessageFromId({
      messageId: id,
      values,
      locations: location,
    }),

  unknownFunction: (fn: ESQLFunction): ESQLMessage =>
    errors.byId('unknownFunction', fn.location, fn),

  unknownColumn: (column: ESQLColumn | ESQLIdentifier): ESQLMessage =>
    errors.byId('unknownColumn', column.location, {
      name: column.name,
    }),

  tooManyForks: (command: ESQLCommand): ESQLMessage =>
    errors.byId('tooManyForks', command.location, {}),

  noAggFunction: (cmd: ESQLCommand, fn: ESQLFunction): ESQLMessage =>
    errors.byId('noAggFunction', fn.location, {
      commandName: cmd.name,
      expression: fn.text,
    }),

  expressionNotAggClosed: (cmd: ESQLCommand, fn: ESQLFunction): ESQLMessage =>
    errors.byId('expressionNotAggClosed', fn.location, {
      commandName: cmd.name,
      expression: fn.text,
    }),

  unknownAggFunction: (
    node: ESQLColumn | ESQLIdentifier,
    type: string = 'FieldAttribute'
  ): ESQLMessage =>
    errors.byId('unknownAggregateFunction', node.location, {
      value: node.name,
      type,
    }),

  aggInAggFunction: (fn: ESQLFunction): ESQLMessage =>
    errors.byId('aggInAggFunction', fn.location, {
      nestedAgg: fn.name,
    }),

  invalidJoinIndex: (identifier: ESQLSource): ESQLMessage =>
    errors.byId('invalidJoinIndex', identifier.location, {
      identifier: identifier.name,
    }),
};
