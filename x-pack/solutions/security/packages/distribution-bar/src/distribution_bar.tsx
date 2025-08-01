/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { useMemo, useState } from 'react';
import { EuiFlexGroup, EuiBadge, useEuiTheme, EuiIcon, EuiFlexItem } from '@elastic/eui';
import numeral from '@elastic/numeral';
import { css } from '@emotion/react';

/** DistributionBar component props */
export interface DistributionBarProps {
  /** distribution data points */
  stats: Array<{
    key: string;
    count: number;
    color: string;
    label?: React.ReactNode;
    isCurrentFilter?: boolean;
    filter?: () => void;
    reset?: (event: React.MouseEvent<SVGElement, MouseEvent>) => void;
  }>;
  /** hide the label above the bar at first render */
  hideLastTooltip?: boolean;
  /** data-test-subj used for querying the component in tests */
  ['data-test-subj']?: string;
}

export interface EmptyBarProps {
  ['data-test-subj']?: string;
}

const useStyles = () => {
  const { euiTheme } = useEuiTheme();

  return {
    bar: css`
      gap: ${euiTheme.size.xxs};
      min-height: 7px; // for hovered bar to have enough space to grow
    `,
    part: {
      base: css`
        position: relative;
        border-radius: 2px;
        height: 5px;
        min-width: 10px; // prevents bar from shrinking too small
      `,
      empty: css`
        background-color: ${euiTheme.colors.lightShade};
        flex: 1;
      `,
      tick: css`
        &::after {
          content: '';
          opacity: 0;
          position: absolute;
          top: -10px;
          right: 0;
          width: 1px;
          height: 6px;
          background-color: ${euiTheme.colors.lightShade};
        }
      `,
      hover: css`
        &:hover {
          height: 7px;
          border-radius: 3px;

          .euiBadge {
            cursor: unset;
          }

          &::after {
            opacity: 1;
            transition: all 0.3s ease;
            top: -9px; // 10px - 1px to accommodate for height of hovered bar
          }

          transition: all 0.3s ease;
        }
      `,
      visibleTooltip: css`
        & > div {
          opacity: 1;
          top: calc(-${euiTheme.base + 2}px - 13px);
        }
        &::after {
          opacity: 1;
        }
      `,
    },
    tooltip: css`
      opacity: 0;
      position: absolute;
      width: 100%;
      height: calc(
        ${euiTheme.base + 2}px + 14px + 7px
      ); // 2px border of the badge + 14px height of the tick + 7px height of the bar
      text-align: right;
      top: calc(
        -${euiTheme.base + 2}px - 14px
      ); // 2px border of the badge + 14px height of the tick
      right: 0;

      &:hover {
        opacity: 1;
        top: calc(
          -${euiTheme.base + 2}px - 13px
        ); // 2px border of the badge + 14px height of the tick - 1px to accomodate for height of hovered bar
        transition: all 0.3s ease;
      }
    `,
    tooltipBadgeLeft: css`
      border-bottom-right-radius: 0;
      border-top-right-radius: 0;
    `,
    tooltipBadgeRight: css`
      border-left: none;
      border-bottom-left-radius: 0;
      border-top-left-radius: 0;
    `,
  };
};

const EmptyBar: React.FC<EmptyBarProps> = ({ 'data-test-subj': dataTestSubj }) => {
  const styles = useStyles();
  const emptyBarStyle = [styles.part.base, styles.part.empty];

  return <div css={emptyBarStyle} data-test-subj={`${dataTestSubj}`} />;
};

// Only show tooltip for segments thats hovered OR Set as Filter OR Last
const shouldShowTooltip = ({
  isHovered,
  isCurrentFilter,
  isLast,
  hasFilterActive,
  hideLastTooltip,
  isHoveringAnyStatsBar,
}: {
  isHovered: boolean;
  isCurrentFilter: boolean;
  isLast: boolean;
  hasFilterActive: boolean;
  hideLastTooltip?: boolean;
  isHoveringAnyStatsBar: boolean;
}) => {
  if (isHovered) return true;

  const shouldShowBecauseOfFilter = isCurrentFilter;
  const shouldShowBecauseItIsLast = isLast && !hideLastTooltip && !hasFilterActive;

  return !isHoveringAnyStatsBar && (shouldShowBecauseOfFilter || shouldShowBecauseItIsLast);
};

// TODO: fix tooltip direction if not enough space;
/**
 * Security Solution DistributionBar component.
 * Shows visual representation of distribution of stats, such as alerts by criticality or misconfiguration findings by evaluation result.
 */
export const DistributionBar: React.FC<DistributionBarProps> = React.memo(function DistributionBar(
  props
) {
  const styles = useStyles();
  const { stats, 'data-test-subj': dataTestSubj, hideLastTooltip } = props;

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const hasCurrentFilter = useMemo(() => stats.some((item) => item.isCurrentFilter), [stats]);

  const parts = stats.map((stat, index) => {
    const isLast = index === stats.length - 1;
    const isHovered = hoveredKey === stat.key;

    // Only show tooltip for segments thats hovered OR Set as Filter OR Last
    const isCurrentFilter = stat.isCurrentFilter ?? false;
    const showTooltip = shouldShowTooltip({
      isHovered,
      isCurrentFilter,
      isLast,
      hasFilterActive: hasCurrentFilter,
      hideLastTooltip,
      isHoveringAnyStatsBar: Boolean(hoveredKey),
    });

    const partStyle = [
      styles.part.base,
      styles.part.tick,
      styles.part.hover,
      css`
        background-color: ${stat.color};
        flex: ${stat.count};
      `,
    ];

    if (showTooltip) {
      partStyle.push(styles.part.visibleTooltip);
    }

    const prettyNumber = numeral(stat.count).format('0,0a');

    return (
      <div
        key={stat.key}
        css={partStyle}
        data-test-subj={`${dataTestSubj}__part`}
        onClick={stat.filter}
        onMouseEnter={() => setHoveredKey(stat.key)}
        onMouseLeave={() => setHoveredKey(null)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            stat.filter?.();
          }
        }}
        tabIndex={0}
        role="button"
      >
        <div css={[styles.tooltip, showTooltip && styles.part.visibleTooltip]}>
          <EuiFlexGroup gutterSize="none" justifyContent="flexEnd" wrap={false} responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow" css={styles.tooltipBadgeLeft}>
                {prettyNumber}
              </EuiBadge>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow" css={styles.tooltipBadgeRight}>
                <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiIcon type="dot" size="s" color={stat.color} />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>{stat.label ?? stat.key}</EuiFlexItem>
                  {stat.isCurrentFilter && stat.reset && (
                    <EuiFlexItem grow={false}>
                      <EuiIcon type="cross" size="m" onClick={stat.reset} />
                    </EuiFlexItem>
                  )}
                </EuiFlexGroup>
              </EuiBadge>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      </div>
    );
  });

  return (
    <EuiFlexGroup
      alignItems="center"
      css={styles.bar}
      data-test-subj={dataTestSubj}
      responsive={false}
    >
      {parts.length ? parts : <EmptyBar data-test-subj={`${dataTestSubj}__emptyBar`} />}
    </EuiFlexGroup>
  );
});
