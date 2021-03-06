/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { mount, ReactWrapper } from 'enzyme';
import React from 'react';

import '../../mock/match_media';
import '../../mock/react_beautiful_dnd';
import { TestProviders } from '../../mock';

import { DraggableLegendItem, LegendItem } from './draggable_legend_item';

jest.mock('../../../common/lib/kibana');

jest.mock('@elastic/eui', () => {
  const original = jest.requireActual('@elastic/eui');
  return {
    ...original,
    // eslint-disable-next-line react/display-name
    EuiScreenReaderOnly: () => <></>,
  };
});

describe('DraggableLegendItem', () => {
  describe('rendering a regular (non "All others") legend item', () => {
    const legendItem: LegendItem = {
      color: '#1EA593',
      dataProviderId:
        'draggable-legend-item-3207fda7-d008-402a-86a0-8ad632081bad-event_dataset-flow',
      field: 'event.dataset',
      value: 'flow',
    };

    let wrapper: ReactWrapper;

    beforeEach(() => {
      wrapper = mount(
        <TestProviders>
          <DraggableLegendItem legendItem={legendItem} />
        </TestProviders>
      );
    });

    it('renders a colored circle with the expected legend item color', () => {
      expect(wrapper.find('[data-test-subj="legend-color"]').first().props().color).toEqual(
        legendItem.color
      );
    });

    it('renders draggable legend item text', () => {
      expect(
        wrapper.find(`[data-test-subj="legend-item-${legendItem.dataProviderId}"]`).first().text()
      ).toEqual(legendItem.value);
    });

    it('does NOT render a non-draggable "All others" legend item', () => {
      expect(wrapper.find(`[data-test-subj="all-others-legend-item"]`).exists()).toBe(false);
    });
  });

  describe('rendering an "All others" legend item', () => {
    const allOthersLegendItem: LegendItem = {
      color: '#F37020',
      dataProviderId:
        'draggable-legend-item-527adabe-8e1c-4a1f-965c-2f3d65dda9e1-event_dataset-All others',
      field: 'event.dataset',
      value: 'All others',
    };

    let wrapper: ReactWrapper;

    beforeEach(() => {
      wrapper = mount(
        <TestProviders>
          <DraggableLegendItem legendItem={allOthersLegendItem} />
        </TestProviders>
      );
    });

    it('renders a colored circle with the expected legend item color', () => {
      expect(wrapper.find('[data-test-subj="legend-color"]').first().props().color).toEqual(
        allOthersLegendItem.color
      );
    });

    it('does NOT render a draggable legend item', () => {
      expect(
        wrapper
          .find(`[data-test-subj="legend-item-${allOthersLegendItem.dataProviderId}"]`)
          .exists()
      ).toBe(false);
    });

    it('renders NON-draggable `All others` legend item text', () => {
      expect(wrapper.find(`[data-test-subj="all-others-legend-item"]`).first().text()).toEqual(
        allOthersLegendItem.value
      );
    });
  });

  it('does NOT render a colored circle when the legend item has no color', () => {
    const noColorLegendItem: LegendItem = {
      // no `color` attribute for this `LegendItem`!
      dataProviderId:
        'draggable-legend-item-3207fda7-d008-402a-86a0-8ad632081bad-event_dataset-flow',
      field: 'event.dataset',
      value: 'flow',
    };

    const wrapper = mount(
      <TestProviders>
        <DraggableLegendItem legendItem={noColorLegendItem} />
      </TestProviders>
    );

    expect(wrapper.find('[data-test-subj="legend-color"]').exists()).toBe(false);
  });
});
