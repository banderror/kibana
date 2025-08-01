---
mapped_pages:
  - https://www.elastic.co/guide/en/kibana/current/advanced-options.html
---

# Advanced settings [advanced-options]

**Advanced Settings** control the behavior of {{kib}}. You can change the settings that apply to a specific space only, or to all of {{kib}}. For example, you can change the format used to display dates, specify the default data view, and apply your own branding.

::::{warning}
Changing a setting can affect {{kib}} performance and cause problems that are difficult to diagnose. Setting a property value to a blank field reverts to the default behavior, which might not be compatible with other configuration settings. Deleting a custom setting permanently removes it from {{kib}}.
::::



## Required permissions [_required_permissions_9]

The `Advanced Settings` {{kib}} privilege is required to access **Advanced Settings**.

When you have insufficient privileges to edit advanced settings, the edit options are not visible, and the following indicator is displayed:

% TO DO: Use `:class: screenshot`
![Example of Advanced Settings Management's read only access indicator in Kibana's header](images/settings-read-only-badge.png)

To add the privilege, go to the **Roles** management page using the navigation menu or the [global search field](docs-content://get-started/the-stack.md#kibana-navigation-search).

For more information on granting access to {{kib}}, refer to [Granting access to {{kib}}](docs-content://deploy-manage/users-roles/cluster-or-deployment-auth/built-in-roles.md).


## Change the space-specific setting [kibana-settings-reference]

Change the settings that apply only to a speific {{kib}} space.

1. Go to the **Advanced settings** page using the navigation menu or the [global search field](docs-content://get-started/the-stack.md#kibana-navigation-search).
2. Click **Space Settings**.
3. Scroll or search for the setting.
4. Make your change, then click **Save changes**.


### General [kibana-general-settings]

$$$auto-complete-use-time-tange$$$`autocomplete:useTimeRange`
:   When disabled, autocompletes the suggestions from your data set instead of the time range.

$$$bfetch-disable$$$`bfetch:disable`
:   :::{admonition} Deprecated in 8.15.0
    This setting was deprecated in 8.15.0.
    :::

    When disabled, search requests from Kibana will be made in individual HTTP requests rather than bundled together.

$$$bfetch-disable-compression$$$`bfetch:disableCompression`
:   :::{admonition} Deprecated in 8.15.0
    This setting was deprecated in 8.15.0.
    :::

    When disabled, allows you to debug individual requests, but increases the response size.

$$$csv-quotevalues$$$`csv:quoteValues`
:   Set this property to `true` to quote exported values.

$$$csv-separator$$$`csv:separator`
:   A string that serves as the separator for exported values.

$$$data_views-fields_excluded_data_tiers$$$`data_views:fields_excluded_data_tiers`
:   Allows the exclusion of listed data tiers when getting a field list for faster performance.

$$$dateformat$$$`dateFormat`
:   The format to use for displaying [pretty formatted dates](https://momentjs.com/docs/#/displaying/format/).

$$$dateformat-dow$$$`dateFormat:dow`
:   The day that a week should start on.

$$$dateformat-scaled$$$`dateFormat:scaled`
:   The values that define the format to use to render ordered time-based data. Formatted timestamps must adapt to the interval between measurements. Keys are [ISO8601 intervals](http://en.wikipedia.org/wiki/ISO_8601#Time_intervals).

$$$dateformat-tz$$$`dateFormat:tz`
:   The timezone that Kibana uses. The default value of `Browser` uses the timezone detected by the browser.

$$$datenanosformat$$$`dateNanosFormat`
:   The format to use for displaying [pretty formatted dates](https://momentjs.com/docs/#/displaying/format/) of [Elasticsearch date_nanos type](elasticsearch://reference/elasticsearch/mapping-reference/date_nanos.md).

$$$defaultindex$$$`defaultIndex`
:   The index to access if no index is set. The default is `null`.

$$$defaultroute$$$`defaultRoute`
:   The default route when opening Kibana. Use this setting to route users to a specific dashboard, application, or saved object as they enter each space.

$$$fields-popularlimit$$$`fields:popularLimit`
:   The top N most popular fields to show.

$$$fileupload-maxfilesize$$$`fileUpload:maxFileSize`
:   Sets the file size limit when importing files. The default value is `100MB`. The highest supported value for this setting is `1GB`.

$$$filtereditor-suggestvalues$$$`filterEditor:suggestValues`
:   Set this property to `false` to prevent the filter editor and KQL autocomplete from suggesting values for fields.

$$$autocomplete-valuesuggestionmethod$$$`autocomplete:valueSuggestionMethod`
:   When set to `terms_enum`, autocomplete uses the terms enum API for value suggestions. Kibana returns results faster, but suggestions are approximate, sorted alphabetically, and can be outside the selected time range. (Note that this API is incompatible with [Document-Level-Security](docs-content://deploy-manage/users-roles/cluster-or-deployment-auth/controlling-access-at-document-field-level.md).) When set to `terms_agg`, Kibana uses a terms aggregation for value suggestions, which is slower, but suggestions include all values that optionally match your time range and are sorted by popularity.

$$$autocomplete-usetimerange$$$`autocomplete:useTimeRange`
:   Disable this property to get autocomplete suggestions from your full dataset, rather than from the current time range.

$$$filters-pinnedbydefault$$$`filters:pinnedByDefault`
:   Set this property to `true` to make filters have a global state (be pinned) by default.

$$$format-bytes-defaultpattern$$$`format:bytes:defaultPattern`
:   The default [numeral pattern](docs-content://explore-analyze/numeral-formatting.md) format for the "bytes" format.

$$$format-currency-defaultpattern$$$`format:currency:defaultPattern`
:   The default [numeral pattern](docs-content://explore-analyze/numeral-formatting.md) format for the "currency" format.

$$$format-defaulttypemap$$$`format:defaultTypeMap`
:   A map of the default format name for each field type. Field types that are not explicitly mentioned use "_default_".

$$$format-number-defaultlocale$$$`format:number:defaultLocale`
:   The [numeral pattern](docs-content://explore-analyze/numeral-formatting.md) locale.

$$$format-number-defaultpattern$$$`format:number:defaultPattern`
:   The [numeral pattern](docs-content://explore-analyze/numeral-formatting.md) for the "number" format.

$$$format-percent-defaultpattern$$$`format:percent:defaultPattern`
:   The [numeral pattern](docs-content://explore-analyze/numeral-formatting.md) for the "percent" format.

$$$histogram-bartarget$$$`histogram:barTarget`
:   When date histograms use the `auto` interval, Kibana attempts to generate this number of bars.

$$$histogram-maxbars$$$`histogram:maxBars`
:   To improve performance, limits the density of date and number histograms across {{kib}} using a test query. When the test query contains too many buckets, the interval between buckets increases. This setting applies separately to each histogram aggregation, and does not apply to other types of aggregations. To find the maximum value of this setting, divide the {{es}} `search.max_buckets` value by the maximum number of aggregations in each visualization.

$$$history-limit$$$`history:limit`
:   In fields that have history, such as query inputs, show this many recent values.

$$$metafields$$$`metaFields`
:   Fields that exist outside of `_source`. Kibana merges these fields into the document when displaying it.

$$$metrics:allowStringIndices$$$`metrics:allowStringIndices`
:   Enables you to use {{es}} indices in **TSVB** visualizations.

$$$metrics-maxbuckets$$$`metrics:max_buckets`
:   Affects the **TSVB** histogram density. Must be set higher than `histogram:maxBars`.

$$$query-allowleadingwildcards$$$`query:allowLeadingWildcards`
:   Allows a wildcard (*) as the first character in a query clause. To disallow leading wildcards in Lucene queries, use `query:queryString:options`.

$$$query-querystring-options$$$`query:queryString:options`
:   Options for the Lucene query string parser. Only used when "Query language" is set to Lucene.

$$$savedobjects-listinglimit$$$`savedObjects:listingLimit`
:   The number of objects to fetch for lists of saved objects. The default value is 1000. Do not set above 10000.

$$$savedobjects-perpage$$$`savedObjects:perPage`
:   The number of objects to show on each page of the list of saved objects. The default is 5.

$$$search-querylanguage$$$`search:queryLanguage`
:   The query language to use in the query bar. Choices are [KQL](elasticsearch://reference/query-languages/kql.md), a language built specifically for {{kib}}, and the [Lucene query syntax](docs-content://explore-analyze/query-filter/languages/lucene-query-syntax.md).

$$$shortdots-enable$$$`shortDots:enable`
:   Set this property to `true` to shorten long field names in visualizations. For example, show `f.b.baz` instead of `foo.bar.baz`.

$$$sort-options$$$`sort:options`
:   Options for the Elasticsearch [sort](elasticsearch://reference/elasticsearch/rest-apis/sort-search-results.md) parameter.

$$$state-storeinsessionstorage$$$`state:storeInSessionStorage`
:   [preview] Kibana tracks UI state in the URL, which can lead to problems when there is a lot of state information, and the URL gets very long. Enabling this setting stores part of the URL in your browser session to keep the URL short.

$$$theme-darkmode$$$`theme:darkMode`
:   :::{admonition} Deprecated in 9.0.0
    This setting was deprecated in 9.0.0.
    :::

    The UI theme that the {{kib}} UI should use. Set to `enabled` or `disabled` to enable or disable the dark theme. Set to `system` to have the {{kib}} UI theme follow the system theme. You must refresh the page to apply the setting.

$$$theme-version$$$`theme:version`
:   Kibana only ships with the v8 theme now, so this setting can no longer be edited.

$$$timepicker-quickranges$$$`timepicker:quickRanges`
:   The list of ranges to show in the Quick section of the time filter. This should be an array of objects, with each object containing `from`, `to` (see [accepted formats](elasticsearch://reference/elasticsearch/rest-apis/common-options.md#date-math)), and `display` (the title to be displayed).

$$$timepicker-refreshintervaldefaults$$$`timepicker:refreshIntervalDefaults`
:   The default refresh interval for the time filter. Example: `{ "pause": true, "value": 15000 }`.

$$$timepicker-timedefaults$$$`timepicker:timeDefaults`
:   The default selection in the time filter.

$$$enableESQL$$$`enableESQL`
:   This setting enables ES|QL in Kibana.


### Presentation Labs [presentation-labs]

$$$labs-canvas-enable-ui$$$`labs:canvas:enable_ui`
:   When enabled, provides access to the experimental **Labs** features for **Canvas**.

$$$labs-dashboard-defer-below-fold$$$`labs:dashboard:deferBelowFold`
:   When enabled, the panels that appear below the fold are loaded when they become visible on the dashboard. *Below the fold* refers to panels that are not immediately visible when you open a dashboard, but become visible as you scroll.

$$$labs-dashboard-enable-ui$$$`labs:dashboard:enable_ui`
:   When enabled, provides access to the experimental **Labs** features for **Dashboard**.


### Accessibility [kibana-accessibility-settings]

$$$accessibility-disableanimations$$$`accessibility:disableAnimations`
:   Turns off all unnecessary animations in the {{kib}} UI. Refresh the page to apply the changes.


### Banners [kibana-banners-settings]

::::{note}
Banners are a [subscription feature](https://www.elastic.co/subscriptions).

::::


$$$banners-placement$$$`banners:placement`
:   Set to `Top` to display a banner above the Elastic header for this space. Defaults to the value of the `xpack.banners.placement` configuration property.

$$$banners-textcontent$$$`banners:textContent`
:   The text to display inside the banner for this space, either plain text or Markdown. Defaults to the value of the `xpack.banners.textContent` configuration property.

$$$banners-textcolor$$$`banners:textColor`
:   The color for the banner text for this space. Defaults to the value of the `xpack.banners.textColor` configuration property.

$$$banners-linkcolor$$$`banners:linkColor` {applies_to}`stack: ga 9.1`
:   The color for the banner link text for this space. Defaults to the value of the `xpack.banners.linkColor` configuration property.

$$$banners-backgroundcolor$$$`banners:backgroundColor`
:   The color of the banner background for this space. Defaults to the value of the `xpack.banners.backgroundColor` configuration property.


### Dashboard [kibana-dashboard-settings]

$$$xpackdashboardmode-roles$$$`xpackDashboardMode:roles`
:   :::{admonition} Deprecated in 7.7.0
    This setting was deprecated in 7.7.0.
    :::

    use [feature privileges](docs-content://deploy-manage/users-roles/cluster-or-deployment-auth/kibana-privileges.md#kibana-feature-privileges) instead. The roles that belong to [dashboard only mode](docs-content://deploy-manage/users-roles/cluster-or-deployment-auth/kibana-privileges.md).


### Discover [kibana-discover-settings]

$$$context-defaultsize$$$`context:defaultSize`
:   The number of surrounding entries to display in the context view. The default value is 5.

$$$context-step$$$`context:step`
:   The number by which to increment or decrement the context size. The default value is 5.

$$$context-tiebreakerfields$$$`context:tieBreakerFields`
:   A comma-separated list of fields to use for breaking a tie between documents that have the same timestamp value. The first field that is present and sortable in the current data view is used.

$$$defaultcolumns$$$`defaultColumns`
:   The columns that appear by default on the **Discover** page. The default is `_source`.

$$$discover-max-doc-fields-displayed$$$`discover:maxDocFieldsDisplayed`
:   Specifies the maximum number of fields to show in the document column of the **Discover** table.

$$$discover-modify-columns-on-switch$$$`discover:modifyColumnsOnSwitch`
:   When enabled, removes the columns that are not in the new data view.

$$$discover-row-height-option$$$`discover:rowHeightOption`
:   The number of lines to allow in a row. A value of -1 automatically adjusts the row height to fit the contents. A value of 0 displays the content in a single line.

$$$discover-sampleRowsPerPage$$$`discover:sampleRowsPerPage`
:   Limits the number of rows per page in the document table.

$$$discover-sample-size$$$`discover:sampleSize`
:   Sets the maximum number of rows for the entire document table. This is the maximum number of documents fetched from {{es}}.

$$$discover-searchonpageload$$$`discover:searchOnPageLoad`
:   Controls whether a search is executed when **Discover** first loads. This setting does not have an effect when loading a saved Discover session.

$$$discover:showFieldStatistics$$$`discover:showFieldStatistics`
:   [beta] Enables the Field statistics view. Examine details such as the minimum and maximum values of a numeric field or a map of a geo field.

$$$discover:showMultiFields$$$`discover:showMultiFields`
:   Controls the display of multi-fields in the expanded document view.

$$$discover-sort-defaultorder$$$`discover:sort:defaultOrder`
:   The default sort direction for time-based data views.

$$$doctable-hidetimecolumn$$$`doc_table:hideTimeColumn`
:   Hides the "Time" column in **Discover** and in all Discover session panels on dashboards.

$$$doctable-highlight$$$`doc_table:highlight`
:   Highlights search results in **Discover** and Discover session panels on dashboards. Highlighting slows requests when working on big documents.


### Machine Learning [kibana-ml-settings]

$$$ml-anomalydetection-results-enabletimedefaults$$$`ml:anomalyDetection:results:enableTimeDefaults`
:   Use the default time filter in the **Single Metric Viewer** and **Anomaly Explorer**. If this setting is disabled, the results for the full time range are shown.

$$$ml-anomalydetection-results-timedefaults$$$`ml:anomalyDetection:results:timeDefaults`
:   Sets the default time filter for viewing {{anomaly-job}} results. This setting must contain `from` and `to` values (see [accepted formats](elasticsearch://reference/elasticsearch/rest-apis/common-options.md#date-math)). It is ignored unless `ml:anomalyDetection:results:enableTimeDefaults` is enabled.


### Notifications [kibana-notification-settings]

$$$notifications-banner$$$`notifications:banner`
:   A custom banner intended for temporary notices to all users. Supports [Markdown](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax).

$$$notifications-lifetime-banner$$$`notifications:lifetime:banner`
:   The duration, in milliseconds, for banner notification displays. The default value is 3000000.

$$$notificatios-lifetime-error$$$`notifications:lifetime:error`
:   The duration, in milliseconds, for error notification displays. The default value is 300000.

$$$notifications-lifetime-info$$$`notifications:lifetime:info`
:   The duration, in milliseconds, for information notification displays. The default value is 5000.

$$$notifications-lifetime-warning$$$`notifications:lifetime:warning`
:   The duration, in milliseconds, for warning notification displays. The default value is 10000.


### Observability [observability-advanced-settings]

$$$apm-enable-service-overview$$$`apm:enableServiceOverview`
:   When enabled, displays the **Overview** tab for services in **APM**.

$$$apm-agent-explorer$$$`observability:apmAgentExplorerView` {applies_to}`stack: beta 9.0, removed 9.1`
:   Enable the Agent explorer view.

$$$apm-aws-price$$$`observability:apmAWSLambdaPriceFactor`
:   Set the price per Gb-second for your AWS Lambda functions.

$$$apm-aws-request$$$`observability:apmAWSLambdaRequestCostPerMillion`
:   Set the AWS Lambda cost per million requests.

$$$apm-continuous-rollups$$$`observability:apmEnableContinuousRollups` {applies_to}`stack: beta 9.0, removed 9.1`
:   When continuous rollups is enabled, the UI will select metrics with the appropriate resolution. On larger time ranges, lower resolution metrics will be used, which will improve loading times.

$$$apm-enable-service-metrics$$$`observability:apmEnableServiceMetrics` {applies_to}`stack: beta 9.0, removed 9.1`
:   Enable the usage of service transaction metrics, which are low cardinality metrics that can be used by certain views like the service inventory for faster loading times.

$$$observability-apm-labs$$$`observability:apmLabsButton` {applies_to}`stack: removed 9.1`
:   Enable or disable the APM Labs button — a quick way to enable and disable technical preview features in APM.

$$$observability-apm-critical-path$$$`observability:apmEnableCriticalPath` {applies_to}`stack: removed 9.1`
:   When enabled, displays the critical path of a trace.

$$$observability-enable-progressive-loading$$$`observability:apmProgressiveLoading` {applies_to}`stack: preview 9.0, ga 9.1`
:   When enabled, uses progressive loading of some APM views. Data may be requested with a lower sampling rate first, with lower accuracy but faster response times, while the unsampled data loads in the background.

$$$observability-apm-max-groups$$$`observability:apmServiceGroupMaxNumberOfServices`
:   Limit the number of services in a given service group.

$$$observability-apm-optimized-sort$$$`observability:apmServiceInventoryOptimizedSorting` {applies_to}`stack: preview 9.0, removed 9.1`
:   Sort services without anomaly detection rules on the APM Service inventory page by service name.

$$$observability-default-service-env$$$`observability:apmDefaultServiceEnvironment`
:   Set the default environment for the APM app. When left empty, data from all environments will be displayed by default.

$$$observability-apm-enable-profiling$$$`observability:apmEnableProfilingIntegration` {applies_to}`stack: removed 9.1`
:   Enable the Universal Profiling integration in APM.

$$$observability-profiling-show-error-frames$$$`observability:profilingShowErrorFrames`
:   Show error frames in the Universal Profiling views to indicate stack unwinding failures.

$$$observability-apm-enable-table-search-bar$$$`observability:apmEnableTableSearchBar`
:   [beta] Enables faster searching in APM tables by adding a handy search bar with live filtering. Available for the following tables: Services, Transactions, and Errors.

$$$observability-enable-aws-lambda-metrics$$$`observability:enableAwsLambdaMetrics` {applies_to}`stack: preview 9.0, removed 9.1`
:   Display Amazon Lambda metrics in the service metrics tab.

$$$observability-enable-legacy-uptime-app$$$`observability:enableLegacyUptimeApp`
:   Shows the Uptime app even if there is no recent Heartbeat data.

$$$observability-apm-enable-comparison$$$`observability:enableComparisonByDefault`
:   Determines whether the comparison feature is enabled or disabled by default in the APM app.

$$$observability-apm-enable-infra-view$$$`observability:enableInfrastructureView`
:   Enables the Infrastructure view in the APM app.

$$$observability-apm-enable-transaction-profiling$$$`observability:apmEnableTransactionProfiling`
:   Enable Universal Profiling on Transaction view.

$$$observability-enable-inspect-es-queries$$$`observability:enableInspectEsQueries`
:   When enabled, allows you to inspect {{es}} queries in API responses.

$$$observability-apm-enable-service-groups$$$`observability:enableServiceGroups` {applies_to}`stack: preview 9.0`
:   When enabled, allows users to create Service Groups from the APM Service inventory page.

$$$observability-apm-trace-explorer-tab$$$`observability:apmTraceExplorerTab` {applies_to}`stack: preview 9.0, removed 9.1`
:   Enable the APM Trace Explorer feature, that allows you to search and inspect traces with KQL or EQL.

$$$observability-infrastructure-profiling-integration$$$`observability:enableInfrastructureProfilingIntegration` {applies_to}`stack: preview 9.0, removed 9.1`
:   Enables the Profiling view in Host details within Infrastructure.

$$$observability-infrastructure-asset-custom-dashboard$$$`observability:enableInfrastructureAssetCustomDashboards` {applies_to}`stack: preview 9.0, removed 9.1`
:   Enables option to link custom dashboards in the Asset Details view.

$$$observability-profiling-per-vcpu-watt-x86$$$`observability:profilingPervCPUWattX86`
:   The average amortized per-core power consumption (based on 100% CPU utilization) for x86 architecture.

$$$observability-profiling-per-vcpu-watt-arm64$$$`observability:profilingPervCPUWattArm64`
:   The average amortized per-core power consumption (based on 100% CPU utilization) for arm64 architecture.

$$$observability-profiling-datacenter-PUE$$$`observability:profilingDatacenterPUE`
:   Data center power usage effectiveness (PUE) measures how efficiently a data center uses energy. Defaults to 1.7, the average on-premise data center PUE according to the [Uptime Institute](https://ela.st/uptimeinstitute) survey.

$$$observability-profiling-per-co2-per-kwh$$$`observability:profilingCo2PerKWH`
:   Carbon intensity measures how clean your data center electricity is. Specifically, it measures the average amount of CO2 emitted per kilowatt-hour (kWh) of electricity consumed in a particular region.

$$$observability-profiling-aws-cost-discount-rate$$$`observability:profilingAWSCostDiscountRate`
:   If you’re enrolled in the AWS Enterprise Discount Program (EDP), enter your discount rate to update the profiling cost calculation.

$$$observability-profiling-azure-cost-discount-rate$$$`observability:profilingAzureCostDiscountRate`
:   If you have an Azure Enterprise Agreement with Microsoft, enter your discount rate to update the profiling cost calculation.

$$$observability-profiling-use-topNFunctions-from-stacktraces$$$`observability:profilingFetchTopNFunctionsFromStacktraces` {applies_to}`stack: removed 9.1`
:   Switch to fetch the TopN Functions from the Stacktraces API.

$$$observability-profiling-cost-per-vcpu-per-hour$$$`observability:profilingCostPervCPUPerHour`
:   Default Hourly Cost per CPU Core for machines not on AWS or Azure.


### Reporting [kibana-reporting-settings]

$$$xpackreporting-custompdflogo$$$`xpackReporting:customPdfLogo`
:   A custom image to use in the footer of the PDF.


### Rollup [kibana-rollups-settings]

::::{admonition} Deprecated in 8.11.0.
:class: warning

Rollups are deprecated and will be removed in a future version. Use [downsampling](docs-content://manage-data/data-store/data-streams/downsampling-time-series-data-stream.md) instead.
::::


$$$rollups-enableindexpatterns$$$`rollups:enableIndexPatterns`
:   :::{admonition} Deprecated in 8.15.0
    This setting was deprecated in 8.15.0.
    :::

    Enables the creation of data views that capture rollup indices, which in turn enables visualizations based on rollup data. Refresh the page to apply the changes.


### Search [kibana-search-settings]

$$$courier-customrequestpreference$$$`courier:customRequestPreference`
:   [Request preference](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-body.html#request-body-search-preference) to use when `courier:setRequestPreference` is set to "custom".

$$$courier-ignorefilteriffieldnotinindex$$$`courier:ignoreFilterIfFieldNotInIndex`
:   Skips filters that apply to fields that don’t exist in the index for a visualization. Useful when dashboards consist of visualizations from multiple data views.

$$$courier-maxconcurrentshardrequests$$$`courier:maxConcurrentShardRequests`
:   Controls the [max_concurrent_shard_requests](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-msearch) setting used for `_msearch` requests sent by {{kib}}. Set to 0 to disable this config and use the {{es}} default.

$$$courier-setrequestpreference$$$`courier:setRequestPreference`
:   Enables you to set which shards handle your search requests.

    * **Session ID:** Restricts operations to execute all search requests on the same shards. This has the benefit of reusing shard caches across requests.
    * **Custom:** Allows you to define your own preference. Use `courier:customRequestPreference` to customize your preference value.
    * **None:** Do not set a preference. This might provide better performance because requests can be spread across all shard copies. However, results might be inconsistent because different shards might be in different refresh states.


$$$search-includefrozen$$$`search:includeFrozen`
:   :::{admonition} Deprecated in 7.16.0
    This setting was deprecated in 7.16.0.
    :::

    Includes [frozen indices](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-unfreeze) in results. Searching through frozen indices might increase the search time. This setting is off by default. Users must opt-in to include frozen indices.

$$$search-timeout$$$`search:timeout`
:   Change the maximum timeout, in milliseconds (ms), for search requests. To disable the timeout and allow queries to run to completion, set to 0. The default is `600000`, or 10 minutes.


### Security Solution [kibana-siem-settings]

$$$securitysolution-defaultanomalyscore$$$`securitySolution:defaultAnomalyScore`
:   The threshold above which {{ml}} job anomalies are displayed in the {{security-app}}.

$$$securitysolution-defaultindex$$$`securitySolution:defaultIndex`
:   A comma-delimited list of {{es}} indices from which the {{security-app}} collects events.

$$$securitysolution-threatindices$$$`securitySolution:defaultThreatIndex`
:   A comma-delimited list of Threat Intelligence indices from which the {{security-app}} collects indicators.

$$$securitysolution-enableCcsWarning$$$`securitySolution:enableCcsWarning`
:   Enables privilege check warnings in rules for CCS indices.

$$$securitysolution-enablenewsfeed$$$`securitySolution:enableNewsFeed`
:   Enables the security news feed on the Security **Overview** page.

$$$securitysolution-ipreputationlinks$$$`securitySolution:ipReputationLinks`
:   A JSON array containing links for verifying the reputation of an IP address. The links are displayed on [IP detail](docs-content://solutions/security/explore/network-page.md) pages.

$$$securitysolution-newsfeedurl$$$`securitySolution:newsFeedUrl`
:   The URL from which the security news feed content is retrieved.

$$$securitysolution-refreshintervaldefaults$$$`securitySolution:refreshIntervalDefaults`
:   The default refresh interval for the Security time filter, in milliseconds.

$$$security-solution-rules-table-refresh$$$`securitySolution:rulesTableRefresh`
:   Enables auto refresh on the rules and monitoring tables, in milliseconds.

$$$securitySolution-showRelatedIntegrations$$$`securitySolution:showRelatedIntegrations`
:   Shows related integrations on the rules and monitoring tables.

$$$securitysolution-timedefaults$$$`securitySolution:timeDefaults`
:   The default period of time in the Security time filter.


### Timelion [kibana-timelion-settings]

$$$timelion-esdefaultindex$$$`timelion:es.default_index`
:   The default index when using the `.es()` query.

$$$timelion-estimefield$$$`timelion:es.timefield`
:   The default field containing a timestamp when using the `.es()` query.

$$$timelion-maxbuckets$$$`timelion:max_buckets`
:   The maximum number of buckets a single data source can return. This value is used for calculating automatic intervals in visualizations.

$$$timelion-mininterval$$$`timelion:min_interval`
:   The smallest interval to calculate when using "auto".

$$$timelion-targetbuckets$$$`timelion:target_buckets`
:   Used for calculating automatic intervals in visualizations, this is the number of buckets to try to represent.


### Visualization [kibana-visualization-settings]

$$$visualization-uselegacytimeaxis$$$`visualization:useLegacyTimeAxis` {applies_to}`stack: deprecated 8.10, removed 9.1`
:   Enables the legacy time axis for charts in Lens, Discover, Visualize and TSVB.

$$$visualization-heatmap-maxbuckets$$$`visualization:heatmap:maxBuckets`
:   The maximum number of buckets a datasource can return. High numbers can have a negative impact on your browser rendering performance.

$$$visualization-visualize-heatmapChartslibrary$$$`visualization:visualize:legacyHeatmapChartsLibrary`
:   Disable this option if you prefer to use the new heatmap charts with improved performance, legend settings, and more.


## Change the global settings [kibana-global-settings-reference]

Change the only settings that apply to all of {{kib}}.

1. Go to the **Advanced settings** page using the navigation menu or the [global search field](docs-content://get-started/the-stack.md#kibana-navigation-search).
2. Click **Global Settings**.
3. Scroll or search for the setting.
4. Make your change, then click **Save changes**.


### Custom branding [kibana-custom-branding-settings]

$$$custom-logo$$$`xpackCustomBranding:logo`
:   A custom image that appears in the header of all {{kib}} pages. Images must have a transparent background, and 128 x 128 pixels or smaller.

$$$organization-name$$$`xpackCustomBranding:customizedLogo`
:   The custom text that appears in the header of all {{kib}} pages. Images must have a transparent background, and 200 x 84 pixels or smaller.

$$$page-title$$$`xpackCustomBranding:pageTitle`
:   The custom text that appears on {{kib}} browser tabs.

$$$favicon-svg$$$`xpackCustomBranding:faviconSVG`
:   The URL of a custom SVG image that appears on {{kib}} browser tabs. Images must be 16 x 16 pixels.

$$$favicon-png$$$`xpackCustomBranding:faviconPNG`
:   The URL of a custom PNG image that appears on {{kib}} browser tabs.


### Usage collection [kibana-usage-collection-settings]

$$$provide-usage-data$$$`telemetry:enabled`
:   Enabling data usage collection (also known as Telemetry) allows us to learn what our users are most interested in, so we can improve our products and services. Refer to our [Privacy Statement](https://www.elastic.co/legal/product-privacy-statement) for more details.

