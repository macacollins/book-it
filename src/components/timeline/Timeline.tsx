import { useState } from "react";
import { GRBWorkerProvider, useGRBWorkers } from "../GRBWorkerContext";

import TimelineDataProcessor from "./TimelineDataProcessor";

export default function () {
  return (
    <GRBWorkerProvider>
      <TimelineDataProcessor />
    </GRBWorkerProvider>
  );
}
