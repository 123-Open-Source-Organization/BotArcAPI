declare interface IArcBest30Result {
  last_played: number,
  best30_avg: number,
  recent10_avg: number,
  best30_list: Array<IArcScore>
}

declare interface IDatabaseArcBest30 {
  uid: number,
  last_played: number,
  best30_avg: number,
  recent10_avg: number,
  best30_list: string
}
