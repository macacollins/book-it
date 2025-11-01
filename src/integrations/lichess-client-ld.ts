// Generated TypeScript client for Lichess.org API reference
// Version: 2.0.93
// Auto-generated from OpenAPI specification

export type Flair = string;

export type Title =
  | "GM"
  | "WGM"
  | "IM"
  | "WIM"
  | "FM"
  | "WFM"
  | "NM"
  | "CM"
  | "WCM"
  | "WNM"
  | "LM"
  | "BOT";

export type PatronColor = number;

export interface TopUser {
  id: string;
  username: string;
  perfs?: { [key: string]: { rating: number; progress: number } };
  title?: Title;
  patron?: boolean;
  online?: boolean;
}

export type PerfTop10 = TopUser[];

export interface Top10s {
  bullet: PerfTop10;
  blitz: PerfTop10;
  rapid: PerfTop10;
  classical: PerfTop10;
  ultraBullet: PerfTop10;
  crazyhouse: PerfTop10;
  chess960: PerfTop10;
  kingOfTheHill: PerfTop10;
  threeCheck: PerfTop10;
  antichess: PerfTop10;
  atomic: PerfTop10;
  horde: PerfTop10;
  racingKings: PerfTop10;
}

export interface Leaderboard {
  users: TopUser[];
}

export interface Perf {
  games: number;
  rating: number;
  /** rating deviation */
  rd: number;
  prog: number;
  /** only appears if a user's perf rating are [provisional](https://lichess.org/faq#provisional) */
  prov?: boolean;
}

export interface PuzzleModePerf {
  runs: number;
  score: number;
}

export interface Perfs {
  chess960?: Perf;
  atomic?: Perf;
  racingKings?: Perf;
  ultraBullet?: Perf;
  blitz?: Perf;
  kingOfTheHill?: Perf;
  threeCheck?: Perf;
  antichess?: Perf;
  crazyhouse?: Perf;
  bullet?: Perf;
  correspondence?: Perf;
  horde?: Perf;
  puzzle?: Perf;
  classical?: Perf;
  rapid?: Perf;
  storm?: PuzzleModePerf;
  racer?: PuzzleModePerf;
  streak?: PuzzleModePerf;
}

export interface Profile {
  flag?: string;
  location?: string;
  bio?: string;
  realName?: string;
  /** only appears if a user has set them */
  fideRating?: number;
  /** only appears if a user has set them */
  uscfRating?: number;
  /** only appears if a user has set them */
  ecfRating?: number;
  /** only appears if a user has set them */
  cfcRating?: number;
  /** only appears if a user has set them */
  rcfRating?: number;
  /** only appears if a user has set them */
  dsbRating?: number;
  links?: string;
}

export interface PlayTime {
  total: number;
  tv: number;
}

export interface User {
  id: string;
  username: string;
  perfs?: Perfs;
  title?: Title;
  flair?: Flair;
  createdAt?: number;
  /** only appears if a user's account is closed */
  disabled?: boolean;
  /** only appears if a user's account is marked for the violation of [Lichess TOS](https://lichess.org/terms-of-service) */
  tosViolation?: boolean;
  profile?: Profile;
  seenAt?: number;
  playTime?: PlayTime;
  patron?: boolean;
  patronColor?: PatronColor;
  verified?: boolean;
}

export interface Count {
  all: number;
  rated: number;
  ai?: number;
  draw: number;
  drawH?: number;
  loss: number;
  lossH?: number;
  win: number;
  winH?: number;
  bookmark: number;
  playing: number;
  import: number;
  me: number;
}

export interface UserStreamer {
  twitch?: { channel?: string };
  youTube?: { channel?: string };
}

export type UserExtended = User & {
  url: string;
  playing?: string;
  count?: Count;
  streaming?: boolean;
  streamer?: UserStreamer;
  followable?: boolean;
  following?: boolean;
  blocking?: boolean;
};

export interface RatingHistoryEntry {
  name?: string;
  points?: number[][];
}

export type RatingHistory = RatingHistoryEntry[];

export type PerfType =
  | "ultraBullet"
  | "bullet"
  | "blitz"
  | "rapid"
  | "classical"
  | "correspondence"
  | "chess960"
  | "crazyhouse"
  | "antichess"
  | "atomic"
  | "horde"
  | "kingOfTheHill"
  | "racingKings"
  | "threeCheck";

export interface LightUser {
  id: string;
  name: string;
  flair?: Flair;
  title?: Title;
  patron?: boolean;
  patronColor?: PatronColor;
}

export interface PerfStat {
  user: { name: string };
  perf: {
    glicko?: { rating?: number; deviation?: number; provisional?: boolean };
    nb?: number;
    progress?: number;
  };
  rank: any;
  percentile: number;
  stat: {
    highest?: { int: number; at: string; gameId: string };
    lowest?: { int: number; at: string; gameId: string };
    bestWins: {
      results: {
        opRating: number;
        opId: LightUser;
        at: string;
        gameId: string;
      }[];
    };
    worstLosses: {
      results: {
        opRating: number;
        opId: LightUser;
        at: string;
        gameId: string;
      }[];
    };
    count: {
      all: number;
      rated: number;
      win: number;
      loss: number;
      draw: number;
      tour: number;
      berserk: number;
      opAvg: number;
      seconds: number;
      disconnects: number;
    };
    resultStreak: {
      win: {
        cur: {
          v: number;
          from?: { at: string; gameId: string };
          to?: { at: string; gameId: string };
        };
        max: {
          v: number;
          from?: { at: string; gameId: string };
          to?: { at: string; gameId: string };
        };
      };
      loss: {
        cur: {
          v: number;
          from?: { at: string; gameId: string };
          to?: { at: string; gameId: string };
        };
        max: {
          v: number;
          from?: { at: string; gameId: string };
          to?: { at: string; gameId: string };
        };
      };
    };
    playStreak: {
      nb: {
        cur: { v: number };
        max: {
          v: number;
          from?: { at: string; gameId: string };
          to?: { at: string; gameId: string };
        };
      };
      time: {
        cur: { v: number };
        max: {
          v: number;
          from?: { at: string; gameId: string };
          to?: { at: string; gameId: string };
        };
      };
      lastDate?: string;
    };
  };
}

export interface UserActivityScore {
  win: number;
  loss: number;
  draw: number;
  rp: { before: number; after: number };
}

export type GameColor = "white" | "black";

export type VariantKey =
  | "standard"
  | "chess960"
  | "crazyhouse"
  | "antichess"
  | "atomic"
  | "horde"
  | "kingOfTheHill"
  | "racingKings"
  | "threeCheck"
  | "fromPosition";

export interface UserActivityCorrespondenceGame {
  id: string;
  color: GameColor;
  url: string;
  variant?: VariantKey;
  speed?: string;
  perf?: string;
  rated?: boolean;
  opponent: { user: string; rating: number };
}

export interface UserActivityFollowList {
  ids: string[];
  nb?: number;
}

export interface UserActivity {
  interval: { start: number; end: number };
  games?: {
    chess960?: UserActivityScore;
    atomic?: UserActivityScore;
    racingKings?: UserActivityScore;
    ultraBullet?: UserActivityScore;
    blitz?: UserActivityScore;
    kingOfTheHill?: UserActivityScore;
    bullet?: UserActivityScore;
    correspondence?: UserActivityScore;
    horde?: UserActivityScore;
    puzzle?: UserActivityScore;
    classical?: UserActivityScore;
    rapid?: UserActivityScore;
  };
  puzzles?: { score?: UserActivityScore };
  storm?: PuzzleModePerf;
  racer?: PuzzleModePerf;
  streak?: PuzzleModePerf;
  tournaments?: {
    nb?: number;
    best?: {
      tournament: { id: string; name: string };
      nbGames: number;
      score: number;
      rank: number;
      rankPercent: number;
    }[];
  };
  practice?: { url: string; name: string; nbPositions: number }[];
  simuls?: string[];
  correspondenceMoves?: { nb: number; games: UserActivityCorrespondenceGame[] };
  correspondenceEnds?: {
    correspondence: {
      score: UserActivityScore;
      games: UserActivityCorrespondenceGame[];
    };
  };
  follows?: { in?: UserActivityFollowList; out?: UserActivityFollowList };
  studies?: { id: string; name: string }[];
  teams?: { url: string; name: string; flair?: Flair }[];
  posts?: {
    topicUrl: string;
    topicName: string;
    posts: { url: string; text: string }[];
  }[];
  patron?: { months: number };
  stream?: boolean;
}

export interface PuzzleAndGame {
  game: {
    clock: string;
    id: string;
    perf: { key: PerfType; name: string };
    pgn: string;
    players: {
      color: GameColor;
      flair?: Flair;
      id: string;
      name: string;
      patron?: boolean;
      patronColor?: PatronColor;
      rating: number;
      title?: Title;
    }[];
    rated: boolean;
  };
  puzzle: {
    id: string;
    initialPly: number;
    plays: number;
    rating: number;
    solution: string[];
    themes: string[];
  };
}

export interface PuzzleBatchSelect {
  puzzles?: PuzzleAndGame[];
}

export interface PuzzleBatchSolveRequest {
  solutions?: { id?: string; win?: boolean; rated?: boolean }[];
}

export interface PuzzleBatchSolveResponse {
  puzzles?: PuzzleAndGame[];
  rounds?: any[];
}

export interface PuzzleActivity {
  date: number;
  puzzle: {
    fen: string;
    id: string;
    lastMove: string;
    plays: number;
    rating: number;
    solution: string[];
    themes: string[];
  };
  win: boolean;
}

export interface PuzzleReplay {
  replay: { days: number; theme: string; nb: number; remaining: string[] };
  angle: { key: string; name: string; desc: string };
}

export interface PuzzlePerformance {
  firstWins: number;
  nb: number;
  performance: number;
  puzzleRatingAvg: number;
  replayWins: number;
}

export interface PuzzleDashboard {
  days: number;
  global: PuzzlePerformance;
  themes: { [key: string]: { results: PuzzlePerformance; theme: string } };
}

export interface PuzzleStormDashboard {
  days: {
    _id: string;
    combo: number;
    errors: number;
    highest: number;
    moves: number;
    runs: number;
    score: number;
    time: number;
  }[];
  high: { allTime: number; day: number; month: number; week: number };
}

export interface PuzzleRacer {
  id: string;
  url: string;
}

export interface PuzzleRaceResults {
  /** Unique identifier of the puzzle race */
  id: string;
  /** Owner of the puzzle race */
  owner: string;
  /** List of players participating in the race */
  players: {
    name: string;
    score: number;
    id?: string;
    flair?: string;
    patron?: boolean;
    patronColor?: PatronColor;
  }[];
  /** List of puzzles in the race */
  puzzles: { id: string; fen: string; line: string; rating: number }[];
  /** Timestamp in milliseconds when the race finishes */
  finishesAt: number;
  /** Timestamp in milliseconds when the race started */
  startsAt: number;
}

export type NotFound = any;

export interface UserPreferences {
  dark?: boolean;
  transp?: boolean;
  bgImg?: string;
  is3d?: boolean;
  theme?:
    | "blue"
    | "blue2"
    | "blue3"
    | "blue-marble"
    | "canvas"
    | "wood"
    | "wood2"
    | "wood3"
    | "wood4"
    | "maple"
    | "maple2"
    | "brown"
    | "leather"
    | "green"
    | "marble"
    | "green-plastic"
    | "grey"
    | "metal"
    | "olive"
    | "newspaper"
    | "purple"
    | "purple-diag"
    | "pink"
    | "ic";
  pieceSet?:
    | "cburnett"
    | "merida"
    | "alpha"
    | "pirouetti"
    | "chessnut"
    | "chess7"
    | "reillycraig"
    | "companion"
    | "riohacha"
    | "kosal"
    | "leipzig"
    | "fantasy"
    | "spatial"
    | "california"
    | "pixel"
    | "maestro"
    | "fresca"
    | "cardinal"
    | "gioco"
    | "tatiana"
    | "staunty"
    | "governor"
    | "dubrovny"
    | "icpieces"
    | "shapes"
    | "letter";
  theme3d?:
    | "Black-White-Aluminium"
    | "Brushed-Aluminium"
    | "China-Blue"
    | "China-Green"
    | "China-Grey"
    | "China-Scarlet"
    | "Classic-Blue"
    | "Gold-Silver"
    | "Light-Wood"
    | "Power-Coated"
    | "Rosewood"
    | "Marble"
    | "Wax"
    | "Jade"
    | "Woodi";
  pieceSet3d?:
    | "Basic"
    | "Wood"
    | "Metal"
    | "RedVBlue"
    | "ModernJade"
    | "ModernWood"
    | "Glass"
    | "Trimmed"
    | "Experimental"
    | "Staunton"
    | "CubesAndPi";
  soundSet?:
    | "silent"
    | "standard"
    | "piano"
    | "nes"
    | "sfx"
    | "futuristic"
    | "robot"
    | "music"
    | "speech";
  blindfold?: number;
  autoQueen?: number;
  autoThreefold?: number;
  takeback?: number;
  moretime?: number;
  clockTenths?: number;
  clockBar?: boolean;
  clockSound?: boolean;
  premove?: boolean;
  animation?: number;
  pieceNotation?: number;
  captured?: boolean;
  follow?: boolean;
  highlight?: boolean;
  destination?: boolean;
  coords?: number;
  replay?: number;
  challenge?: number;
  message?: number;
  submitMove?: number;
  confirmResign?: number;
  insightShare?: number;
  keyboardMove?: number;
  voiceMove?: boolean;
  zen?: number;
  ratings?: number;
  moveEvent?: number;
  rookCastle?: number;
  flairs?: boolean;
  /** 0 = No, 1 = When losing, 2 = When losing or drawing */
  sayGG?: "0" | "1" | "2";
}

export type Ok = any;

export interface TimelineEntryFollow {
  type: "follow";
  date: number;
  data: { u1: string; u2: string };
}

export interface TimelineEntryTeamJoin {
  type: "team-join";
  date: number;
  data: { userId: string; teamId: string };
}

export interface TimelineEntryTeamCreate {
  type: "team-create";
  date: number;
  data: { userId: string; teamId: string };
}

export interface TimelineEntryForumPost {
  type: "forum-post";
  date: number;
  data: { userId: string; topicId: string; topicName: string; postId: string };
}

export interface TimelineEntryBlogPost {
  type: "blog-post";
  date: number;
  data: { id: string; slug: string; title: string };
}

export interface TimelineEntryUblogPost {
  type: "ublog-post";
  date: number;
  data: { userId: string; id: string; slug: string; title: string };
}

export interface TimelineEntryTourJoin {
  type: "tour-join";
  date: number;
  data: { userId: string; tourId: string; tourName: string };
}

export interface TimelineEntryGameEnd {
  type: "game-end";
  date: number;
  data: { fullId: string; opponent: string; win: boolean; perf: PerfType };
}

export interface TimelineEntrySimul {
  type: "simul-create" | "simul-join";
  date: number;
  data: { userId: string; simulId: string; simulName: string };
}

export interface TimelineEntryStudyLike {
  type: "study-like";
  date: number;
  data: { userId: string; studyId: string; studyName: string };
}

export interface TimelineEntryPlanStart {
  type: "plan-start";
  date: number;
  data: { userId: string };
}

export interface TimelineEntryPlanRenew {
  type: "plan-renew";
  date: number;
  data: { userId: string; months: number };
}

export interface TimelineEntryUblogPostLike {
  type: "ublog-post-like";
  date: number;
  data: { userId: string; id: string; title: string };
}

export interface TimelineEntryStreamStart {
  type: "stream-start";
  date: number;
  data: { id: string; title?: string };
}

export interface Timeline {
  entries:
    | TimelineEntryFollow
    | TimelineEntryTeamJoin
    | TimelineEntryTeamCreate
    | TimelineEntryForumPost
    | TimelineEntryBlogPost
    | TimelineEntryUblogPost
    | TimelineEntryTourJoin
    | TimelineEntryGameEnd
    | TimelineEntrySimul
    | TimelineEntryStudyLike
    | TimelineEntryPlanStart
    | TimelineEntryPlanRenew
    | TimelineEntryUblogPostLike
    | TimelineEntryStreamStart[];
  users: {
    [key: string]: {
      id: string;
      name: string;
      title?: Title;
      flair?: Flair;
      patron?: boolean;
      patronColor?: PatronColor;
    };
  };
}

export type GamePgn = string;

export type Speed =
  | "ultraBullet"
  | "bullet"
  | "blitz"
  | "rapid"
  | "classical"
  | "correspondence";

export type GameStatusName =
  | "created"
  | "started"
  | "aborted"
  | "mate"
  | "resign"
  | "stalemate"
  | "timeout"
  | "draw"
  | "outoftime"
  | "cheat"
  | "noStart"
  | "unknownFinish"
  | "insufficientMaterialClaim"
  | "variantEnd";

export interface GamePlayerUser {
  user: LightUser;
  rating: number;
  ratingDiff?: number;
  name?: string;
  provisional?: boolean;
  aiLevel?: number;
  analysis?: {
    inaccuracy: number;
    mistake: number;
    blunder: number;
    acpl: number;
    accuracy?: number;
  };
  team?: string;
}

export interface GamePlayers {
  white: GamePlayerUser;
  black: GamePlayerUser;
}

export interface GameOpening {
  eco: string;
  name: string;
  ply: number;
}

export interface GameMoveAnalysis {
  /** Evaluation in centipawns */
  eval?: number;
  /** Number of moves until forced mate */
  mate?: number;
  /** Best move in UCI notation (only if played move was inaccurate) */
  best?: string;
  /** Best variation in SAN notation (only if played move was inaccurate) */
  variation?: string;
  /** Judgment annotation (only if played move was inaccurate) */
  judgment?: { name?: "Inaccuracy" | "Mistake" | "Blunder"; comment?: string };
}

export interface GameJson {
  id: string;
  rated: boolean;
  variant: VariantKey;
  speed: Speed;
  perf: string;
  createdAt: number;
  lastMoveAt: number;
  status: GameStatusName;
  source?: string;
  players: GamePlayers;
  initialFen?: string;
  winner?: GameColor;
  opening?: GameOpening;
  moves?: string;
  pgn?: string;
  daysPerTurn?: number;
  analysis?: GameMoveAnalysis[];
  tournament?: string;
  swiss?: string;
  clock?: { initial: number; increment: number; totalTime: number };
  clocks?: number[];
  division?: { middle?: number; end?: number };
}

export type GameStatusId =
  | "10"
  | "20"
  | "25"
  | "30"
  | "31"
  | "32"
  | "33"
  | "34"
  | "35"
  | "36"
  | "37"
  | "38"
  | "39"
  | "60";

export interface GameStreamGame {
  id: string;
  rated?: boolean;
  variant?: VariantKey;
  speed?: Speed;
  perf?: PerfType;
  createdAt?: number;
  status?: GameStatusId;
  statusName?: GameStatusName;
  clock?: { initial?: number; increment?: number; totalTime?: number };
  players?: {
    white?: { userId?: string; rating?: number };
    black?: { userId?: string; rating?: number };
  };
  winner?: GameColor;
}

export type GameStream = GameStreamGame[];

export type GameSource =
  | "lobby"
  | "friend"
  | "ai"
  | "api"
  | "tournament"
  | "position"
  | "import"
  | "importlive"
  | "simul"
  | "relay"
  | "pool"
  | "arena"
  | "swiss";

export interface Variant {
  key: VariantKey;
  name: string;
  short?: string;
}

export interface GameStatus {
  id: GameStatusId;
  name: GameStatusName;
}

export type MoveStreamEntry =
  | {
      id: string;
      variant?: Variant;
      speed?: Speed;
      perf?: PerfType;
      rated?: boolean;
      initialFen?: string;
      fen?: string;
      player?: GameColor;
      turns?: number;
      startedAtTurn?: number;
      source?: GameSource;
      status?: GameStatus;
      createdAt?: number;
      lastMove?: string;
      players?: GamePlayers;
    }
  | { fen: string; lm?: string; wc: number; bc: number };

export type MoveStream = MoveStreamEntry[];

export interface TvGame {
  user: LightUser;
  rating: number;
  gameId: string;
  color: GameColor;
}

export interface TvFeedFeatured {
  /** The type of message.
A summary of the game is sent as the first message and when the featured game changes.
Subsequent messages are just the FEN, last move, and clocks.
 */
  t: string;
  /** The data of the message */
  d: {
    id: string;
    orientation: GameColor;
    players: {
      color: GameColor;
      user: LightUser;
      rating: number;
      seconds: number;
    }[];
    fen: string;
  };
}

export interface TvFeedFen {
  /** The type of message.
A summary of the game is sent as the first message and when the featured game changes.
Subsequent messages are just the FEN, last move, and clocks.
 */
  t: string;
  /** The data of the message */
  d: { fen: string; lm: string; wc: number; bc: number };
}

export type TvFeed = TvFeedFeatured | TvFeedFen;

export interface Clock {
  limit: number;
  increment: number;
}

export type ArenaStatus = "10" | "20" | "30";

export interface ArenaPerf {
  key: PerfType;
  name: string;
  position: number;
  icon?: string;
}

export interface ArenaRatingObj {
  perf?: PerfType;
  rating: number;
}

export type ArenaPosition =
  | { eco: string; name: string; fen: string; url: string }
  | { name: string; fen: string };

export interface ArenaTournament {
  id: string;
  createdBy: string;
  system: string;
  minutes: number;
  clock: Clock;
  rated: boolean;
  fullName: string;
  nbPlayers: number;
  variant: Variant;
  startsAt: number;
  finishesAt: number;
  status: ArenaStatus;
  perf: ArenaPerf;
  secondsToStart?: number;
  hasMaxRating?: boolean;
  maxRating?: ArenaRatingObj;
  minRating?: ArenaRatingObj;
  minRatedGames?: { nb?: number };
  botsAllowed?: boolean;
  minAccountAgeInDays?: number;
  onlyTitled?: boolean;
  teamMember?: string;
  private?: boolean;
  position?: ArenaPosition;
  schedule?: { freq?: string; speed?: string };
  teamBattle?: { teams?: string[]; nbLeaders?: number };
  winner?: LightUser;
}

export interface ArenaTournaments {
  created: ArenaTournament[];
  started: ArenaTournament[];
  finished: ArenaTournament[];
}

export type FromPositionFEN = string;

export interface Verdict {
  condition: string;
  verdict: string;
}

export interface Verdicts {
  accepted: boolean;
  list: Verdict[];
}

export interface ArenaSheet {
  scores: string;
  fire?: boolean;
}

export interface ArenaTournamentFull {
  id: string;
  fullName: string;
  rated?: boolean;
  spotlight?: { headline?: string };
  berserkable?: boolean;
  onlyTitled?: boolean;
  clock: Clock;
  minutes?: number;
  createdBy?: string;
  system?: string;
  secondsToStart?: number;
  secondsToFinish?: number;
  isFinished?: boolean;
  isRecentlyFinished?: boolean;
  pairingsClosed?: boolean;
  startsAt?: string;
  nbPlayers: number;
  verdicts?: Verdicts;
  /** The quote displayed on the tournament page */
  quote?: { text?: string; author?: string };
  greatPlayer?: { name?: string; url?: string };
  /** List of usernames allowed to join the tournament */
  allowList?: string[];
  hasMaxRating?: boolean;
  maxRating?: ArenaRatingObj;
  minRating?: ArenaRatingObj;
  minRatedGames?: { nb?: number };
  botsAllowed?: boolean;
  minAccountAgeInDays?: number;
  perf?: { icon: string; key: string; name: string };
  schedule?: { freq: string; speed: string };
  description?: string;
  variant?: string;
  duels?: { id?: string; p?: { n?: string; r?: number; k?: number }[] }[];
  standing?: {
    page?: number;
    players?: {
      name?: string;
      title?: Title;
      patron?: boolean;
      patronColor?: PatronColor;
      flair?: Flair;
      rank?: number;
      rating?: number;
      score?: number;
      sheet?: ArenaSheet;
    }[];
  };
  featured?: {
    id?: string;
    fen?: string;
    orientation?: string;
    color?: string;
    lastMove?: string;
    white?: { name?: string; id?: string; rank?: number; rating?: number };
    black?: { name?: string; id?: string; rank?: number; rating?: number };
    c?: { white?: number; black?: number };
  };
  podium?: {
    name?: string;
    title?: Title;
    patron?: boolean;
    patronColor?: PatronColor;
    flair?: Flair;
    rank?: number;
    rating?: number;
    score?: number;
    nb?: { game?: number; berserk?: number; win?: number };
    performance?: number;
  }[];
  stats?: {
    games: number;
    moves: number;
    whiteWins: number;
    blackWins: number;
    draws: number;
    berserks: number;
    averageRating: number;
  };
  myUsername?: string;
}

export interface Error {
  /** The cause of the error. */
  error: string;
}

export interface ArenaTournamentPlayer {
  games: number;
  score: number;
  rank: number;
  performance?: number;
}

export interface ArenaTournamentPlayed {
  tournament: ArenaTournament;
  player: ArenaTournamentPlayer;
}

export type SwissFromPositionFEN = string;

export type SwissStatus = "created" | "started" | "finished";

export interface SwissTournament {
  id: string;
  createdBy: string;
  startsAt: string;
  name: string;
  clock: { limit: number; increment: number };
  variant: string;
  round: number;
  nbRounds: number;
  nbPlayers: number;
  nbOngoing: number;
  status: SwissStatus;
  stats?: {
    games: number;
    whiteWins: number;
    blackWins: number;
    draws: number;
    byes: number;
    absences: number;
    averageRating: number;
  };
  rated: boolean;
  verdicts: Verdicts;
  nextRound?: { at?: string; in?: number };
}

export type SwissUnauthorisedEdit = any;

export type StudyPgn = string;

export interface StudyImportPgnChapters {
  chapters?: {
    id?: string;
    name?: string;
    players?: { name?: any; rating?: number }[];
    status?: string;
  }[];
}

export interface StudyMetadata {
  /** The study ID */
  id: string;
  /** The study name */
  name: string;
  /** The study creation date */
  createdAt: number;
  /** The study last update date */
  updatedAt: number;
}

export interface BroadcastTour {
  id: string;
  name: string;
  slug: string;
  createdAt: number;
  /** Start and end dates of the tournament, as Unix timestamps in milliseconds */
  dates?: number[];
  /** Additional display information about the tournament */
  info?: {
    website?: string;
    players?: string;
    location?: string;
    tc?: string;
    fideTc?: "standard" | "rapid" | "blitz";
    timeZone?: string;
    standings?: string;
    format?: string;
  };
  /** Used to designate featured tournaments on Lichess */
  tier?: number;
  image?: string;
  /** Full tournament description in markdown format, or in HTML if the html=1 query parameter is set. */
  description?: string;
  leaderboard?: boolean;
  teamTable?: boolean;
  url: string;
  communityOwner?: LightUser;
}

export interface BroadcastGroupTour {
  id: string;
  name: string;
  active: boolean;
  live: boolean;
}

export interface BroadcastGroup {
  id: string;
  slug: string;
  name: string;
  tours: BroadcastGroupTour[];
}

export type BroadcastCustomPoints = number;

export interface BroadcastCustomPointsPerColor {
  win: BroadcastCustomPoints;
  draw: BroadcastCustomPoints;
}

/** Scoring overrides for wins or draws. */
export interface BroadcastCustomScoring {
  white: BroadcastCustomPointsPerColor;
  black: BroadcastCustomPointsPerColor;
}

export interface BroadcastRoundInfo {
  id: string;
  name: string;
  slug: string;
  createdAt: number;
  /** Whether the round is used for rating calculations */
  rated: boolean;
  ongoing?: boolean;
  startsAt?: number;
  /** The start date/time is unknown and the round will start automatically when the previous round completes */
  startsAfterPrevious?: boolean;
  finishedAt?: number;
  finished?: boolean;
  url: string;
  delay?: number;
  customScoring?: BroadcastCustomScoring;
}

export interface BroadcastWithRounds {
  tour: BroadcastTour;
  group?: BroadcastGroup;
  rounds: BroadcastRoundInfo[];
  defaultRoundId?: string;
}

export interface BroadcastWithLastRound {
  group?: string;
  tour?: BroadcastTour;
  round?: BroadcastRoundInfo;
}

export interface BroadcastTop {
  active?: BroadcastWithLastRound[];
  upcoming?: BroadcastWithLastRound[];
  past?: {
    currentPage?: number;
    maxPerPage?: number;
    currentPageResults?: BroadcastWithLastRound[];
    previousPage?: any;
    nextPage?: any;
  };
}

export interface BroadcastByUser {
  tour: BroadcastTour;
}

export type BroadcastTiebreakExtendedCode =
  | "AOB"
  | "APPO"
  | "APRO"
  | "ARO"
  | "ARO-C1"
  | "ARO-C2"
  | "ARO-M1"
  | "ARO-M2"
  | "BH"
  | "BH-C1"
  | "BH-C2"
  | "BH-M1"
  | "BH-M2"
  | "BPG"
  | "BWG"
  | "DE"
  | "FB"
  | "FB-C1"
  | "FB-C2"
  | "FB-M1"
  | "FB-M2"
  | "KS"
  | "PS"
  | "PS-C1"
  | "PS-C2"
  | "PS-M1"
  | "PS-M2"
  | "PTP"
  | "SB"
  | "SB-C1"
  | "SB-C2"
  | "SB-M1"
  | "SB-M2"
  | "TPR"
  | "WON";

export interface BroadcastPlayerWithFed {
  name: string;
  title?: Title;
  rating?: number;
  fideId?: number;
  team?: string;
  fed?: string;
}

export interface BroadcastPlayerTiebreak {
  extendedCode: BroadcastTiebreakExtendedCode;
  description: string;
  points: number;
}

export type BroadcastPlayerEntry = BroadcastPlayerWithFed & {
  score?: number;
  played?: number;
  ratingDiff?: number;
  performance?: number;
  tiebreaks?: BroadcastPlayerTiebreak[];
  rank?: number;
};

export interface BroadcastGameEntry {
  /** ID of the round */
  round: string;
  /** The game ID. Analogous to chapterId. */
  id: string;
  opponent: BroadcastPlayerWithFed;
  color: GameColor;
  points?: "1" | "1/2" | "0";
  customPoints?: BroadcastCustomPoints;
  /** The change in rating for the player as a result of this game */
  ratingDiff?: number;
}

export type BroadcastPlayerEntryWithFideAndGames = BroadcastPlayerEntry & {
  fide?: {
    year?: number;
    ratings?: {
      standard?: number;
      rapid?: number;
      blitz?: number;
    };
  };
  games?: BroadcastGameEntry[];
};

export type BroadcastRoundFormName = string;

export interface BroadcastRoundStudyInfo {
  /** Whether the currently authenticated user has permission to update the study */
  writeable?: boolean;
  features?: { chat?: boolean; computer?: boolean; explorer?: boolean };
}

export interface BroadcastRoundNew {
  round: BroadcastRoundInfo;
  tour: BroadcastTour;
  study: BroadcastRoundStudyInfo;
}

export interface BroadcastRoundGame {
  id: string;
  name: string;
  fen?: string;
  players?: {
    name?: string;
    title?: Title;
    rating?: number;
    fideId?: number;
    fed?: string;
    clock?: number;
  }[];
  lastMove?: string;
  check?: "+" | "#";
  thinkTime?: number;
  /** The result of the game */
  status?: "*" | "1-0" | "0-1" | "½-½";
}

export interface BroadcastRound {
  round: BroadcastRoundInfo;
  tour: BroadcastTour;
  study: BroadcastRoundStudyInfo;
  games: BroadcastRoundGame[];
  group?: BroadcastGroup;
  /** Indicates if the user making the request is subscribed to the broadcast */
  isSubscribed?: boolean;
}

export type BroadcastPgnPushTags = { [key: string]: string };

export interface BroadcastPgnPush {
  games: { tags: BroadcastPgnPushTags; moves?: number; error?: string }[];
}

export interface BroadcastMyRound {
  round: BroadcastRoundInfo;
  tour: BroadcastTour;
  study: BroadcastRoundStudyInfo;
}

export interface FIDEPlayer {
  id: number;
  name: string;
  title?: Title;
  federation: string;
  year?: any;
  inactive?: number;
  standard?: number;
  rapid?: number;
  blitz?: number;
}

export interface Simul {
  id: string;
  host: LightUser & {
    rating?: number;
    provisional?: boolean;
    gameId?: string;
    online?: boolean;
  };
  name: string;
  fullName: string;
  variants: { key?: VariantKey; icon?: string; name?: string }[];
  isCreated: boolean;
  isFinished: boolean;
  isRunning: boolean;
  text?: string;
  estimatedStartAt?: number;
  startedAt?: number;
  finishedAt?: number;
  nbApplicants: number;
  nbPairings: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  flair?: Flair;
  leader?: LightUser;
  leaders?: LightUser[];
  nbMembers?: number;
  open?: boolean;
  joined?: boolean;
  requested?: boolean;
}

export interface TeamPaginatorJson {
  currentPage: number;
  maxPerPage: number;
  currentPageResults: Team[];
  previousPage: any;
  nextPage: any;
  nbResults: number;
  nbPages: number;
}

export type ArenaStatusName = "created" | "started" | "finished";

export interface TeamRequest {
  teamId: string;
  userId: string;
  date: number;
  message?: string;
}

export interface TeamRequestWithUser {
  request: TeamRequest;
  user: User;
}

export interface Crosstable {
  users: any;
  nbGames: number;
}

export type LightUserOnline = LightUser & any;

export interface UserNote {
  from?: LightUser;
  to?: LightUser;
  text?: string;
  date?: number;
}

export type GameEventOpponent =
  | { id: string; username: string; rating: number; ratingDiff?: number }
  | { id: any; username: string; ai: number };

export interface GameCompat {
  /** Compatible with Bot API */
  bot?: boolean;
  /** Compatible with Board API */
  board?: boolean;
}

export interface GameEventInfo {
  fullId: string;
  gameId: string;
  fen?: string;
  color?: GameColor;
  lastMove?: string;
  source?: GameSource;
  status?: GameStatus;
  variant?: Variant;
  speed?: Speed;
  perf?: string;
  rated?: boolean;
  hasMoved?: boolean;
  opponent?: GameEventOpponent;
  isMyTurn?: boolean;
  secondsLeft?: number;
  winner?: GameColor;
  ratingDiff?: number;
  compat?: GameCompat;
  id?: string;
  tournamentId?: string;
}

export interface GameStartEvent {
  type: string;
  game: GameEventInfo;
}

export interface GameFinishEvent {
  type: string;
  game: GameEventInfo;
}

export type ChallengeStatus =
  | "created"
  | "offline"
  | "canceled"
  | "declined"
  | "accepted";

export interface ChallengeUser {
  id: string;
  name: string;
  rating?: number;
  title?: Title;
  flair?: Flair;
  patron?: boolean;
  patronColor?: PatronColor;
  provisional?: boolean;
  online?: boolean;
  lag?: number;
}

export type TimeControl =
  | { type?: string; limit?: number; increment?: number; show?: string }
  | { type?: string; daysPerTurn?: number }
  | { type?: string };

export type ChallengeColor = "white" | "black" | "random";

export interface ChallengeJson {
  id: string;
  url: string;
  status: ChallengeStatus;
  challenger: ChallengeUser;
  destUser: ChallengeUser | any;
  variant: Variant;
  rated: boolean;
  speed: Speed;
  timeControl: TimeControl;
  color: ChallengeColor;
  finalColor?: GameColor;
  perf: { icon: string; name: string };
  direction?: "in" | "out";
  initialFen?: string;
  rematchOf?: string;
}

export interface ChallengeEvent {
  type: string;
  challenge: ChallengeJson;
  compat?: GameCompat;
}

export interface ChallengeCanceledEvent {
  type: string;
  challenge: ChallengeJson;
}

export type ChallengeDeclinedJson = ChallengeJson & {
  declineReason: string;
  declineReasonKey:
    | "generic"
    | "later"
    | "toofast"
    | "tooslow"
    | "timecontrol"
    | "rated"
    | "casual"
    | "standard"
    | "variant"
    | "nobot"
    | "onlybot";
};

export interface ChallengeDeclinedEvent {
  type: string;
  challenge: ChallengeDeclinedJson;
}

export interface GameEventPlayer {
  aiLevel?: number;
  id: string;
  name: string;
  title?: Title | any;
  rating?: number;
  provisional?: boolean;
}

export interface GameStateEvent {
  type: string;
  /** Current moves in UCI format (King to rook for Chess690-compatible castling
notation)
 */
  moves: string;
  /** Integer of milliseconds White has left on the clock */
  wtime: number;
  /** Integer of milliseconds Black has left on the clock */
  btime: number;
  /** Integer of White Fisher increment. */
  winc: number;
  /** Integer of Black Fisher increment. */
  binc: number;
  status: GameStatusName;
  /** Color of the winner, if any */
  winner?: GameColor;
  /** true if white is offering draw, else omitted */
  wdraw?: boolean;
  /** true if black is offering draw, else omitted */
  bdraw?: boolean;
  /** true if white is proposing takeback, else omitted */
  wtakeback?: boolean;
  /** true if black is proposing takeback, else omitted */
  btakeback?: boolean;
}

export interface GameFullEvent {
  type: string;
  id: string;
  variant: Variant;
  clock?: { initial?: number; increment?: number };
  speed: Speed;
  perf: { name?: string };
  rated: boolean;
  createdAt: number;
  white: GameEventPlayer;
  black: GameEventPlayer;
  initialFen: string;
  state: GameStateEvent;
  /** If the game is correspondence */
  daysPerTurn?: number;
  tournamentId?: string;
}

export interface ChatLineEvent {
  type: string;
  room: "player" | "spectator";
  username: string;
  text: string;
}

export interface OpponentGoneEvent {
  type: string;
  gone: boolean;
  claimWinInSeconds?: number;
}

export type GameChat = { text: string; user: string }[];

export interface ChallengeOpenJson {
  id: string;
  url: string;
  status: ChallengeStatus;
  challenger: any;
  destUser: any;
  variant: Variant;
  rated: boolean;
  speed: Speed;
  timeControl: TimeControl;
  color: ChallengeColor;
  finalColor?: GameColor;
  perf: { icon?: string; name?: string };
  initialFen?: string;
  urlWhite: string;
  urlBlack: string;
  open: { userIds?: string[] };
}

export interface BulkPairing {
  id: string;
  games: { id?: string; black?: string; white?: string }[];
  variant: VariantKey;
  clock: Clock;
  pairAt: number;
  pairedAt: any;
  rated: boolean;
  startClocksAt: number;
  scheduledAt: number;
}

export interface CloudEval {
  depth: number;
  fen: string;
  knodes: number;
  pvs: { cp: number; moves: string } | { mate: number; moves: string }[];
}

export type UciVariant =
  | "chess"
  | "crazyhouse"
  | "antichess"
  | "atomic"
  | "horde"
  | "kingofthehill"
  | "racingkings"
  | "3check";

export interface ExternalEngine {
  /** Unique engine registration ID. */
  id: string;
  /** Display name of the engine. */
  name: string;
  /** A secret token that can be used to
[*request* analysis](#tag/External-engine/operation/apiExternalEngineAnalyse)
from this external engine.
 */
  clientSecret: string;
  /** The user this engine has been registered for. */
  userId: string;
  /** Maximum number of available threads. */
  maxThreads: number;
  /** Maximum available hash table size, in MiB. */
  maxHash: number;
  /** List of supported chess variants. */
  variants: UciVariant[];
  /** Arbitrary data that the engine provider can use for identification
or bookkeeping.

Users can read this information, but updating it requires knowing
or changing the `providerSecret`.
 */
  providerData?: any;
}

export interface ExternalEngineRegistration {
  /** Display name of the engine. */
  name: string;
  /** Maximum number of available threads. */
  maxThreads: number;
  /** Maximum available hash table size, in MiB. */
  maxHash: number;
  /** Optional list of supported chess variants. */
  variants?: UciVariant[];
  /** A random token that can be used to
[wait for analysis requests](#tag/External-engine/operation/apiExternalEngineAcquire)
and provide analysis.

The engine provider should securely generate a random string.

The token will not be readable again, even by the user.

The analysis provider can register multiple engines with the same
token, even for different users, and wait for analysis requests
from any of them. In this case, the request must not be made via
CORS, so that the token is not revealed to any of the users.
 */
  providerSecret: string;
  /** Arbitrary data that the engine provider can use for identification
or bookkeeping.

Users can read this information, but updating it requires knowing
or changing the `providerSecret`.
 */
  providerData?: string;
}

export interface ExternalEngineWorkCommon {
  /** Arbitary string that identifies the analysis session.
Providers may wish to clear the hash table between sessions.
 */
  sessionId: string;
  /** Number of threads to use for analysis. */
  threads: number;
  /** Hash table size to use for analysis, in MiB. */
  hash: number;
  /** Requested number of principal variations. */
  multiPv: number;
  variant: UciVariant;
  /** Initial position of the game. */
  initialFen: string;
  /** List of moves played from the initial position, in UCI notation. */
  moves: string[];
}

export type ExternalEngineWork =
  | ({ movetime: number } & ExternalEngineWorkCommon)
  | ({ depth: number } & ExternalEngineWorkCommon)
  | ({ nodes: number } & ExternalEngineWorkCommon);

export interface OAuthError {
  /** The cause of the error. */
  error: string;
  /** The reason why the request was rejected. */
  error_description?: string;
}

export interface OpeningExplorerOpening {
  eco: string;
  name: string;
}

export interface OpeningExplorerGamePlayer {
  name: string;
  rating: number;
}

export interface OpeningExplorerMastersGame {
  id: string;
  winner: GameColor | any;
  white: OpeningExplorerGamePlayer;
  black: OpeningExplorerGamePlayer;
  year: number;
  month?: string;
}

export interface OpeningExplorerMasters {
  opening: OpeningExplorerOpening | any;
  white: number;
  draws: number;
  black: number;
  moves: any[];
  topGames: { uci: string } & OpeningExplorerMastersGame[];
}

export interface OpeningExplorerLichessGame {
  id: string;
  winner: GameColor | any;
  speed?: Speed;
  white: OpeningExplorerGamePlayer;
  black: OpeningExplorerGamePlayer;
  year: number;
  month: any;
}

export interface OpeningExplorerLichess {
  opening: OpeningExplorerOpening | any;
  white: number;
  draws: number;
  black: number;
  moves: {
    uci: string;
    san: string;
    averageRating: number;
    white: number;
    draws: number;
    black: number;
    game: OpeningExplorerLichessGame | any;
    opening: OpeningExplorerOpening | any;
  }[];
  topGames: { uci: string } & OpeningExplorerLichessGame[];
  recentGames?: { uci: string } & OpeningExplorerLichessGame[];
  history?: { month: string; white: number; draws: number; black: number }[];
}

export interface OpeningExplorerPlayerGame {
  id: string;
  winner: GameColor | any;
  speed: Speed;
  mode: "rated" | "casual";
  white: OpeningExplorerGamePlayer;
  black: OpeningExplorerGamePlayer;
  year: number;
  month: string;
}

export interface OpeningExplorerPlayer {
  opening: OpeningExplorerOpening | any;
  /** Waiting for other players to be indexed first */
  queuePosition: number;
  white: number;
  draws: number;
  black: number;
  moves: {
    uci: string;
    san: string;
    averageOpponentRating: number;
    performance: number;
    white: number;
    draws: number;
    black: number;
    game: OpeningExplorerPlayerGame | any;
    opening: OpeningExplorerOpening | any;
  }[];
  recentGames: { uci: string } & OpeningExplorerPlayerGame[];
}

export interface TablebaseMove {
  uci: string;
  san: string;
  category:
    | "loss"
    | "unknown"
    | "syzygy-loss"
    | "maybe-loss"
    | "blessed-loss"
    | "draw"
    | "cursed-win"
    | "maybe-win"
    | "syzygy-win"
    | "win";
  dtz?: any;
  precise_dtz?: any;
  dtc?: any;
  dtm?: any;
  dtw?: any;
  zeroing?: boolean;
  conversion?: boolean;
  checkmate?: boolean;
  stalemate?: boolean;
  variant_win?: boolean;
  variant_loss?: boolean;
  insufficient_material?: boolean;
}

export interface TablebaseJson {
  /** `cursed-win` and `blessed-loss` means the 50-move rule prevents
the decisive result.

`syzygy-win` and `syzygy-loss` means exact result is unknown due to
[DTZ rounding](https://syzygy-tables.info/metrics#dtz), i.e., the
win or loss could also be prevented by the 50-move rule if
the user has deviated from the tablebase recommendation since the
last pawn move or capture.

`maybe-win` and `maybe-loss` means the result with regard to the
50-move rule is unknown, because DTZ is unknown and the DTC tablebase
does not guarantee to reach a zeroing move as soon as possible.
 */
  category:
    | "win"
    | "unknown"
    | "syzygy-win"
    | "maybe-win"
    | "cursed-win"
    | "draw"
    | "blessed-loss"
    | "maybe-loss"
    | "syzygy-loss"
    | "loss";
  /** [DTZ50'' with rounding](https://syzygy-tables.info/metrics#dtz) in plies
(for Standard chess positions with not more than 7 pieces and variant
positions not more than 6 pieces)
 */
  dtz?: any;
  /** DTZ50'' in plies, only if guaranteed to not be rounded, or absent if unknown
   */
  precise_dtz?: any;
  /** Experimental Depth to Conversion: Moves to next capture, promotion,
or checkmate. Available for:
* Standard chess positions with 8 pieces, more than one pawn of material
  value for each side, and at least one pair of opposing pawns,
  short *op1*, if query parameter `dtc` is `auxiliary` or `always`.
* Some standard chess positions with up to 7 pieces, if query parameter
  `dtc` is `always`. Work in progress.
 */
  dtc?: any;
  /** Depth To Mate: Plies to mate (available only for Standard positions
with not more than 5 pieces)
 */
  dtm?: any;
  /** Depth To Win: Plies to win (available only for Antichess positions
with not more than 4 pieces)
 */
  dtw?: any;
  checkmate?: boolean;
  stalemate?: boolean;
  /** Only in chess variants */
  variant_win?: boolean;
  /** Only in chess variants */
  variant_loss?: boolean;
  insufficient_material?: boolean;
  /** Information about legal moves, best first */
  moves: TablebaseMove[];
}

export class LichessClient {
  private baseURL: string;
  private authToken?: string;

  constructor(baseURL: string = "https://lichess.org", authToken?: string) {
    this.baseURL = baseURL;
    this.authToken = authToken;
  }

  private async makeRequest<T>(
    path: string,
    method: string = "GET",
    body?: any,
    headers: Record<string, string> = {},
  ): Promise<T> {
    const url = `${this.baseURL}${path}`;

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };
    ``;

    if (this.authToken) {
      requestHeaders["Authorization"] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    return response.text() as unknown as T;
  }

  /**
   * Get real-time users status
   */
  async apiUsersStatus(options: {
    ids: string;
    withSignal?: boolean;
    withGameIds?: boolean;
    withGameMetas?: boolean;
  }): Promise<
    {
      id: string;
      name: string;
      flair?: Flair;
      title?: Title;
      online?: boolean;
      playing?: boolean;
      streaming?: boolean;
      patron?: boolean;
      patronColor?: PatronColor;
    }[]
  > {
    const queryParams = new URLSearchParams();
    if (options?.ids !== undefined)
      queryParams.append("ids", String(options.ids));
    if (options?.withSignal !== undefined)
      queryParams.append("withSignal", String(options?.withSignal));
    if (options?.withGameIds !== undefined)
      queryParams.append("withGameIds", String(options?.withGameIds));
    if (options?.withGameMetas !== undefined)
      queryParams.append("withGameMetas", String(options?.withGameMetas));
    const queryString = queryParams.toString();
    const fullPath = queryString
      ? `/api/users/status?${queryString}`
      : "/api/users/status";
    const headers: Record<string, string> = {};
    return this.makeRequest<
      {
        id: string;
        name: string;
        flair?: Flair;
        title?: Title;
        online?: boolean;
        playing?: boolean;
        streaming?: boolean;
        patron?: boolean;
        patronColor?: PatronColor;
      }[]
    >(fullPath, "GET", headers);
  }

  /**
   * Get all top 10
   */
  async player(): Promise<Top10s> {
    const fullPath = "/api/player";
    const headers: Record<string, string> = {};
    return this.makeRequest<Top10s>(fullPath, "GET", headers);
  }

  /**
   * Get one leaderboard
   */
  async playerTopNbPerfType(
    nb: number,
    perfType:
      | "ultraBullet"
      | "bullet"
      | "blitz"
      | "rapid"
      | "classical"
      | "chess960"
      | "crazyhouse"
      | "antichess"
      | "atomic"
      | "horde"
      | "kingOfTheHill"
      | "racingKings"
      | "threeCheck",
  ): Promise<Leaderboard> {
    const fullPath = "/api/player/top/${nb}/${perfType}";
    const headers: Record<string, string> = {};
    return this.makeRequest<Leaderboard>(fullPath, "GET", headers);
  }

  /**
   * Get user public data
   */
  async apiUser(
    username: string,
    options?: { trophies?: boolean },
  ): Promise<UserExtended> {
    const queryParams = new URLSearchParams();
    if (options?.trophies !== undefined)
      queryParams.append("trophies", String(options?.trophies));
    const queryString = queryParams.toString();
    const fullPath = queryString
      ? `/api/user/${username}?${queryString}`
      : "/api/user/${username}";
    const headers: Record<string, string> = {};
    return this.makeRequest<UserExtended>(fullPath, "GET", headers);
  }

  /**
   * Get rating history of a user
   */
  async apiUserRatingHistory(username: string): Promise<RatingHistory> {
    const fullPath = "/api/user/${username}/rating-history";
    const headers: Record<string, string> = {};
    return this.makeRequest<RatingHistory>(fullPath, "GET", headers);
  }

  /**
   * Get performance statistics of a user
   */
  async apiUserPerf(username: string, perf: PerfType): Promise<PerfStat> {
    const fullPath = "/api/user/${username}/perf/${perf}";
    const headers: Record<string, string> = {};
    return this.makeRequest<PerfStat>(fullPath, "GET", headers);
  }

  /**
   * Get user activity
   */
  async apiUserActivity(username: string): Promise<UserActivity[]> {
    const fullPath = "/api/user/${username}/activity";
    const headers: Record<string, string> = {};
    return this.makeRequest<UserActivity[]>(fullPath, "GET", headers);
  }

  /**
   * Get the daily puzzle
   */
  async apiPuzzleDaily(): Promise<PuzzleAndGame> {
    const fullPath = "/api/puzzle/daily";
    const headers: Record<string, string> = {};
    return this.makeRequest<PuzzleAndGame>(fullPath, "GET", headers);
  }

  /**
   * Get a puzzle by its ID
   */
  async apiPuzzleId(id: string): Promise<PuzzleAndGame> {
    const fullPath = "/api/puzzle/${id}";
    const headers: Record<string, string> = {};
    return this.makeRequest<PuzzleAndGame>(fullPath, "GET", headers);
  }

  /**
   * Get a new puzzle
   */
  async apiPuzzleNext(options?: {
    angle?: string;
    difficulty?: "easiest" | "easier" | "normal" | "harder" | "hardest";
    color?: "white" | "black";
  }): Promise<PuzzleAndGame> {
    const queryParams = new URLSearchParams();
    if (options?.angle !== undefined)
      queryParams.append("angle", String(options?.angle));
    if (options?.difficulty !== undefined)
      queryParams.append("difficulty", String(options?.difficulty));
    if (options?.color !== undefined)
      queryParams.append("color", String(options?.color));
    const queryString = queryParams.toString();
    const fullPath = queryString
      ? `/api/puzzle/next?${queryString}`
      : "/api/puzzle/next";
    const headers: Record<string, string> = {};
    return this.makeRequest<PuzzleAndGame>(fullPath, "GET", headers);
  }

  /**
   * Get multiple puzzles at once
   */
  async apiPuzzleBatchSelect(
    angle: string,
    options?: {
      difficulty?: "easiest" | "easier" | "normal" | "harder" | "hardest";
      nb?: number;
      color?: "white" | "black";
    },
  ): Promise<PuzzleBatchSelect> {
    const queryParams = new URLSearchParams();
    if (options?.difficulty !== undefined)
      queryParams.append("difficulty", String(options?.difficulty));
    if (options?.nb !== undefined)
      queryParams.append("nb", String(options?.nb));
    if (options?.color !== undefined)
      queryParams.append("color", String(options?.color));
    const queryString = queryParams.toString();
    const fullPath = queryString
      ? `/api/puzzle/batch/${angle}?${queryString}`
      : "/api/puzzle/batch/${angle}";
    const headers: Record<string, string> = {};
    return this.makeRequest<PuzzleBatchSelect>(fullPath, "GET", headers);
  }

  /**
   * Solve multiple puzzles at once
   */
  async apiPuzzleBatchSolve(
    angle: string,
    options: { nb?: number },
    body: PuzzleBatchSolveRequest,
  ): Promise<PuzzleBatchSolveResponse> {
    const queryParams = new URLSearchParams();
    if (options?.nb !== undefined)
      queryParams.append("nb", String(options?.nb));
    const queryString = queryParams.toString();
    const fullPath = queryString
      ? `/api/puzzle/batch/${angle}?${queryString}`
      : "/api/puzzle/batch/${angle}";
    const headers: Record<string, string> = {};
    return this.makeRequest<PuzzleBatchSolveResponse>(
      fullPath,
      "POST",
      body,
      headers,
    );
  }

  /**
   * Get your puzzle activity
   */
  async apiPuzzleActivity(options?: {
    max?: number;
    before?: number;
  }): Promise<PuzzleActivity> {
    const queryParams = new URLSearchParams();
    if (options?.max !== undefined)
      queryParams.append("max", String(options?.max));
    if (options?.before !== undefined)
      queryParams.append("before", String(options?.before));
    const queryString = queryParams.toString();
    const fullPath = queryString
      ? `/api/puzzle/activity?${queryString}`
      : "/api/puzzle/activity";
    const headers: Record<string, string> = {};
    return this.makeRequest<PuzzleActivity>(fullPath, "GET", headers);
  }

  /**
   * Get puzzles to replay
   */
  async apiPuzzleReplay(days: number, theme: string): Promise<PuzzleReplay> {
    const fullPath = "/api/puzzle/replay/${days}/${theme}";
    const headers: Record<string, string> = {};
    return this.makeRequest<PuzzleReplay>(fullPath, "GET", headers);
  }

  /**
   * Get your puzzle dashboard
   */
  async apiPuzzleDashboard(days: number): Promise<PuzzleDashboard> {
    const fullPath = "/api/puzzle/dashboard/${days}";
    const headers: Record<string, string> = {};
    return this.makeRequest<PuzzleDashboard>(fullPath, "GET", headers);
  }

  /**
   * Get the storm dashboard of a player
   */
  async apiStormDashboard(
    username: string,
    options?: { days?: number },
  ): Promise<PuzzleStormDashboard> {
    const queryParams = new URLSearchParams();
    if (options?.days !== undefined)
      queryParams.append("days", String(options?.days));
    const queryString = queryParams.toString();
    const fullPath = queryString
      ? `/api/storm/dashboard/${username}?${queryString}`
      : "/api/storm/dashboard/${username}";
    const headers: Record<string, string> = {};
    return this.makeRequest<PuzzleStormDashboard>(fullPath, "GET", headers);
  }

  /**
   * Create and join a puzzle race
   */
  async racerPost(): Promise<PuzzleRacer> {
    const fullPath = "/api/racer";
    const headers: Record<string, string> = {};
    return this.makeRequest<PuzzleRacer>(fullPath, "POST", headers);
  }

  /**
   * Get puzzle race results
   */
  async racerGet(id: string): Promise<PuzzleRaceResults> {
    const fullPath = "/api/racer/${id}";
    const headers: Record<string, string> = {};
    return this.makeRequest<PuzzleRaceResults>(fullPath, "GET", headers);
  }

  /**
   * Get my profile
   */
  async accountMe(): Promise<UserExtended> {
    const fullPath = "/api/account";
    const headers: Record<string, string> = {};
    return this.makeRequest<UserExtended>(fullPath, "GET", headers);
  }

  /**
   * Get my email address
   */
  async accountEmail(): Promise<any> {
    const fullPath = "/api/account/email";
    const headers: Record<string, string> = {};
    return this.makeRequest<any>(fullPath, "GET", headers);
  }

  /**
   * Get my preferences
   */
  async account(): Promise<any> {
    const fullPath = "/api/account/preferences";
    const headers: Record<string, string> = {};
    return this.makeRequest<any>(fullPath, "GET", headers);
  }

  /**
   * Get my kid mode status
   */
  async accountKid(): Promise<any> {
    const fullPath = "/api/account/kid";
    const headers: Record<string, string> = {};
    return this.makeRequest<any>(fullPath, "GET", headers);
  }

  /**
   * Set my kid mode status
   */
  async accountKidPost(options: { v: boolean }): Promise<Ok> {
    const queryParams = new URLSearchParams();
    if (options.v !== undefined) queryParams.append("v", String(options.v));
    const queryString = queryParams.toString();
    const fullPath = queryString
      ? `/api/account/kid?${queryString}`
      : "/api/account/kid";
    const headers: Record<string, string> = {};
    return this.makeRequest<Ok>(fullPath, "POST", headers);
  }

  /**
   * Get my timeline
   */
  async timeline(options?: { since?: number; nb?: number }): Promise<Timeline> {
    const queryParams = new URLSearchParams();
    if (options?.since !== undefined)
      queryParams.append("since", String(options?.since));
    if (options?.nb !== undefined)
      queryParams.append("nb", String(options?.nb));
    const queryString = queryParams.toString();
    const fullPath = queryString
      ? `/api/timeline?${queryString}`
      : "/api/timeline";
    const headers: Record<string, string> = {};
    return this.makeRequest<Timeline>(fullPath, "GET", headers);
  }

  /**
   * Export one game
   */
  async gamePgn(
    gameId: string,
    options?: {
      moves?: boolean;
      pgnInJson?: boolean;
      tags?: boolean;
      clocks?: boolean;
      evals?: boolean;
      accuracy?: boolean;
      opening?: boolean;
      division?: boolean;
      literate?: boolean;
      withBookmarked?: boolean;
    },
  ): Promise<GameJson> {
    const queryParams = new URLSearchParams();
    if (options?.moves !== undefined)
      queryParams.append("moves", String(options?.moves));
    if (options?.pgnInJson !== undefined)
      queryParams.append("pgnInJson", String(options?.pgnInJson));
    if (options?.tags !== undefined)
      queryParams.append("tags", String(options?.tags));
    if (options?.clocks !== undefined)
      queryParams.append("clocks", String(options?.clocks));
    if (options?.evals !== undefined)
      queryParams.append("evals", String(options?.evals));
    if (options?.accuracy !== undefined)
      queryParams.append("accuracy", String(options?.accuracy));
    if (options?.opening !== undefined)
      queryParams.append("opening", String(options?.opening));
    if (options?.division !== undefined)
      queryParams.append("division", String(options?.division));
    if (options?.literate !== undefined)
      queryParams.append("literate", String(options?.literate));
    if (options?.withBookmarked !== undefined)
      queryParams.append("withBookmarked", String(options?.withBookmarked));
    const queryString = queryParams.toString();
    const fullPath = queryString
      ? `/game/export/${gameId}?${queryString}`
      : "/game/export/${gameId}";
    const headers: Record<string, string> = {};
    return this.makeRequest<GameJson>(fullPath, "GET", headers);
  }

  /**
   * Export ongoing game of a user
   */
  async apiUserCurrentGame(
    username: string,
    options?: {
      moves?: boolean;
      pgnInJson?: boolean;
      tags?: boolean;
      clocks?: boolean;
      evals?: boolean;
      accuracy?: boolean;
      opening?: boolean;
      division?: boolean;
      literate?: boolean;
    },
  ): Promise<GameJson> {
    const queryParams = new URLSearchParams();
    if (options?.moves !== undefined)
      queryParams.append("moves", String(options?.moves));
    if (options?.pgnInJson !== undefined)
      queryParams.append("pgnInJson", String(options?.pgnInJson));
    if (options?.tags !== undefined)
      queryParams.append("tags", String(options?.tags));
    if (options?.clocks !== undefined)
      queryParams.append("clocks", String(options?.clocks));
    if (options?.evals !== undefined)
      queryParams.append("evals", String(options?.evals));
    if (options?.accuracy !== undefined)
      queryParams.append("accuracy", String(options?.accuracy));
    if (options?.opening !== undefined)
      queryParams.append("opening", String(options?.opening));
    if (options?.division !== undefined)
      queryParams.append("division", String(options?.division));
    if (options?.literate !== undefined)
      queryParams.append("literate", String(options?.literate));
    const queryString = queryParams.toString();
    const fullPath = queryString
      ? `/api/user/${username}/current-game?${queryString}`
      : "/api/user/${username}/current-game";
    const headers: Record<string, string> = {};
    return this.makeRequest<GameJson>(fullPath, "GET", headers);
  }

  /**
   * Export games of a user
   */
  async apiGamesUser(
    username: string,
    options?: {
      since?: number;
      until?: number;
      max?: number;
      vs?: string;
      rated?: boolean;
      perfType?: PerfType & any;
      color?: "white" | "black";
      analysed?: boolean;
      moves?: boolean;
      pgnInJson?: boolean;
      tags?: boolean;
      clocks?: boolean;
      evals?: boolean;
      accuracy?: boolean;
      opening?: boolean;
      division?: boolean;
      ongoing?: boolean;
      finished?: boolean;
      literate?: boolean;
      lastFen?: boolean;
      withBookmarked?: boolean;
      sort?: "dateAsc" | "dateDesc";
    },
  ): Promise<GameJson> {
    const queryParams = new URLSearchParams();
    if (options?.since !== undefined)
      queryParams.append("since", String(options?.since));
    if (options?.until !== undefined)
      queryParams.append("until", String(options?.until));
    if (options?.max !== undefined)
      queryParams.append("max", String(options?.max));
    if (options?.vs !== undefined)
      queryParams.append("vs", String(options?.vs));
    if (options?.rated !== undefined)
      queryParams.append("rated", String(options?.rated));
    if (options?.perfType !== undefined)
      queryParams.append("perfType", String(options?.perfType));
    if (options?.color !== undefined)
      queryParams.append("color", String(options?.color));
    if (options?.analysed !== undefined)
      queryParams.append("analysed", String(options?.analysed));
    if (options?.moves !== undefined)
      queryParams.append("moves", String(options?.moves));
    if (options?.pgnInJson !== undefined)
      queryParams.append("pgnInJson", String(options?.pgnInJson));
    if (options?.tags !== undefined)
      queryParams.append("tags", String(options?.tags));
    if (options?.clocks !== undefined)
      queryParams.append("clocks", String(options?.clocks));
    if (options?.evals !== undefined)
      queryParams.append("evals", String(options?.evals));
    if (options?.accuracy !== undefined)
      queryParams.append("accuracy", String(options?.accuracy));
    if (options?.opening !== undefined)
      queryParams.append("opening", String(options?.opening));
    if (options?.division !== undefined)
      queryParams.append("division", String(options?.division));
    if (options?.ongoing !== undefined)
      queryParams.append("ongoing", String(options?.ongoing));
    if (options?.finished !== undefined)
      queryParams.append("finished", String(options?.finished));
    if (options?.literate !== undefined)
      queryParams.append("literate", String(options?.literate));
    if (options?.lastFen !== undefined)
      queryParams.append("lastFen", String(options?.lastFen));
    if (options?.withBookmarked !== undefined)
      queryParams.append("withBookmarked", String(options?.withBookmarked));
    if (options?.sort !== undefined)
      queryParams.append("sort", String(options?.sort));
    const queryString = queryParams.toString();
    const fullPath = queryString
      ? `/api/games/user/${username}?${queryString}`
      : "/api/games/user/${username}";
    const headers: Record<string, string> = {};
    return this.makeRequest<GameJson>(fullPath, "GET", headers);
  }

  /**
   * Export games by IDs
   */
  async gamesExportIds(options?: {
    moves?: boolean;
    pgnInJson?: boolean;
    tags?: boolean;
    clocks?: boolean;
    evals?: boolean;
    accuracy?: boolean;
    opening?: boolean;
    division?: boolean;
    literate?: boolean;
  }): Promise<GameJson> {
    const queryParams = new URLSearchParams();
    if (options?.moves !== undefined)
      queryParams.append("moves", String(options?.moves));
    if (options?.pgnInJson !== undefined)
      queryParams.append("pgnInJson", String(options?.pgnInJson));
    if (options?.tags !== undefined)
      queryParams.append("tags", String(options?.tags));
    if (options?.clocks !== undefined)
      queryParams.append("clocks", String(options?.clocks));
    if (options?.evals !== undefined)
      queryParams.append("evals", String(options?.evals));
    if (options?.accuracy !== undefined)
      queryParams.append("accuracy", String(options?.accuracy));
    if (options?.opening !== undefined)
      queryParams.append("opening", String(options?.opening));
    if (options?.division !== undefined)
      queryParams.append("division", String(options?.division));
    if (options?.literate !== undefined)
      queryParams.append("literate", String(options?.literate));
    const queryString = queryParams.toString();
    const fullPath = queryString
      ? `/api/games/export/_ids?${queryString}`
      : "/api/games/export/_ids";
    const headers: Record<string, string> = {};
    return this.makeRequest<GameJson>(fullPath, "POST", {}, headers);
  }

  /**
   * Stream games of users
   */
  async gamesByUsers(options?: {
    withCurrentGames?: boolean;
  }): Promise<GameStream> {
    const queryParams = new URLSearchParams();
    if (options?.withCurrentGames !== undefined)
      queryParams.append("withCurrentGames", String(options?.withCurrentGames));
    const queryString = queryParams.toString();
    const fullPath = queryString
      ? `/api/stream/games-by-users?${queryString}`
      : "/api/stream/games-by-users";
    const headers: Record<string, string> = {};
    return this.makeRequest<GameStream>(fullPath, "POST", {}, headers);
  }

  /**
   * Stream games by IDs
   */
  async gamesByIds(streamId: string): Promise<GameStream> {
    const fullPath = "/api/stream/games/${streamId}";
    const headers: Record<string, string> = {};
    return this.makeRequest<GameStream>(fullPath, "POST", {}, headers);
  }

  /**
   * Get my ongoing games
   */
  async apiAccountPlaying(options?: { nb?: number }): Promise<{
    nowPlaying: {
      fullId: string;
      gameId: string;
      fen: string;
      color: GameColor;
      lastMove: string;
      source: GameSource;
      status?: GameStatusName;
      variant: Variant;
      speed: Speed;
      perf: PerfType;
      rated: boolean;
      hasMoved: boolean;
      opponent: {
        id: string;
        username: string;
        rating?: number;
        ratingDiff?: number;
        ai?: number;
      };
      isMyTurn: boolean;
      secondsLeft: number;
      tournamentId?: string;
      swissId?: string;
      winner?: GameColor;
      ratingDiff?: number;
    }[];
  }> {
    const queryParams = new URLSearchParams();
    if (options?.nb !== undefined)
      queryParams.append("nb", String(options?.nb));
    const queryString = queryParams.toString();
    const fullPath = queryString
      ? `/api/account/playing?${queryString}`
      : "/api/account/playing";
    const headers: Record<string, string> = {};
    return this.makeRequest<{
      nowPlaying: {
        fullId: string;
        gameId: string;
        fen: string;
        color: GameColor;
        lastMove: string;
        source: GameSource;
        status?: GameStatusName;
        variant: Variant;
        speed: Speed;
        perf: PerfType;
        rated: boolean;
        hasMoved: boolean;
        opponent: {
          id: string;
          username: string;
          rating?: number;
          ratingDiff?: number;
          ai?: number;
        };
        isMyTurn: boolean;
        secondsLeft: number;
        tournamentId?: string;
        swissId?: string;
        winner?: GameColor;
        ratingDiff?: number;
      }[];
    }>(fullPath, "GET", headers);
  }

  /**
   * Import one game
   */
  async gameImport(): Promise<{ id?: string; url?: string }> {
    const fullPath = "/api/import";
    const headers: Record<string, string> = {};
    return this.makeRequest<{ id?: string; url?: string }>(
      fullPath,
      "POST",
      {},
      headers,
    );
  }

  /**
   * Export your imported games
   */
  async apiImportedGamesUser(): Promise<GamePgn> {
    const fullPath = "/api/games/export/imports";
    const headers: Record<string, string> = {};
    return this.makeRequest<GamePgn>(fullPath, "GET", headers);
  }

  /**
   * Export your bookmarked games
   */
  async apiExportBookmarks(options?: {
    since?: number;
    until?: number;
    max?: number;
    moves?: boolean;
    pgnInJson?: boolean;
    tags?: boolean;
    clocks?: boolean;
    evals?: boolean;
    accuracy?: boolean;
    opening?: boolean;
    division?: boolean;
    literate?: boolean;
    lastFen?: boolean;
    sort?: "dateAsc" | "dateDesc";
  }): Promise<GameJson> {
    const queryParams = new URLSearchParams();
    if (options?.since !== undefined)
      queryParams.append("since", String(options?.since));
    if (options?.until !== undefined)
      queryParams.append("until", String(options?.until));
    if (options?.max !== undefined)
      queryParams.append("max", String(options?.max));
    if (options?.moves !== undefined)
      queryParams.append("moves", String(options?.moves));
    if (options?.pgnInJson !== undefined)
      queryParams.append("pgnInJson", String(options?.pgnInJson));
    if (options?.tags !== undefined)
      queryParams.append("tags", String(options?.tags));
    if (options?.clocks !== undefined)
      queryParams.append("clocks", String(options?.clocks));
    if (options?.evals !== undefined)
      queryParams.append("evals", String(options?.evals));
    if (options?.accuracy !== undefined)
      queryParams.append("accuracy", String(options?.accuracy));
    if (options?.opening !== undefined)
      queryParams.append("opening", String(options?.opening));
    if (options?.division !== undefined)
      queryParams.append("division", String(options?.division));
    if (options?.literate !== undefined)
      queryParams.append("literate", String(options?.literate));
    if (options?.lastFen !== undefined)
      queryParams.append("lastFen", String(options?.lastFen));
    if (options?.sort !== undefined)
      queryParams.append("sort", String(options?.sort));
    const queryString = queryParams.toString();
    const fullPath = queryString
      ? `/api/games/export/bookmarks?${queryString}`
      : "/api/games/export/bookmarks";
    const headers: Record<string, string> = {};
    return this.makeRequest<GameJson>(fullPath, "GET", headers);
  }

  /**
   * Get current TV games
   */
  async tvChannels(): Promise<{
    bot: TvGame;
    blitz: TvGame;
    racingKings: TvGame;
    ultraBullet: TvGame;
    bullet: TvGame;
    classical: TvGame;
    threeCheck: TvGame;
    antichess: TvGame;
    computer: TvGame;
    horde: TvGame;
    rapid: TvGame;
    atomic: TvGame;
    crazyhouse: TvGame;
    chess960: TvGame;
    kingOfTheHill: TvGame;
    best: TvGame;
  }> {
    const fullPath = "/api/tv/channels";
    const headers: Record<string, string> = {};
    return this.makeRequest<{
      bot: TvGame;
      blitz: TvGame;
      racingKings: TvGame;
      ultraBullet: TvGame;
      bullet: TvGame;
      classical: TvGame;
      threeCheck: TvGame;
      antichess: TvGame;
      computer: TvGame;
      horde: TvGame;
      rapid: TvGame;
      atomic: TvGame;
      crazyhouse: TvGame;
      chess960: TvGame;
      kingOfTheHill: TvGame;
      best: TvGame;
    }>(fullPath, "GET", headers);
  }

  /**
   * Stream current TV game
   */
  async tvFeed(): Promise<TvFeed> {
    const fullPath = "/api/tv/feed";
    const headers: Record<string, string> = {};
    return this.makeRequest<TvFeed>(fullPath, "GET", headers);
  }

  /**
   * Stream current TV game of a TV channel
   */
  async tvChannelFeed(channel: string): Promise<TvFeed> {
    const fullPath = "/api/tv/${channel}/feed";
    const headers: Record<string, string> = {};
    return this.makeRequest<TvFeed>(fullPath, "GET", headers);
  }

  /**
   * Get best ongoing games of a TV channel
   */
  async tvChannelGames(
    channel: string,
    options?: {
      nb?: number;
      moves?: boolean;
      pgnInJson?: boolean;
      tags?: boolean;
      clocks?: boolean;
      opening?: boolean;
    },
  ): Promise<GameJson> {
    const queryParams = new URLSearchParams();
    if (options?.nb !== undefined)
      queryParams.append("nb", String(options?.nb));
    if (options?.moves !== undefined)
      queryParams.append("moves", String(options?.moves));
    if (options?.pgnInJson !== undefined)
      queryParams.append("pgnInJson", String(options?.pgnInJson));
    if (options?.tags !== undefined)
      queryParams.append("tags", String(options?.tags));
    if (options?.clocks !== undefined)
      queryParams.append("clocks", String(options?.clocks));
    if (options?.opening !== undefined)
      queryParams.append("opening", String(options?.opening));
    const queryString = queryParams.toString();
    const fullPath = queryString
      ? `/api/tv/${channel}?${queryString}`
      : "/api/tv/${channel}";
    const headers: Record<string, string> = {};
    return this.makeRequest<GameJson>(fullPath, "GET", headers);
  }

  /**
   * Get current tournaments
   */
  async apiTournament(): Promise<ArenaTournaments> {
    const fullPath = "/api/tournament";
    const headers: Record<string, string> = {};
    return this.makeRequest<ArenaTournaments>(fullPath, "GET", headers);
  }

  /**
   * Create a new Arena tournament
   */
  async apiTournamentPost(): Promise<ArenaTournamentFull> {
    const fullPath = "/api/tournament";
    const headers: Record<string, string> = {};
    return this.makeRequest<ArenaTournamentFull>(fullPath, "POST", {}, headers);
  }

  /**
   * Update an Arena tournament
   */
  async apiTournamentUpdate(): Promise<ArenaTournamentFull> {
    const fullPath = "/api/tournament/${id}";
    const headers: Record<string, string> = {};
    return this.makeRequest<ArenaTournamentFull>(fullPath, "POST", {}, headers);
  }

  /**
   * Join an Arena tournament
   */
  async apiTournamentJoin(id: string): Promise<Ok> {
    const fullPath = "/api/tournament/${id}/join";
    const headers: Record<string, string> = {};
    return this.makeRequest<Ok>(fullPath, "POST", {}, headers);
  }

  /**
   * Pause or leave an Arena tournament
   */
  async apiTournamentWithdraw(id: string): Promise<Ok> {
    const fullPath = "/api/tournament/${id}/withdraw";
    const headers: Record<string, string> = {};
    return this.makeRequest<Ok>(fullPath, "POST", headers);
  }

  /**
   * Terminate an Arena tournament
   */
  async apiTournamentTerminate(id: string): Promise<Ok> {
    const fullPath = "/api/tournament/${id}/terminate";
    const headers: Record<string, string> = {};
    return this.makeRequest<Ok>(fullPath, "POST", headers);
  }

  /**
   * Update a team battle
   */
  async apiTournamentTeamBattlePost(id: string): Promise<ArenaTournamentFull> {
    const fullPath = "/api/tournament/team-battle/${id}";
    const headers: Record<string, string> = {};
    return this.makeRequest<ArenaTournamentFull>(fullPath, "POST", {}, headers);
  }

  /**
   * Export games of an Arena tournament
   */
  async gamesByTournament(
    id: string,
    options?: {
      player?: string;
      moves?: boolean;
      pgnInJson?: boolean;
      tags?: boolean;
      clocks?: boolean;
      evals?: boolean;
      accuracy?: boolean;
      opening?: boolean;
      division?: boolean;
    },
  ): Promise<GameJson> {
    const queryParams = new URLSearchParams();
    if (options?.player !== undefined)
      queryParams.append("player", String(options?.player));
    if (options?.moves !== undefined)
      queryParams.append("moves", String(options?.moves));
    if (options?.pgnInJson !== undefined)
      queryParams.append("pgnInJson", String(options?.pgnInJson));
    if (options?.tags !== undefined)
      queryParams.append("tags", String(options?.tags));
    if (options?.clocks !== undefined)
      queryParams.append("clocks", String(options?.clocks));
    if (options?.evals !== undefined)
      queryParams.append("evals", String(options?.evals));
    if (options?.accuracy !== undefined)
      queryParams.append("accuracy", String(options?.accuracy));
    if (options?.opening !== undefined)
      queryParams.append("opening", String(options?.opening));
    if (options?.division !== undefined)
      queryParams.append("division", String(options?.division));
    const queryString = queryParams.toString();
    const fullPath = queryString
      ? `/api/tournament/${id}/games?${queryString}`
      : "/api/tournament/${id}/games";
    const headers: Record<string, string> = {};
    return this.makeRequest<GameJson>(fullPath, "GET", headers);
  } // Limiting to first 50 methods for manageable output

  // Note: Full API contains 179 methods total
}
