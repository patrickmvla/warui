export type UserStatistics =
  | "COUNT_ASC"
  | "COUNT_DESC"
  | "SCORE_ASC"
  | "SCORE_DESC";

export interface UserData {
  name: string;
  avatar: {
    large: string;
  };
  statistics: UserStatistics;
}

export enum MediaListStatus {
  CURRENT = "CURRENT",
  PLANNING = "PLANNING",
  COMPLETED = "COMPLETED",
  REPEATING = "REPEATING",
  PAUSED = "PAUSED",
  DROPPED = "DROPPED",
}
