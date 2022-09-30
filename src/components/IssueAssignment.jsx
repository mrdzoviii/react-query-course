import { useUserData } from "../helpers/useUserData";
import { GoGear } from "react-icons/go";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

export default function IssueAssignment({ assignee, issueNumber }) {
  const user = useUserData(assignee);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const usersQuery = useQuery(["users"], () =>
    fetch(`/api/users`).then((res) => res.json())
  );
  const queryClient = useQueryClient();
  const setAssignee = useMutation(
    (assignee) => {
      return fetch(`/api/issues/${issueNumber}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assignee }),
      }).then((res) => res.json());
    },
    {
      onMutate: (assignee) => {
        const oldAssignee = queryClient.getQueryData([
          "issues",
          issueNumber,
        ]).assignee;

        queryClient.setQueryData(["issues", issueNumber], (issue) => ({
          ...issue,
          assignee,
        }));

        return () => {
          queryClient.setQueryData(["issues", issueNumber], (issue) => ({
            ...issue,
            assignee: oldAssignee,
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
        <span>Assignment</span>
        {user.isSuccess && (
          <div>
            <img src={user.data.profilePictureUrl} alt={user.data.name} />
            {user.data.name}
          </div>
        )}
      </div>
      <GoGear
        onClick={() => {
          !usersQuery.isLoading && setMenuOpen((prev) => !prev);
        }}
      />
      {isMenuOpen && (
        <div className="picker-menu">
          {usersQuery.data?.map((user) => (
            <div
              key={user.id}
              onClick={() => {
                if (setAssignee.isLoading) return;
                setAssignee.mutate(user.id);
                setMenuOpen(false);
              }}
            >
              <div>
                <img src={user.profilePictureUrl} />
                {user.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
