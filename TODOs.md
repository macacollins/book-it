Short term

- Allow editing notes from inside this app

* Fix url schema for repertoire viewer to allow persistent links. Probably index-based

- More terse header options

* Fix repertoire selection preview to not appear behind lines list
* Clean up lines list when viewing a repertoire
* Pull notes when viewing a position in the repertoire viewer

- Clean up drills selection page
- Move channel creation button into channel selection page and rename it TV

* Allow deleting channels

- Make dedicated route for channels so there are persistent links

Long term

- Add a board-first page that allows viewing notes and applicable repertoires as well as any other data we have for a position
  - win rate
  - number of games seen
- add lichess config options such as which elo range to target
- Responsive header options
- Restructure / rethink page that starts drills
- Allow building repertoire from the viewer
- Allow importing pgn through local server means--POST + GET stuff
- incorporate stockfish (heavier lift)
- Primeflex instead of custom css
- allow editing channels
- allow adding / removing single positions when creating a channel
- Notes-based drills
- Ability to clear cache of lichess games
- Incorporate completely offline functionality, should be offline first
- Make tv work completely offline
- Create matrix of which drill options work with which and implement multistep design.
  - Also provide a quick frequency based setting or ability to save configurations
- Create notes queue page that automatically routes you to courses related to moves you missed that you haven't made notes for
- If you miss a move in a drill, make ability to create notes
- More game analysis--get metrics like Aimchess does
- some kind of game goals
  - Get every position from a course up to X moves
  - Get a number of games in an opening
  - Recommendation based on lowest performance + most seen Tabiyas
- Recommendations on repertoire expansion based on games seen

Maybe

- Move-by-move practice for entire lines
- SRS style drills stuff

External

- Better Anki color selection--allow individual decks / cards to set a variable
