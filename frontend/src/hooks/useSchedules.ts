import { useQuery } from "@tanstack/react-query";
import { fetchSchedulesApi } from "@/lib/api/schedule";
import { useAuthStore } from "@/stores/useAuthStore";

export function useSchedules() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({ queryKey: ["schedules"], queryFn: fetchSchedulesApi, enabled: isLoggedIn, staleTime: 30_000 });
}
