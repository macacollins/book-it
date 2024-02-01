import processNewRepertoire from '../integrations/processNewRepertoire';

import Repertoire from '../types/Repertoire';

interface FileUploadProps {
    repertoire: { [name: string]: Repertoire },
    setRepertoire: (newValue: { [name: string]: Repertoire }) => void,
    newRepertoireNameField : string,
    setNewRepertoireNameField: (newValue: string) => void,
    repertoireList: string[],
    setRepertoireList: (newValue: string[]) => void,
    children: string
}

const FileUpload = ({
                        repertoire,
                        setRepertoire,
                        newRepertoireNameField,
                        setNewRepertoireNameField,
                        repertoireList,
                        setRepertoireList,
                        children
                    }: FileUploadProps) => {
    function handleFile(event: { target: { files: FileList | null } }) {
        const fileInput = event.target;

        if (!fileInput.files || fileInput.files.length === 0) {
            return;
        }

        const file = fileInput.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = function (e) {
                const fileContents = e.target?.result;
                //console.log("File Contents as String:", fileContents);

                processNewRepertoire(fileContents, {
                    repertoire,
                    setRepertoire,
                    newRepertoireNameField,
                    setNewRepertoireNameField,
                    repertoireList,
                    setRepertoireList
                })

            };

            // Read the file as a text
            reader.readAsText(file);
        }
    }

    return <form>
        <label htmlFor="fileInput">Choose a file below.</label>
        <br></br>
        <input
            data-testid="repertoire-upload"
            type="file"
            id="fileInput"
            name="fileInput"
            onChange={handleFile}>
        </input>
    </form>
}

export default FileUpload;
