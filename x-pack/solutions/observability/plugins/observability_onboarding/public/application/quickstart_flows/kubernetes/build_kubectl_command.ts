/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ElasticAgentVersionInfo } from '../../../../common/types';

interface Params {
  encodedApiKey: string;
  onboardingId: string;
  elasticsearchUrl: string;
  elasticAgentVersionInfo: ElasticAgentVersionInfo;
}

const KUSTOMIZE_TEMPLATE_URL =
  'https://github.com/elastic/elastic-agent/deploy/kubernetes/elastic-agent-kustomize/default/elastic-agent-standalone';

export function buildKubectlCommand({
  encodedApiKey,
  onboardingId,
  elasticsearchUrl,
  elasticAgentVersionInfo,
}: Params) {
  const escapedElasticsearchUrl = elasticsearchUrl.replace(/\//g, '\\/');

  return `
    kubectl kustomize ${KUSTOMIZE_TEMPLATE_URL}\\?ref\\=v${elasticAgentVersionInfo.agentBaseVersion}
      | sed -e 's/JUFQSV9LRVkl/${encodedApiKey}/g'
            -e "s/%ES_HOST%/${escapedElasticsearchUrl}/g"
            -e "s/%ONBOARDING_ID%/${onboardingId}/g"
            -e "s/\\(docker.elastic.co\\/beats\\/elastic-agent\:\\).*$/\\1${elasticAgentVersionInfo.agentDockerImageVersion}/g"
            -e  "/{CA_TRUSTED}/c\\ "
      |  kubectl apply -f-
  `
    .trim()
    .replace(/\n/g, ' ')
    .replace(/\s\s+/g, ' ');
}
