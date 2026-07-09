import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface UsageSummary {
  plan: "free" | "ultimate";
  priceUsd: number;
  freeNomadModels: string[];
  freeNomadModelLabels: Record<string, string>;
  messagesRemaining?: number | null;
  messagesLimit?: number;
  messagesUsed?: number;
  imagesRemaining: number;
  imagesLimit: number;
  imagesUsed: number;
  tokensRemaining?: number;
  tokensLimit?: number;
  tokensUsed?: number;
}

export function useUsage() {
  const queryClient = useQueryClient();

  const query = useQuery<UsageSummary | null>({
    queryKey: ["/api/usage"],
    refetchInterval: 30000,
  });

  const upgrade = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/usage/upgrade");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
    },
  });

  const downgrade = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/usage/downgrade");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
    },
  });

  return {
    usage: query.data,
    isLoading: query.isLoading,
    upgrade,
    downgrade,
  };
}
