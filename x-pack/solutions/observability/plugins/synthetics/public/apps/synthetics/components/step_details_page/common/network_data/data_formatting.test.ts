/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import moment from 'moment';
import {
  colourPalette,
  formatTooltipHeading,
  getConnectingTime,
  getSeriesAndDomain,
  getSidebarItems,
} from './data_formatting';
import {
  MimeType,
  FriendlyFlyoutLabels,
  FriendlyTimingLabels,
  Timings,
  Metadata,
  WaterfallTooltipItem,
} from './types';
import type { DateFormatter } from '../../../../../../hooks/use_date_format';
import { mockMoment } from '../../../../utils/formatting/test_helpers';
import { NetworkEvent } from '../../../../../../../common/runtime_types';

export const networkItems: NetworkEvent[] = [
  {
    timestamp: '2021-01-05T19:22:28.928Z',
    method: 'GET',
    url: 'https://unpkg.com/todomvc-app-css@2.0.4/index.css',
    status: 200,
    mimeType: 'text/css',
    requestSentTime: 18098833.175,
    loadEndTime: 18098957.145,
    timings: {
      connect: 81.10800000213203,
      wait: 34.577999998873565,
      receive: 0.5520000013348181,
      send: 0.3600000018195715,
      total: 123.97000000055414,
      proxy: -1,
      blocked: 0.8540000017092098,
      queueing: 2.263999998831423,
      ssl: 55.38700000033714,
      dns: 3.559999997378327,
    },
    resourceSize: 1000,
    transferSize: 1000,
    requestHeaders: {
      sample_request_header: 'sample request header',
    },
    responseHeaders: {
      sample_response_header: 'sample response header',
    },
    certificates: {
      issuer: 'Sample Issuer',
      validFrom: '2021-02-22T18:35:26.000Z',
      validTo: '2021-04-05T22:28:43.000Z',
      subjectName: '*.elastic.co',
    },
    ip: '104.18.8.22',
  },
  {
    timestamp: '2021-01-05T19:22:28.928Z',
    method: 'GET',
    url: 'https://unpkg.com/director@1.2.8/build/director.js',
    status: 200,
    mimeType: 'application/javascript',
    requestSentTime: 18098833.537,
    loadEndTime: 18098977.648000002,
    timings: {
      blocked: 84.54599999822676,
      receive: 3.068000001803739,
      queueing: 3.69700000010198,
      proxy: -1,
      total: 144.1110000014305,
      wait: 52.56100000042352,
      connect: -1,
      send: 0.2390000008745119,
      ssl: -1,
      dns: -1,
    },
  },
];

export const networkItemsWithoutFullTimings: NetworkEvent[] = [
  networkItems[0],
  {
    timestamp: '2021-01-05T19:22:28.928Z',
    method: 'GET',
    url: 'file:///Users/dominiqueclarke/dev/synthetics/examples/todos/app/app.js',
    status: 0,
    mimeType: 'text/javascript',
    requestSentTime: 18098834.097,
    loadEndTime: 18098836.889999997,
    timings: {
      total: 2.7929999996558763,
      blocked: -1,
      ssl: -1,
      wait: -1,
      connect: -1,
      dns: -1,
      queueing: -1,
      send: -1,
      proxy: -1,
      receive: -1,
    },
  },
];

export const networkItemsWithoutAnyTimings: NetworkEvent[] = [
  {
    timestamp: '2021-01-05T19:22:28.928Z',
    method: 'GET',
    url: 'file:///Users/dominiqueclarke/dev/synthetics/examples/todos/app/app.js',
    status: 0,
    mimeType: 'text/javascript',
    requestSentTime: 18098834.097,
    loadEndTime: 18098836.889999997,
    timings: {
      total: -1,
      blocked: -1,
      ssl: -1,
      wait: -1,
      connect: -1,
      dns: -1,
      queueing: -1,
      send: -1,
      proxy: -1,
      receive: -1,
    },
  },
];

export const networkItemsWithoutTimingsObject: NetworkEvent[] = [
  {
    timestamp: '2021-01-05T19:22:28.928Z',
    method: 'GET',
    url: 'file:///Users/dominiqueclarke/dev/synthetics/examples/todos/app/app.js',
    status: 0,
    mimeType: 'text/javascript',
    requestSentTime: 18098834.097,
    loadEndTime: 18098836.889999997,
  },
];

export const networkItemsWithUncommonMimeType: NetworkEvent[] = [
  {
    timestamp: '2021-01-05T19:22:28.928Z',
    method: 'GET',
    url: 'https://unpkg.com/director@1.2.8/build/director.js',
    status: 200,
    mimeType: 'application/x-javascript',
    requestSentTime: 18098833.537,
    loadEndTime: 18098977.648000002,
    timings: {
      blocked: 84.54599999822676,
      receive: 3.068000001803739,
      queueing: 3.69700000010198,
      proxy: -1,
      total: 144.1110000014305,
      wait: 52.56100000042352,
      connect: -1,
      send: 0.2390000008745119,
      ssl: -1,
      dns: -1,
    },
  },
];

export const networkItemsWithUnknownMimeType: NetworkEvent[] = [
  {
    timestamp: '2021-01-05T19:22:28.928Z',
    method: 'GET',
    url: 'https://unpkg.com/director@1.2.8/build/director.js',
    status: 200,
    mimeType: 'application/x-unknown',
    requestSentTime: 18098833.537,
    loadEndTime: 18098977.648000002,
    timings: {
      blocked: 84.54599999822676,
      receive: 3.068000001803739,
      queueing: 3.69700000010198,
      proxy: -1,
      total: 144.1110000014305,
      wait: 52.56100000042352,
      connect: -1,
      send: 0.2390000008745119,
      ssl: -1,
      dns: -1,
    },
  },
];

describe('getConnectingTime', () => {
  it('returns `connect` value if `ssl` is undefined', () => {
    expect(getConnectingTime(10)).toBe(10);
  });

  it('returns `undefined` if `connect` is not defined', () => {
    expect(getConnectingTime(undefined, 23)).toBeUndefined();
  });

  it('returns `connect` value if `ssl` is 0', () => {
    expect(getConnectingTime(10, 0)).toBe(10);
  });

  it('returns `connect` value if `ssl` is -1', () => {
    expect(getConnectingTime(10, 0)).toBe(10);
  });

  it('reduces `connect` value by `ssl` value if both are defined', () => {
    expect(getConnectingTime(10, 3)).toBe(7);
  });
});

describe('Palettes', () => {
  it('A colour palette comprising timing and mime type colours is correctly generated', () => {
    expect(colourPalette).toEqual({
      blocked: '#d3f6f5',
      connect: '#dfedff',
      dns: '#8be2e0',
      font: '#61a2ff',
      html: '#a6edea',
      image: '#ee72a6',
      media: '#ffc7db',
      other: '#f6726a',
      receive: '#ffe3ed',
      script: '#ffc9c2',
      send: '#feecc1',
      ssl: '#f7b9d3',
      stylesheet: '#bfdbff',
      wait: '#fcd883',
      xhr: '#16c5c0',
    });
  });
});

describe('getSeriesAndDomain', () => {
  let mockDateFormatter: DateFormatter;
  beforeEach(() => {
    mockMoment();
    mockDateFormatter = (dateStr?: string) => (dateStr ? moment(dateStr).format() : '');
  });

  it('formats series timings', () => {
    const actual = getSeriesAndDomain(networkItems, false, mockDateFormatter);
    expect(actual.series).toMatchInlineSnapshot(`
      Array [
        Object {
          "config": Object {
            "colour": "#d3f6f5",
            "id": 0,
            "isHighlighted": true,
          },
          "x": 0,
          "y": 0.8540000017092098,
          "y0": 0,
        },
        Object {
          "config": Object {
            "colour": "#8be2e0",
            "id": 0,
            "isHighlighted": true,
          },
          "x": 0,
          "y": 4.413999999087537,
          "y0": 0.8540000017092098,
        },
        Object {
          "config": Object {
            "colour": "#dfedff",
            "id": 0,
            "isHighlighted": true,
          },
          "x": 0,
          "y": 30.135000000882428,
          "y0": 4.413999999087537,
        },
        Object {
          "config": Object {
            "colour": "#f7b9d3",
            "id": 0,
            "isHighlighted": true,
          },
          "x": 0,
          "y": 85.52200000121957,
          "y0": 30.135000000882428,
        },
        Object {
          "config": Object {
            "colour": "#feecc1",
            "id": 0,
            "isHighlighted": true,
          },
          "x": 0,
          "y": 85.88200000303914,
          "y0": 85.52200000121957,
        },
        Object {
          "config": Object {
            "colour": "#fcd883",
            "id": 0,
            "isHighlighted": true,
          },
          "x": 0,
          "y": 120.4600000019127,
          "y0": 85.88200000303914,
        },
        Object {
          "config": Object {
            "colour": "#bfdbff",
            "id": 0,
            "isHighlighted": true,
          },
          "x": 0,
          "y": 121.01200000324752,
          "y0": 120.4600000019127,
        },
        Object {
          "config": Object {
            "colour": "#d3f6f5",
            "id": 1,
            "isHighlighted": true,
          },
          "x": 1,
          "y": 84.90799999795854,
          "y0": 0.3619999997317791,
        },
        Object {
          "config": Object {
            "colour": "#feecc1",
            "id": 1,
            "isHighlighted": true,
          },
          "x": 1,
          "y": 85.14699999883305,
          "y0": 84.90799999795854,
        },
        Object {
          "config": Object {
            "colour": "#fcd883",
            "id": 1,
            "isHighlighted": true,
          },
          "x": 1,
          "y": 137.70799999925657,
          "y0": 85.14699999883305,
        },
        Object {
          "config": Object {
            "colour": "#ffc9c2",
            "id": 1,
            "isHighlighted": true,
          },
          "x": 1,
          "y": 140.7760000010603,
          "y0": 137.70799999925657,
        },
      ]
    `);
  });

  it('handles series formatting when only total timing values are available', () => {
    const { series } = getSeriesAndDomain(networkItemsWithoutFullTimings, false, mockDateFormatter);
    expect(series).toMatchInlineSnapshot(`
      Array [
        Object {
          "config": Object {
            "colour": "#d3f6f5",
            "id": 0,
            "isHighlighted": true,
          },
          "x": 0,
          "y": 0.8540000017092098,
          "y0": 0,
        },
        Object {
          "config": Object {
            "colour": "#8be2e0",
            "id": 0,
            "isHighlighted": true,
          },
          "x": 0,
          "y": 4.413999999087537,
          "y0": 0.8540000017092098,
        },
        Object {
          "config": Object {
            "colour": "#dfedff",
            "id": 0,
            "isHighlighted": true,
          },
          "x": 0,
          "y": 30.135000000882428,
          "y0": 4.413999999087537,
        },
        Object {
          "config": Object {
            "colour": "#f7b9d3",
            "id": 0,
            "isHighlighted": true,
          },
          "x": 0,
          "y": 85.52200000121957,
          "y0": 30.135000000882428,
        },
        Object {
          "config": Object {
            "colour": "#feecc1",
            "id": 0,
            "isHighlighted": true,
          },
          "x": 0,
          "y": 85.88200000303914,
          "y0": 85.52200000121957,
        },
        Object {
          "config": Object {
            "colour": "#fcd883",
            "id": 0,
            "isHighlighted": true,
          },
          "x": 0,
          "y": 120.4600000019127,
          "y0": 85.88200000303914,
        },
        Object {
          "config": Object {
            "colour": "#bfdbff",
            "id": 0,
            "isHighlighted": true,
          },
          "x": 0,
          "y": 121.01200000324752,
          "y0": 120.4600000019127,
        },
        Object {
          "config": Object {
            "colour": "#ffc9c2",
            "isHighlighted": true,
          },
          "x": 1,
          "y": 3.714999998046551,
          "y0": 0.9219999983906746,
        },
      ]
    `);
  });

  it('handles series formatting when there is no timing information available', () => {
    const { series } = getSeriesAndDomain(networkItemsWithoutAnyTimings, false, mockDateFormatter);
    expect(series).toMatchInlineSnapshot(`
      Array [
        Object {
          "config": Object {
            "colour": "",
            "isHighlighted": true,
          },
          "x": 0,
          "y": 0,
          "y0": 0,
        },
      ]
    `);
  });

  it('handles formatting when there is no timing information available', () => {
    const actual = getSeriesAndDomain(networkItemsWithoutAnyTimings, false, mockDateFormatter);
    expect(actual).toMatchInlineSnapshot(`
      Object {
        "domain": Object {
          "max": 0,
          "min": 0,
        },
        "metadata": Array [
          Object {
            "certificates": undefined,
            "details": Array [
              Object {
                "name": "Status",
                "value": undefined,
              },
              Object {
                "name": "Content type",
                "value": "text/javascript",
              },
              Object {
                "name": "Request start",
                "value": "0.000 ms",
              },
              Object {
                "name": "DNS",
                "value": undefined,
              },
              Object {
                "name": "Connecting",
                "value": undefined,
              },
              Object {
                "name": "TLS",
                "value": undefined,
              },
              Object {
                "name": "Waiting (TTFB)",
                "value": undefined,
              },
              Object {
                "name": "Content downloading",
                "value": undefined,
              },
              Object {
                "name": "Resource size",
                "value": undefined,
              },
              Object {
                "name": "Transfer size",
                "value": undefined,
              },
              Object {
                "name": "IP",
                "value": undefined,
              },
            ],
            "networkItemTooltipProps": Array [],
            "requestHeaders": undefined,
            "responseHeaders": undefined,
            "showTooltip": false,
            "url": "file:///Users/dominiqueclarke/dev/synthetics/examples/todos/app/app.js",
            "x": 0,
          },
        ],
        "series": Array [
          Object {
            "config": Object {
              "colour": "",
              "isHighlighted": true,
            },
            "x": 0,
            "y": 0,
            "y0": 0,
          },
        ],
        "totalHighlightedRequests": 1,
      }
    `);
  });

  it('handles formatting when the timings object is undefined', () => {
    const { series } = getSeriesAndDomain(
      networkItemsWithoutTimingsObject,
      false,
      mockDateFormatter
    );
    expect(series).toMatchInlineSnapshot(`
      Array [
        Object {
          "config": Object {
            "isHighlighted": true,
            "showTooltip": false,
          },
          "x": 0,
          "y": 0,
          "y0": 0,
        },
      ]
    `);
  });

  it('handles formatting when mime type is not mapped to a specific mime type bucket', () => {
    const { metadata } = getSeriesAndDomain(
      networkItemsWithUnknownMimeType,
      false,
      mockDateFormatter
    );
    /* verify that raw mime type appears in the tooltip config and that
     * the colour is mapped to mime type other */
    const contentDownloadingConfigItem = metadata[0].networkItemTooltipProps.find(
      (item: WaterfallTooltipItem) => {
        return (
          item.value.includes('application/x-unknown') &&
          item.colour === colourPalette[MimeType.Other]
        );
      }
    );
    expect(contentDownloadingConfigItem).toBeDefined();
  });

  it.each([
    [FriendlyFlyoutLabels[Metadata.Status], '200'],
    [FriendlyFlyoutLabels[Metadata.MimeType], 'text/css'],
    [FriendlyFlyoutLabels[Metadata.RequestStart], '0.000 ms'],
    [FriendlyTimingLabels[Timings.Dns], '3.560 ms'],
    [FriendlyTimingLabels[Timings.Connect], '25.721 ms'],
    [FriendlyTimingLabels[Timings.Ssl], '55.387 ms'],
    [FriendlyTimingLabels[Timings.Wait], '34.578 ms'],
    [FriendlyTimingLabels[Timings.Receive], '0.552 ms'],
    [FriendlyFlyoutLabels[Metadata.TransferSize], '1.000 KB'],
    [FriendlyFlyoutLabels[Metadata.ResourceSize], '1.000 KB'],
    [FriendlyFlyoutLabels[Metadata.IP], '104.18.8.22'],
  ])('handles metadata details formatting', (name, value) => {
    const { metadata } = getSeriesAndDomain(networkItems, false, mockDateFormatter);
    const metadataEntry = metadata[0];
    expect(
      metadataEntry.details.find((item) => item.value === value && item.name === name)
    ).toBeDefined();
  });

  it('handles metadata headers formatting', () => {
    const { metadata } = getSeriesAndDomain(networkItems, false, mockDateFormatter);
    const metadataEntry = metadata[0];
    metadataEntry.requestHeaders?.forEach((header) => {
      expect(header).toEqual({ name: header.name, value: header.value });
    });
    metadataEntry.responseHeaders?.forEach((header) => {
      expect(header).toEqual({ name: header.name, value: header.value });
    });
  });

  it('handles certificate formatting', () => {
    const { metadata } = getSeriesAndDomain([networkItems[0]], false, mockDateFormatter);
    const metadataEntry = metadata[0];
    expect(metadataEntry.certificates).toEqual([
      { name: 'Issuer', value: networkItems[0].certificates?.issuer },
      { name: 'Valid from', value: moment(networkItems[0].certificates?.validFrom).format('L LT') },
      { name: 'Valid until', value: moment(networkItems[0].certificates?.validTo).format('L LT') },
      { name: 'Common name', value: networkItems[0].certificates?.subjectName },
    ]);
    metadataEntry.responseHeaders?.forEach((header) => {
      expect(header).toEqual({ name: header.name, value: header.value });
    });
  });
  it('counts the total number of highlighted items', () => {
    // only one CSS file in this array of network Items
    const actual = getSeriesAndDomain(networkItems, false, mockDateFormatter, '', ['stylesheet']);
    expect(actual.totalHighlightedRequests).toBe(1);
  });

  it('adds isHighlighted to waterfall entry when filter matches', () => {
    // only one CSS file in this array of network Items
    const { series } = getSeriesAndDomain(networkItems, false, mockDateFormatter, '', [
      'stylesheet',
    ]);
    series.forEach((item) => {
      if (item.x === 0) {
        expect(item.config.isHighlighted).toBe(true);
      } else {
        expect(item.config.isHighlighted).toBe(false);
      }
    });
  });

  it('adds isHighlighted to waterfall entry when query matches', () => {
    // only the second item matches this query
    const { series } = getSeriesAndDomain(networkItems, false, mockDateFormatter, 'director', []);
    series.forEach((item) => {
      if (item.x === 1) {
        expect(item.config.isHighlighted).toBe(true);
      } else {
        expect(item.config.isHighlighted).toBe(false);
      }
    });
  });
});

describe('getSidebarItems', () => {
  it('passes the item index offset by 1 to offsetIndex for visual display', () => {
    const actual = getSidebarItems(networkItems, false, '', []);
    expect(actual[0].offsetIndex).toBe(1);
  });
});

describe('formatTooltipHeading', () => {
  it('puts index and URL text together', () => {
    expect(formatTooltipHeading(1, 'http://www.elastic.co/')).toEqual('1. http://www.elastic.co/');
  });

  it('returns only the text if `index` is NaN', () => {
    expect(formatTooltipHeading(NaN, 'http://www.elastic.co/')).toEqual('http://www.elastic.co/');
  });
});
