/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { mount } from 'enzyme';
import React from 'react';

import { TestProviders } from '../../../../common/mock';
import { useInstalledSecurityJobs } from '../../../../common/components/ml/hooks/use_installed_security_jobs';
import { MlJobCompatibilityCallout } from '.';

jest.mock('../../../../common/components/ml/hooks/use_installed_security_jobs');

const mockUseInstalledSecurityJobs = useInstalledSecurityJobs as jest.Mock;

const CALLOUT = '[data-test-subj="callout-ml-job-compatibility"]';
const DISMISS_BUTTON = '[data-test-subj="callout-dismiss-btn"]';

const renderCallout = () =>
  mount(
    <TestProviders>
      <MlJobCompatibilityCallout />
    </TestProviders>
  );

describe('MlJobCompatibilityCallout', () => {
  afterEach(() => {
    // The timed dismissal persists to localStorage, so reset it between tests.
    localStorage.clear();
  });

  it('renders when new affected jobs are installed', () => {
    mockUseInstalledSecurityJobs.mockReturnValue({
      loading: false,
      jobs: [{ id: 'v2_linux_rare_metadata_process' }],
    });
    const wrapper = renderCallout();
    expect(wrapper.exists(CALLOUT)).toEqual(true);
  });

  it('renders when old affected jobs are installed', () => {
    mockUseInstalledSecurityJobs.mockReturnValue({
      loading: false,
      jobs: [{ id: 'linux_rare_metadata_process' }],
    });
    const wrapper = renderCallout();
    expect(wrapper.exists(CALLOUT)).toEqual(true);
  });

  it('does not render if no affected jobs are installed', () => {
    mockUseInstalledSecurityJobs.mockReturnValue({
      loading: false,
      jobs: [{ id: 'high_count_network_denies' }],
    });
    const wrapper = renderCallout();
    expect(wrapper.exists(CALLOUT)).toEqual(false);
  });

  it('does not render while jobs are loading', () => {
    mockUseInstalledSecurityJobs.mockReturnValue({
      loading: true,
      jobs: [],
    });
    const wrapper = renderCallout();
    expect(wrapper.exists(CALLOUT)).toEqual(false);
  });

  it('hides the callout after it is dismissed', () => {
    mockUseInstalledSecurityJobs.mockReturnValue({
      loading: false,
      jobs: [{ id: 'v2_linux_rare_metadata_process' }],
    });
    const wrapper = renderCallout();
    expect(wrapper.exists(CALLOUT)).toEqual(true);

    wrapper.find(DISMISS_BUTTON).hostNodes().simulate('click');
    wrapper.update();

    expect(wrapper.exists(CALLOUT)).toEqual(false);
  });

  it('keeps the callout hidden within the dismissal window for the same set of jobs', () => {
    mockUseInstalledSecurityJobs.mockReturnValue({
      loading: false,
      jobs: [{ id: 'v2_linux_rare_metadata_process' }],
    });
    const first = renderCallout();
    first.find(DISMISS_BUTTON).hostNodes().simulate('click');
    first.unmount();

    const second = renderCallout();
    expect(second.exists(CALLOUT)).toEqual(false);
  });

  it('re-surfaces the callout when the set of affected jobs changes', () => {
    mockUseInstalledSecurityJobs.mockReturnValue({
      loading: false,
      jobs: [{ id: 'v2_linux_rare_metadata_process' }],
    });
    const first = renderCallout();
    first.find(DISMISS_BUTTON).hostNodes().simulate('click');
    first.unmount();

    mockUseInstalledSecurityJobs.mockReturnValue({
      loading: false,
      jobs: [{ id: 'linux_rare_metadata_process' }],
    });
    const second = renderCallout();
    expect(second.exists(CALLOUT)).toEqual(true);
  });
});
