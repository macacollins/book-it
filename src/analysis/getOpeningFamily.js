
// Based on the full text of the opening name, guess the family
const openings =  [ "Alekhine's Defense",
    "Benko Gambit",
    "Benoni Defense",
    "Bird's Opening",
    "Bogo-Indian Defense",
    "Budapest Gambit",
    "Catalan Opening",
    "Caro-Kann Defense",
    "Colle System",
    "Dutch Defense",
    "Giuoco Piano",
    "English Opening",
    "Evans Gambit",
    "Four Knights Game",
    "French Defense",
    "Grünfeld Defense",
    "Italian Game",
    "King's Gambit",
    "King's Indian Attack",
    "King's Indian Defense",
    "King's Pawn Game",
    "London System",
    "Modern Defense",
    "Nimzo-Indian Defense",
    "Nimzowitsch Defense",
    "Petrov's Defense",
    "Philidor's Defense",
    "Pirc Defense",
    "Queen's Pawn Game",
    "Queen's Gambit Accepted",
    "Queen's Gambit Declined",
    "Queen's Indian Defense",
    "Réti Opening",
    "Ruy Lopez",
    "Scandinavian Defense",
    "Scotch Game",
    "Sicilian Defense",
    "Slav Defense",
    "Torre Attack",
    "Two Knights Defense",
    "Vienna Game",
    "Wade Defense",
    "Unknown"
    ];

// Address some inconsistencies in spelling
const alternates = {
    "Caro-Kann Defense" : [
        "Caro Kann"
    ],
    "Queen's Gambit Declined" : [
        "Queens Gambit Declined"
    ],
    "Réti Opening" : [
        "Reti"
    ],
}

// Get the shorter name of the family rather than the full variation
// This allows more grouping of similar openings
export default function getOpeningFamily(name) {

    for (let opening of openings) {
        if (name.indexOf(opening) !== -1) {
            // If the main entry matches, just return it
            return opening

        } else if (alternates[opening]) {
            // Otherwise, check the alternative names
            for (let alternativeName of alternates[opening]) {
                if (name.indexOf(alternativeName) !== -1) {
                    return opening
                }
            }
        }
    }

    return name
}