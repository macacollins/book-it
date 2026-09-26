import { Card } from "primereact/card";
import { PerOpeningViewModel } from "./types";
import { MeterGroup } from "primereact/metergroup";
import { Knob } from "primereact/knob";
interface GameAnalysisRowProps {
  viewModel: PerOpeningViewModel;
}

interface LevelDefinition {
  number: number;
  xpNeededForLevel: number;
  totalXPBeforeMe: number;
}

const rampFactor = 8;

let totalXP = 0;

const levels: LevelDefinition[] = [...Array(21).keys()]
  .slice(1)
  .map((item: number) => {
    const xpThisLevel = item * rampFactor;

    const finalResult: LevelDefinition = {
      number: item,
      xpNeededForLevel: xpThisLevel,
      totalXPBeforeMe: totalXP,
    };
    totalXP += xpThisLevel;

    return finalResult;
  });
console.log("Levels", levels);

export default function ({ viewModel }: GameAnalysisRowProps) {
  const valuesWinLoss = [
    { label: "Win", color: "#34d399", value: viewModel.win },
    { label: "Draw", color: "#fbbf24", value: viewModel.draw },
    { label: "Loss", color: "red", value: viewModel.loss },
  ];

  const valuesDivergence = [
    {
      label: "Opponent Diverged",
      color: "#34d399",
      value: viewModel.opponentDiverged,
    },
    { label: "User Diverged", color: "red", value: viewModel.userDiverged },
  ];

  let level = 0;
  let xpProgressTowardsNextLevel = 0;
  let xpProgressTotalForNextLevel = 0;

  for (let singleLevel of levels) {
    if (
      viewModel.totalXP >= singleLevel.totalXPBeforeMe &&
      viewModel.totalXP <
        singleLevel.totalXPBeforeMe + singleLevel.xpNeededForLevel
    ) {
      level = singleLevel.number;
      xpProgressTowardsNextLevel =
        viewModel.totalXP - singleLevel.totalXPBeforeMe;
      xpProgressTotalForNextLevel = singleLevel.xpNeededForLevel;
    }
  }

  return (
    <Card title={viewModel.name}>
      <div className="card flex gap-4 justify-content-center align-items-center">
        <div className="flex flex-column align-items-center">
          <Knob
            value={xpProgressTowardsNextLevel}
            max={xpProgressTotalForNextLevel}
            valueTemplate={`${level}`}
          ></Knob>
          <span></span>
        </div>

        <div className="flex flex-column gap-2">
          <MeterGroup values={valuesWinLoss} max={viewModel.totalXP} />{" "}
          <MeterGroup values={valuesDivergence} max={viewModel.totalXP} />
        </div>
      </div>
    </Card>
  );
}
