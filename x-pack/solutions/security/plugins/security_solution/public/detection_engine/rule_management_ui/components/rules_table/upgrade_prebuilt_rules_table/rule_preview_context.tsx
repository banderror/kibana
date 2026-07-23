/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { invariant } from '@formatjs/intl-utils';
import useSet from 'react-use/lib/useSet';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import usePrevious from 'react-use/lib/usePrevious';

export interface RulePreviewContextType {
  /**
   * Sets the rule is being edited in the rule upgrade flyout
   */
  setFieldEditing: (fieldName: string) => void;

  /**
   * Sets the rule is not being edited in the rule upgrade flyout
   */
  setFieldReadonly: (fieldName: string) => void;

  /**
   * Returns whether the rule is being edited in the rule upgrade flyout
   */
  isEditingRule: boolean;

  /**
   * Whether the user has acknowledged that upgrading this rule would drop a legacy ("affected")
   * ML job it currently references (a potential detection-coverage gap). Used to gate the
   * upgrade for below-Enterprise users, who can only take the target version and therefore
   * acknowledge the coverage loss rather than resolve it.
   */
  isCoverageLossAcknowledged: boolean;

  /**
   * Sets whether the ML coverage-loss warning has been acknowledged for the rule in the flyout.
   */
  setCoverageLossAcknowledged: (acknowledged: boolean) => void;
}

const RulePreviewContext = createContext<RulePreviewContextType | null>(null);

interface RulePreviewContextProviderProps {
  children: React.ReactNode;
  ruleId: string | undefined;
}

export function RulePreviewContextProvider({ children, ruleId }: RulePreviewContextProviderProps) {
  const [editedFields, { add, remove, reset }] = useSet<string>();
  const [isCoverageLossAcknowledged, setCoverageLossAcknowledged] = useState(false);
  const prevRuleId = usePrevious(ruleId);

  useEffect(() => {
    if (ruleId !== prevRuleId) {
      reset();
      setCoverageLossAcknowledged(false);
    }
  }, [reset, ruleId, prevRuleId]);

  const isEditingRule = editedFields.size > 0;

  const contextValue: RulePreviewContextType = useMemo(
    () => ({
      isEditingRule,
      setFieldEditing: add,
      setFieldReadonly: remove,
      isCoverageLossAcknowledged,
      setCoverageLossAcknowledged,
    }),
    [isEditingRule, add, remove, isCoverageLossAcknowledged]
  );

  return <RulePreviewContext.Provider value={contextValue}>{children}</RulePreviewContext.Provider>;
}

export function useRulePreviewContext() {
  const context = useContext(RulePreviewContext);

  invariant(
    context !== null,
    'useRulePreviewContext must be used inside a RulePreviewContextProvider'
  );

  return context;
}
