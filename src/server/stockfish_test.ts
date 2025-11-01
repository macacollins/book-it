const execute = require("child_process").exec;

module.exports.getStockfishEvaluation = function (callback: any) {
  execute("git config --global user.name", function (name: any) {
    execute("git config --global user.email", function (email: any) {
      callback({
        name: name.replace("\n", ""),
        email: email.replace("\n", ""),
      });
    });
  });
};

console.log("Hello world.");

// Take notes button

// card: syntax to save it as a note for anki

// show (toggle-able) stockfish and lichess opening database statistics

// converge to lichess study?
