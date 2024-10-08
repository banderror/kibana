/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { BehaviorSubject } from 'rxjs';
import type {
  RuntimeType,
  RuntimeField,
  SerializedFieldFormat,
  RuntimePrimitiveTypes,
  DataViewField,
} from '../../shared_imports';
import type { RuntimeFieldPainlessError } from '../../types';
import type { PreviewController } from './preview_controller';

export type DocumentSource = 'cluster' | 'custom';

export interface EsDocument {
  _id: string;
  _index: string;
  _source: {
    [key: string]: unknown;
  };
  fields: {
    [key: string]: unknown[];
  };
  [key: string]: unknown;
}

export type ScriptErrorCodes = 'PAINLESS_SCRIPT_ERROR' | 'PAINLESS_SYNTAX_ERROR';
export type FetchDocErrorCodes = 'DOC_NOT_FOUND' | 'ERR_FETCHING_DOC';

interface PreviewError {
  code: ScriptErrorCodes;
  error:
    | RuntimeFieldPainlessError
    | {
        reason?: string;
        [key: string]: unknown;
      };
}

export interface PreviewState {
  pinnedFields: Record<string, boolean>;
  isLoadingDocuments: boolean;
  customId: string | undefined;
  documents: EsDocument[];
  currentIdx: number;
  documentSource: DocumentSource;
  scriptEditorValidation: {
    isValidating: boolean;
    isValid: boolean;
    message: string | null;
  };
  /** Response from the Painless _execute API */
  previewResponse: {
    fields: FieldPreview[];
    error: PreviewError | null;
  };
  isFetchingDocument: boolean;
  fetchDocError: FetchDocError | null;
  customDocIdToLoad: string | null;
  /** Flag to indicate if we are calling the _execute API */
  isLoadingPreview: boolean;
  initialPreviewComplete: boolean;
  isPreviewAvailable: boolean;
  isPanelVisible: boolean;
  isSaving: boolean;
  concreteFields: Array<{ name: string; type: string }>;
  fieldMap: Record<string, DataViewField>;
}

export interface FetchDocError {
  code: FetchDocErrorCodes;
  error: {
    message?: string;
    reason?: string;
    [key: string]: unknown;
  };
}

export interface ClusterData {
  documents: EsDocument[];
  currentIdx: number;
}

// The parameters required to preview the field
export interface Params {
  name: string | null;
  index: string | null;
  type: RuntimeType | null;
  script: Required<RuntimeField>['script'] | null;
  format: SerializedFieldFormat | null;
  document: EsDocument | null;
  // used for composite subfields
  parentName: string | null;
}

export interface FieldPreview {
  key: string;
  value: unknown;
  formattedValue?: string;
  type?: string;
}

export interface FieldTypeInfo {
  name: string;
  type: string;
}

export enum ChangeType {
  UPSERT = 'upsert',
  DELETE = 'delete',
}
export interface Change {
  changeType: ChangeType;
  type?: RuntimePrimitiveTypes;
}

export type ChangeSet = Record<string, Change>;

export interface Context {
  controller: PreviewController;
  fieldPreview$: BehaviorSubject<FieldPreview[] | undefined>;
  fieldTypeInfo?: FieldTypeInfo[];
  params: {
    value: Params;
    update: (updated: Partial<Params>) => void;
  };
  validation: {
    setScriptEditorValidation: React.Dispatch<
      React.SetStateAction<{ isValid: boolean; isValidating: boolean; message: string | null }>
    >;
  };
}

export type PainlessExecuteContext =
  | 'boolean_field'
  | 'date_field'
  | 'double_field'
  | 'geo_point_field'
  | 'ip_field'
  | 'keyword_field'
  | 'long_field';

export interface FieldPreviewResponse {
  values: unknown[];
  error?: ScriptError;
}

export interface ScriptError {
  caused_by: {
    reason: string;
    [key: string]: unknown;
  };
  position?: {
    offset: number;
    start: number;
    end: number;
  };
  script_stack?: string[];
  [key: string]: unknown;
}
