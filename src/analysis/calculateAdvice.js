
export const YOU_LEFT_BOOK = "You left book on this one. Study the lines from the repertoire."
export const THEY_LEFT_BOOK = "They left book. Consider analyzing the move to get an idea of how to play against it."
export const POSITION_NOT_FOUND = "This position was not found in the repertoire. Consider expanding it for the below opening name."

export function calculateAdvice(analysis) {
    // TODO consider dynamically calculating this at display time
    if (analysis.foundIntersection) {
        if (analysis.youLeftBook) {
            return YOU_LEFT_BOOK
        } else {
            return THEY_LEFT_BOOK
        }
    } else {
        return POSITION_NOT_FOUND
    }
}