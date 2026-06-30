import { PlayerSchema } from "./schemas/player.schema";
import { TournamentSchema } from "./schemas/tournament.schema";
import { MatchSchema } from "./schemas/match.schema";
import { AdminSchema } from "./schemas/admin.schema";
import { GroupSchema } from "./schemas/group.schema";

export const dashboardModelMap = {
  Player: PlayerSchema,
  Tournament: TournamentSchema,
  Match: MatchSchema,
  Admin: AdminSchema,
  Group: GroupSchema,
} as const;
