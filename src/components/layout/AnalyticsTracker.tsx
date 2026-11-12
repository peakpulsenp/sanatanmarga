import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageview } from "@/src/lib/ga4";

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    pageview(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return null;
}
