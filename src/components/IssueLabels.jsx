import { useState } from "react";
import { GoGear } from "react-icons/go";
import { useMutation, useQueryClient } from "react-query";
import { useLabelsData } from "../helpers/useLabelsData";
export default function IssueLabels({ labels, issueNumber }) {
  const labelsQuery = useLabelsData();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const setLabels = useMutation(
    (labelId) => {
      const newLabels = labels.includes(labelId)
        ? labels.filter((lbl) => lbl !== labelId)
        : [...labels, labelId];
      return fetch(`/api/issues/${issueNumber}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ labels: newLabels }),
      }).then((res) => res.json());
    },
    {
      onMutate: (labelId) => {
        const oldLabels = queryClient.getQueryData([
          "issues",
          issueNumber,
        ]).labels;

        const newLabels = oldLabels.includes(labelId)
          ? oldLabels.filter((lbl) => lbl !== labelId)
          : [...oldLabels, labelId];

        queryClient.setQueryData(["issues", issueNumber], (issue) => ({
          ...issue,
          labels: newLabels,
        }));

        return () => {
          queryClient.setQueryData(["issues", issueNumber], (issue) => {
            const rollbackLabels = oldLabels.includes(labelId)
              ? [...issue.labels, labelId]
              : issue.labels.filter((lbl) => lbl !== labelId);
            return {
              ...issue,
              labels: rollbackLabels,
            };
          });
        };
      },
      onSuccess: (data, variables, rollback) => {
        rollback();
        queryClient.setQueryData(["issues", issueNumber], data);
      },
      onError: (data, variables, rollback) => {
        rollback();
      },
      onSettled: (data, variables, rollback) => {
        queryClient.invalidateQueries(["issues", issueNumber], { exact: true });
      },
    }
  );
  return (
    <div className="issue-options">
      <div>
        <span>Labels</span>
        {labelsQuery.isLoading
          ? null
          : labels.map((label) => {
              const labelObject = labelsQuery.data.find(
                (lbl) => lbl.id === label
              );
              if (!labelObject) return null;
              return (
                <span key={label} className={`label ${labelObject.color}`}>
                  {labelObject.name}
                </span>
              );
            })}
      </div>
      <GoGear
        onClick={() => {
          !labelsQuery.isLoading && setMenuOpen((prev) => !prev);
        }}
      />
      {isMenuOpen && (
        <div className="picker-menu labels">
          {labelsQuery.data?.map((label) => {
            const selected = labels.includes(label.id);
            return (
              <div
                key={label.id}
                className={selected ? "selected" : ""}
                onClick={() => {
                  if (setLabels.isLoading) return;
                  setLabels.mutate(label.id);
                }}
              >
                <span
                  className="label-dot"
                  style={{ backgroundColor: label.color }}
                />
                {label.name}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
