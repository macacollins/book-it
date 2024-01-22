export function calculateAdvice(analysis) {
    // TODO consider dynamically calculating this at display time
    if (analysis.foundIntersection) {
        if (analysis.you_left_book) {
            return "You left book on this one. Study the lines from the repertoire."
        } else {
            return "They left book. Consider analyzing the move to get an idea of how to play against it."
        }
    } else {
        return "This position was not found in the repertoire. Consider expanding it for the below opening name."
    }
}