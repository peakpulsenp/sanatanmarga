import AdBanner from "./AdBanner";

/**
 * AdSlider delegates strictly to AdBanner position="sidebar"
 * to display ONLY advertisements configured through the Admin Panel.
 */
export default function AdSlider() {
  return <AdBanner position="sidebar" />;
}
