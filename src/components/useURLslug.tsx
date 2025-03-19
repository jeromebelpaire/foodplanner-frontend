import { useSearchParams } from "react-router-dom";

export function useURLslug() {
  const [searchParams] = useSearchParams();
  const slug = searchParams.get("slug");
  if (!slug) {
    throw new Error("The url is missing a 'slug' parameter");
  }
  return { slug };
}
