/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FC } from 'react';
import React, { useCallback, useState, useEffect } from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import {
  EuiFlyout,
  EuiFlyoutFooter,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiButtonEmpty,
  EuiTitle,
  EuiFlyoutBody,
  EuiSpacer,
  EuiTextArea,
  EuiFormRow,
  EuiSwitch,
  EuiConfirmModal,
  EuiCallOut,
  useGeneratedHtmlId,
} from '@elastic/eui';

import type {
  ModelSnapshot,
  CombinedJobWithStats,
} from '../../../../../common/types/anomaly_detection_jobs';
import { useMlApi, useNotifications } from '../../../contexts/kibana';

interface Props {
  snapshot: ModelSnapshot;
  job: CombinedJobWithStats;
  closeFlyout(reload: boolean): void;
}

export const EditModelSnapshotFlyout: FC<Props> = ({ snapshot, job, closeFlyout }) => {
  const mlApi = useMlApi();
  const { toasts } = useNotifications();
  const [description, setDescription] = useState(snapshot.description);
  const [retain, setRetain] = useState(snapshot.retain);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isCurrentSnapshot, setIsCurrentSnapshot] = useState(
    snapshot.snapshot_id === job.model_snapshot_id
  );

  useEffect(() => {
    setIsCurrentSnapshot(snapshot.snapshot_id === job.model_snapshot_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  const updateSnapshot = useCallback(async () => {
    try {
      await mlApi.updateModelSnapshot(snapshot.job_id, snapshot.snapshot_id, {
        description,
        retain,
      });
      closeWithReload();
    } catch (error) {
      toasts.addError(new Error(error.body.message), {
        title: i18n.translate('xpack.ml.editModelSnapshotFlyout.saveErrorTitle', {
          defaultMessage: 'Model snapshot update failed',
        }),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retain, description, snapshot]);

  const deleteSnapshot = useCallback(async () => {
    try {
      await mlApi.deleteModelSnapshot(snapshot.job_id, snapshot.snapshot_id);
      hideDeleteModal();
      closeWithReload();
    } catch (error) {
      toasts.addError(new Error(error.body.message), {
        title: i18n.translate('xpack.ml.editModelSnapshotFlyout.deleteErrorTitle', {
          defaultMessage: 'Model snapshot deletion failed',
        }),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  function closeWithReload() {
    closeFlyout(true);
  }
  function closeWithoutReload() {
    closeFlyout(false);
  }
  function showDeleteModal() {
    setDeleteModalVisible(true);
  }
  function hideDeleteModal() {
    setDeleteModalVisible(false);
  }

  const flyoutTitleId = useGeneratedHtmlId({
    prefix: 'editModelSnapshotFlyout',
  });
  const modalTitleId = useGeneratedHtmlId();

  return (
    <>
      <EuiFlyout
        onClose={closeWithoutReload}
        hideCloseButton
        size="m"
        aria-labelledby={flyoutTitleId}
      >
        <EuiFlyoutBody>
          <EuiFlexItem>
            <EuiTitle size="s">
              <h5 id={flyoutTitleId}>
                <FormattedMessage
                  id="xpack.ml.editModelSnapshotFlyout.title"
                  defaultMessage="Edit snapshot {ssId}"
                  values={{ ssId: snapshot.snapshot_id }}
                />
              </h5>
            </EuiTitle>

            {isCurrentSnapshot && (
              <>
                <EuiSpacer size="m" />
                <EuiCallOut
                  size="s"
                  title={i18n.translate('xpack.ml.editModelSnapshotFlyout.calloutTitle', {
                    defaultMessage: 'Current snapshot',
                  })}
                >
                  <FormattedMessage
                    id="xpack.ml.editModelSnapshotFlyout.calloutText"
                    defaultMessage="This is the current snapshot being used by job {jobId} and so cannot be deleted."
                    values={{ jobId: job.job_id }}
                  />
                </EuiCallOut>
              </>
            )}

            <EuiSpacer size="l" />

            <EuiFormRow
              label={i18n.translate('xpack.ml.editModelSnapshotFlyout.descriptionTitle', {
                defaultMessage: 'Description',
              })}
              fullWidth
            >
              <EuiTextArea
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </EuiFormRow>
            <EuiSpacer size="m" />
            <EuiFormRow fullWidth>
              <EuiSwitch
                label={i18n.translate('xpack.ml.editModelSnapshotFlyout.retainSwitchLabel', {
                  defaultMessage: 'Retain snapshot during automatic snapshot cleanup process',
                })}
                checked={retain}
                onChange={(e) => setRetain(e.target.checked)}
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlyoutBody>
        <EuiFlyoutFooter>
          <EuiFlexGroup justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty iconType="cross" onClick={closeWithoutReload} flush="left">
                <FormattedMessage
                  id="xpack.ml.editModelSnapshotFlyout.closeButton"
                  defaultMessage="Close"
                />
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={true} />
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                onClick={showDeleteModal}
                color="danger"
                disabled={isCurrentSnapshot === true}
              >
                <FormattedMessage
                  id="xpack.ml.editModelSnapshotFlyout.useDefaultButton"
                  defaultMessage="Delete"
                />
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton onClick={updateSnapshot} fill>
                <FormattedMessage
                  id="xpack.ml.editModelSnapshotFlyout.saveButton"
                  defaultMessage="Save"
                />
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutFooter>
      </EuiFlyout>

      {deleteModalVisible && (
        <EuiConfirmModal
          aria-labelledby={modalTitleId}
          title={i18n.translate('xpack.ml.editModelSnapshotFlyout.deleteTitle', {
            defaultMessage: 'Delete snapshot?',
          })}
          titleProps={{ id: modalTitleId }}
          onCancel={hideDeleteModal}
          onConfirm={deleteSnapshot}
          cancelButtonText={i18n.translate('xpack.ml.editModelSnapshotFlyout.cancelButton', {
            defaultMessage: 'Cancel',
          })}
          confirmButtonText={i18n.translate('xpack.ml.editModelSnapshotFlyout.deleteButton', {
            defaultMessage: 'Delete',
          })}
          buttonColor="danger"
          defaultFocusedButton="confirm"
        />
      )}
    </>
  );
};
