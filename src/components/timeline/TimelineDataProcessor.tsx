import { useEffect, useState } from "react";
import { SavedGameClient } from "../../database/SavedGameClient";
import { GradualRepertoireClient, SavedGame } from "../../database";
import generateTimelineData from "./generateTimelineData";
import { GRBWorkerProvider, useGRBWorkers } from "../GRBWorkerContext";
import TimelineDayComponent from "./TimelineDayComponent";
import OpeningAnalysis from "./OpeningAnalysis";
import { TimelineDay } from "./types";

type ViewMode = "Timeline" | "Analysis";

export default function () {
  const [cachedGames, setCachedGames] = useState<SavedGame[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineDay[]>([]);

  const [processedDays, setProcessedDays] = useState<string[]>([]);
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>("Timeline");

  const { requestGRBDiff } = useGRBWorkers();
  function updateGames() {
    SavedGameClient.getAll()
      .then((games) => {
        setCachedGames(games);

        // let offset = games.length > 100 ? games.length - 100 : 0;

        // const slice = games.slice(offset);

        GradualRepertoireClient.getAll().then((repertoires) => {
          const newTimeline = generateTimelineData(games);
          setTimelineData(newTimeline);

          if (newTimeline.length > 1 && newTimeline[0]) {
            requestGRBDiff(games, repertoires, [
              "MCTodd",
              "LeosEmporiumTV",
              "agneaux",
            ]);
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
  timelineData.slice(0, 10).forEach((day) => {
    const singleDay = <TimelineDayComponent day={day} />;

    days.push(singleDay);
  });

  const timelineContent = (
    <>
      <h2>Timeline</h2>
      <button
        onClick={() => {
          setCurrentViewMode("Analysis");
        }}
      >
        Analysis
      </button>
      {days}
    </>
  );

  const openingAnalysisContent = (
    <>
      <h2>Opening Analysis</h2>
      <button
        onClick={() => {
          setCurrentViewMode("Timeline");
        }}
      >
        Timeline
      </button>
      <OpeningAnalysis />
    </>
  );

  const innerComponent =
    currentViewMode === "Timeline" ? timelineContent : openingAnalysisContent;

  return <div className="cc-timeline">{innerComponent}</div>;
}
