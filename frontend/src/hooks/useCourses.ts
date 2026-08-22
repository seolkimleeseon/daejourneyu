import { useQuery } from "@tanstack/react-query";
import { fetchCourses } from "@/lib/api/courses";

export function useCourses() {
  return useQuery({ queryKey: ["courses"], queryFn: fetchCourses });
}
