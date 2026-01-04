export { introTour } from "./introTour";
export { schemaTour } from "./schemaTour";
export { editorTour } from "./editorTour";
export { wireframeTour } from "./wireframeTour";
export { contentCreationTour } from "./contentCreationTour";
export { roadmapTour } from "./roadmapTour";
export { ceoDashboardTour } from "./ceoDashboardTour";
export { analyticsTour } from "./analyticsTour";

import { introTour } from "./introTour";
import { schemaTour } from "./schemaTour";
import { editorTour } from "./editorTour";
import { wireframeTour } from "./wireframeTour";
import { contentCreationTour } from "./contentCreationTour";
import { roadmapTour } from "./roadmapTour";
import { ceoDashboardTour } from "./ceoDashboardTour";
import { analyticsTour } from "./analyticsTour";
import type { TourDefinition } from "../TourProvider";

/**
 * All available tours in recommended order
 * - intro: General app orientation
 * - ceoDashboard: Executive review dashboard
 * - schema: Content Architecture (visual canvas)
 * - editor: Building Blocks (content editing)
 * - wireframe: Website Builder (page design)
 * - contentCreation: Content Studio (AI generation)
 * - roadmap: Content planning and tracking
 * - analytics: Health metrics and insights
 */
export const ALL_TOURS: TourDefinition[] = [
  introTour,
  ceoDashboardTour,
  schemaTour,
  editorTour,
  wireframeTour,
  contentCreationTour,
  roadmapTour,
  analyticsTour,
];

/**
 * Get tour by ID
 */
export function getTourById(id: string): TourDefinition | undefined {
  return ALL_TOURS.find((tour) => tour.id === id);
}

/**
 * Get tours for a specific tab
 * Returns tours that either have no restriction or match the given tab
 */
export function getToursForTab(tab: string): TourDefinition[] {
  return ALL_TOURS.filter(
    (tour) => !tour.tabRestriction || tour.tabRestriction === tab
  );
}

/**
 * Get the recommended tour for a tab (first matching tour)
 */
export function getRecommendedTourForTab(tab: string): TourDefinition | undefined {
  return ALL_TOURS.find((tour) => tour.tabRestriction === tab);
}
