import getOpeningFamily from "./getOpeningFamily";

export function calculateOpeningFamily(headers: Record<string, string>) {
    const path = new URL(headers.ECOUrl).pathname;
    // Get the last path segment and replace hyphens with spaces
    const openingName = path.split('/')?.pop()?.replace(/-/g, ' ').replace(/[0-9].*/g, '');
    if (openingName) {
        return getOpeningFamily(openingName);
    } else {
        return "";
    }
    
}