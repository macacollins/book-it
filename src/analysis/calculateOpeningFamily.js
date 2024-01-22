import getOpeningFamily from "./getOpeningFamily";

export function calculateOpeningFamily(analysis) {
    const path = new URL(analysis.headers.ECOUrl).pathname;
    // Get the last path segment and replace hyphens with spaces
    const openingName = path.split('/').pop().replace(/-/g, ' ').replace(/[0-9].*/g, '');
    return getOpeningFamily(openingName);
}