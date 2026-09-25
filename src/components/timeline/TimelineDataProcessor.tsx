import { useEffect, useState } from "react";
import { SavedGameClient } from "../../database/SavedGameClient";
import { GradualRepertoireClient, SavedGame } from "../../database";
import generateTimelineData, { TimelineDay } from "./generateTimelineData";
import { GRBWorkerProvider, useGRBWorkers } from "../GRBWorkerContext";
import TimelineDayComponent from "./TimelineDayComponent";

export default function () {
  const [cachedGames, setCachedGames] = useState<SavedGame[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineDay[]>([]);

  const [processedDays, setProcessedDays] = useState<string[]>([]);

  const { requestGRBDiff } = useGRBWorkers();
  function updateGames() {
    SavedGameClient.getAll()
      .then((games) => {
        setCachedGames(games);

        // let offset = games.length > 100 ? games.length - 100 : 0;

        // const slice = games.slice(offset);

        GradualRepertoireClient.getAll().then((repertoires) => {
          const newTimeline = generateTimelineData(games, repertoires).slice(
            0,
            10,
          );
          setTimelineData(newTimeline);

          if (newTimeline.length > 1 && newTimeline[0]) {
            requestGRBDiff(
              [...newTimeline[0].results, ...newTimeline[1].results],
              repertoires,
              ["MCTodd", "LeosEmporiumTV", "agneaux"],
            );
            console.log("Requested GRB Diff");
          }
        });
      })
      .catch((e) => {
        console.log("Unable to retrieve cached games.", e);
      });
  }

  useEffect(() => {
    setTimeout(updateGames, 300);
  }, []);

  const days: React.ReactElement[] = [];
  timelineData.forEach((day) => {
    const singleDay = <TimelineDayComponent day={day} />;

    days.push(singleDay);
  });

  return (
    <div className="cc-timeline">
      <h2>Timeline</h2>
      {days}
    </div>
  );
}
