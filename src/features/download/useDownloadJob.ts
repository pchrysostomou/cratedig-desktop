import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getJob, startDownload, type DownloadRequest } from "../../api/client";

// Drives a download: POST /download, then poll GET /jobs/{id} until terminal, and
// refresh the library when it finishes. See DESIGN.md §5.2.
export function useDownloadJob() {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);

  const start = useMutation({
    mutationFn: (req: DownloadRequest) => startDownload(req),
    onSuccess: (res) => setJobId(res.job_id),
  });

  const job = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJob(jobId as string),
    enabled: jobId != null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "done" || status === "error" ? false : 750;
    },
  });

  const status = job.data?.status;
  useEffect(() => {
    if (status === "done") {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    }
  }, [status, queryClient]);

  return {
    submit: (req: DownloadRequest) => start.mutate(req),
    isStarting: start.isPending,
    job: job.data ?? null,
    reset: () => setJobId(null),
  };
}
