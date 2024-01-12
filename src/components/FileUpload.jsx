import {Chess} from 'chess.js'

import {useEffect} from 'react';

import { setItemGZIP } from '../storage';

import processNewRepertoire from '../integrations/processNewRepertoire';

const FileUpload = ({repertoire, setRepertoire, newRepertoireNameField, setNewRepertoireNameField, repertoireList, setRepertoireList}) => {

    function handleFile(event) {
        const fileInput = event.target;
        const file = fileInput.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = function (e) {
                const fileContents = e.target.result;
                //console.log("File Contents as String:", fileContents);

                processNewRepertoire(fileContents, {repertoire, setRepertoire, newRepertoireNameField, setNewRepertoireNameField, repertoireList, setRepertoireList})

            };

            // Read the file as a text
            reader.readAsText(file);
        }
    }

    return <form>
        <label for="fileInput">Choose a file below.</label>
        <br></br>
        <input type="file" id="fileInput" name="fileInput" onChange={handleFile}></input>
    </form>
}

export default FileUpload;