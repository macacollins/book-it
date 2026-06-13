# Features 

## Show transpositions
Specifically, in the moves table coverage column, if the resulting FEN is the starting point of another repertoire, show T and give it 100% credit for the currently active repertoire. If the user clicks the t, show a popup with the name of the repertoire that it transposes to and how many lines are there in the other repertoire.

## Split Repertoire
The user will want to separate out parts of the repertoire later. To accomplish this, the user will be able to click a "Split Repertoire Here" Button. This button will show a modal with two screens. The first is to take the standard information about the repertoire, just like the Create Gradual Repertoire button. The name should be blank and required, starting point should copy over the settings from the repertoire that we're copying, color should be set to the same color as the current repertoire. Starting moves and position should be set based on the location where the user has clicked "Split Repertoire" button. In the second step, the window should show what will happen after the split. Specifically, it will show the old repertoire and count how many lines will be removed, and the new repertoire with a count of how many lines will be copied over. After the user clicks submit, take the user to the new repertoire page at its starting position.

## Games Filter page

We should have a page that allows the user to drop in a large file of games and extract the ones that most closely match one or more gradual repertoires. This involves two passes: one is through the grb to create a map of fen -> # of moves covered, and a second one thru the games to play moves until they aren't found in any GRB. This could become computationally intensive so we'll probably want to do it in a background worker. 

## Games Viewer

We should have a page accessible from the main GRB page that takes the user to a list of matching games and allows them to replay the games, comment, or play guess the move with master games. 

## Strip comment page

Create a page that allows the user to drop a pgn in and get a minified PGN back. This can go under PGN tools later.

## Show comments in GRB

If the underlying PGN has comments, we need a way to show them in the GradualRepertoireBuilder page. Let's think of ways to compose the user interface so the comments are available without taking too much of the screen real estate.

## Identify divergent moves

We should provide functionality that shows the user where they have multiple moves for a single position. Be sure to show the total number of moves under each position in order to help the user quickly differentiate between the two. 

## Fix piece z-index in modals

Currently when the user is moving pieces to establish the starting moves / starting position for a repertoire, the application does not show the piece as you are moving it, instead only highlighting the squares on the board under the mouse. It's functional but it would be much better to show the pieces like everywhere else on the application.

## Make UsageSphere toggleable

When the user is trying to arrange their screen, they may wish to hide / show the UsageSphere visualization. Make a circle icon button next to "Potential moves by the opponent in this position" that toggles the usagesphere on and off. 

## Right justify level bars

Right now the level bars are often not aligned properly, which doesn't look nice. Let's right justify the level bars in the accordiontab headers in the GradualRepertoireBuilder.tsx component.

## Show overall level at top next to title

Similarly to how the levels of repertoires under one of the accordiontabs in gradual repertoire builder are added up to form the level for the tab, let's sum up all the tabs and display the combined level at the top right in the header bar.

# Enhancements

## Don't break the RepertoireDrill page when the user changes screen orientation
When the page orientation changes, current progress is lost and the user is unable to return to their previous state. Similarly, after navigating forwards or backwards, the user cannot interact with the puzzle. The user should be able to do whatever they want in terms of orientation and forwards / backwards and the application should behave properly no matter what.

## Stop freezing the page
I think this is due to the code that spins a bunch of WebWorkers. We should probably condense the Webworkers to a single worker that sits in the page and handles all the lichess stuff. Making the API available across the application is interesting and not entirely trivial--let's plan how this will work before implementing the whole thing.

## Use the URL in gradual repertoire builder to allow refreshing and bookmarking specific positions
This will allow us to quickly restore when the page breaks and go back to a given location easily.

## Coverage updates
Currently, if a repertoire includes lines that are less than 6 ply, the end of the line is counted as 100% coverage. We need to stop doing that. Also, coverage past ply 6 is real goofy and gives unintuitive results. Overall for coverage, we need to pull the algorithm into a plain TypeScript function somewhere and unit test it really really well because this is one of the most essential parts of the application.

## Show percentage of games in the GRB index page
For each repertoire section, we need to show the percentage of total games that reach the given position. This way users will be able to quickly see which parts of the repertoire will be more impactful to build against.


## Usage / Auditing subsystem

The Chess Dojo has a calendar view like GitHub's usage graph with squares highlighted different colors so as to show what you've been working on. This product needs to have a new page that shows the usage for this application. This means a few things need to change. Specifically, we need to start writing to an audit log for any of the following:

- Completed Tactics Drills--count the start time as immediately when the user loads the page, but do not write to the audit log unless they complete at least one puzzle. Write the completed timestamps to a new audit database table. The logic later will look at the timestamps and provide an estimate about how much time was spent there.
- GradualRepertoireBuilder usage--these count as opening prep. Count the start time as when the user lands on the gradual repertoire builder page, but do not score it as anything until they add a move.
- Repertoire drill page--this counts as opening prep. Count the start time as when they load the page, and write to the audit log when the user completes one of the exercises.
- Games--do not need to be written to the audit log, but should be shown on the timeline to help understand recent patterns. The audit viewer ui should allow the user to filter for specific time controls.
 
Most of this will happen behind the scenes, but there should be a new page for the eventual activity graph. The activity graph should be one week per column with one row per day of the week. The activity graph should have checkboxes for each type of activity allowing the user to toggle them on and off.




