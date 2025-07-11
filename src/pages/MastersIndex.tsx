

// Want to store in dexie

// hierarchy will be /masters/{mastername}
// these pgns can be large-ish so storage in IndexedDB is preferable. 
// We should display the size and allow the user to remove a repertoire while maintaining access to their notes.
// later

// for now we can just mash it in there
// prototype we can even use localstorage

import { useEffect, useState } from 'react';
import morphy from './Morphy.pgn?url';
import pgnParser, { ParsedPGN } from 'pgn-parser';
import { ProgressSpinner } from 'primereact/progressspinner';
import { DataTable } from 'primereact/datatable';
import getKeyValueHeaders from '../pgn/getKeyValueHeaders';
import { Column } from 'primereact/column';
import { getItemDexie, setItemDexie } from '../storage';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router';


const masters = [
    'Morphy',
    'Lasker',
    'Capablanca',
    'Alekhine'
]

export default function MastersIndex() {
    const navigate = useNavigate();

    const [morphyGames, setMorphyGames] = useState<ParsedPGN[]>([]);
    const [ columns, setColumns ] = useState<string[]>([]);

    useEffect(() => {

        async function test() {
            
            let morphyGames = await getItemDexie("morphyGames");

            console.log("Dexie returned", morphyGames)

            if (!morphyGames || morphyGames.length === 0) {
                const res = await fetch(morphy);
                const text = await res.text();

                console.log("Retrieved morphy successfully.")
                const parsedPGNs: ParsedPGN[] = pgnParser.parse(text)

                await setItemDexie("morphyGames", parsedPGNs);

                morphyGames = parsedPGNs;
            }

            setMorphyGames(morphyGames.map(getKeyValueHeaders).map((kvHeaders, index) => { kvHeaders.ID = index; return kvHeaders }));

            if (morphyGames.length) {
                const exampleHeaders = getKeyValueHeaders(morphyGames[0])

                setColumns(Object.keys(exampleHeaders).filter(header => ["Site", "Round", "WhiteElo", "BlackElo"].indexOf(header) === -1))
            }
        }
        test();
    }, []);
// later:


    const test = { 'morphy': 'morphy.pgn' }

    const makeLink = (rowData) => {
        return <a target="_blank" href={`https://chessopenings.com/eco/${rowData.ECO}/`}>{rowData.ECO}</a>
    }

    const actionButton = (rowData) => {
        return <Button onClick={() => {
            const target = "/book-it/masters/morphy/" + rowData.ID;
            console.log("What up", target)
            debugger;

            navigate(target)

        }} label={"annotate"} />
    }

    let renderedColumns = columns.map(columnName => <Column field={columnName} sortable header={columnName} body={columnName === "ECO" && makeLink} />)

    const morphyIndex = <DataTable value={morphyGames}>
        {renderedColumns}
        <Column body={actionButton} header=""></Column>
    </DataTable>

    return morphyGames?.length ? morphyIndex : <ProgressSpinner/>;
}


