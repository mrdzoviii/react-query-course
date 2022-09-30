import { useMutation, useQueryClient } from "react-query";
import { StatusSelect } from "./StatusSelect";

export default function IssueStatus({ status, issueNumber }) {
  const queryClient = useQueryClient();
  const setStatus = useMutation(
    (status) => {
      return fetch(`/api/issues/${issueNumber}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((res) => res.json());
    },
    {
      onMutate: (status) => {
        const oldStatus = queryClient.getQueryData([
          "issues",
          issueNumber,
        ]).status;

        queryClient.setQueryData(["issues", issueNumber], (issue) => ({
          ...issue,
          status,
        }));

        return () => {
          queryClient.setQueryData(["issues", issueNumber], (issue) => ({
            ...issue,
            status: oldStatus,
          }));
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
        <span>Status</span>
        <StatusSelect
          onChange={(e) => {
            setStatus.mutate(e.target.value);
          }}
          value={status}
          noEmptyOption={true}
        />
      </div>
    </div>
  );
}
