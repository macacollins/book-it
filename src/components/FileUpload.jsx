import {Chess} from 'chess.js'

import {useEffect} from 'react';

const FileUpload = ({setRepertoire}) => {
    useEffect(() => {
        function handleFile(event) {
            const fileInput = event.target;
            const file = fileInput.files[0];

            if (file) {
                const reader = new FileReader();

                reader.onload = function (e) {
                    const fileContents = e.target.result;
                    //console.log("File Contents as String:", fileContents);

                    const lines = fileContents.split('\n');


                    // { [fen]: [ line, line, line, line ] }
                    let fenRepo = {};


                    // Process each line in a for loop
                    for (let i = 0; i < lines.length; i++) {
                        const currentLine = lines[i].trim();

                        console.log(`Processing line ${i + 1}: ${currentLine}`);

                        let this_chess = new Chess();
                        this_chess.loadPgn(currentLine);

                        console.log(this_chess);

                        let history = this_chess.history();

                        let step_by_step_history = new Chess();

                        for (let j = 0; j < history.length; j++) {

                            step_by_step_history.move(history[j]);

                            if (fenRepo[step_by_step_history.fen()]) {
                                fenRepo[step_by_step_history.fen()].push(currentLine);
                            } else {
                                fenRepo[step_by_step_history.fen()] = [currentLine];
                            }
                        }


                    }

                    console.log("Setting repertoire");
                    setRepertoire(fenRepo);
                    localStorage.setItem('repertoire', JSON.stringify(fenRepo));

                };

                // Read the file as a text
                reader.readAsText(file);
            }
        }

        document.getElementById('fileInput').addEventListener('change', handleFile);
    }, [])

    return <form>
        <label for="fileInput">Choose a file:</label>
        <input type="file" id="fileInput" name="fileInput"></input>
    </form>
}

export default FileUpload;