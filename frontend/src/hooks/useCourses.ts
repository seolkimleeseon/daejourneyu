import { useQuery } from "@tanstack/react-query";
import { fetchCourses } from "@/lib/api/courses";
import { useAuthStore } from "@/stores/useAuthStore";

export function useCourses() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({ queryKey: ["courses"], queryFn: fetchCourses, enabled: isLoggedIn });
}
