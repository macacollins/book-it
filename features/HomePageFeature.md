# The Home Page

The goal of this page is to help the user quickly address the most pertinent opening lines. 

## Choosing lines

The criteria for choosing a good line include the following factors:

- The user will get games in this opening. This is important because the user should not learn master-level lines if they are not playing masters.
- The win rate skews low compared to other openings
- Average time first ten moves was high indicating unfamiliarity with the lines. 

In order to generate this information, this page will need to read out information from the games database and sort them based on the FEN after the first eight moves. 

## Strategic objective #1

The first thing we need to do is to create a lichess client. This means generating a full TypeScript client including types for all request and response bodies that can interact with all endpoints in the lichess-openapi.json. This will include the following steps:

1. Generating a script to parse the OpenAPI Format. Use the 
