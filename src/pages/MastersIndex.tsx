// Want to store in dexie

// hierarchy will be /masters/{mastername}
// these pgns can be large-ish so storage in IndexedDB is preferable.
// We should display the size and allow the user to remove a repertoire while maintaining access to their notes.
// later

// for now we can just mash it in there
// prototype we can even use localstorage

import { useNavigate } from "react-router";

const masters = ["Morphy", "Steinitz", "Lasker", "Capablanca", "Alekhine"];

export default function MastersIndex() {
  const navigate = useNavigate();
  return (
    <ul>
      <li>
        <a href="/book-it#/book-it/masters/morphy">Morphy</a>
      </li>
      <li>
        <a href="/book-it#/book-it/masters/steinitz">Steinitz</a>
      </li>
      <li>
        <a href="/book-it#/book-it/masters/lasker">Lasker</a>
      </li>
      <li>
        <a href="/book-it#/book-it/masters/capablanca">Capablanca</a>
      </li>
      <li>
        <a href="/book-it#/book-it/masters/alekhine">Alekhine</a>
      </li>
    </ul>
  );
}
