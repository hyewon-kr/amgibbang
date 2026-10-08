import type { StoryGenre, StoryPayload } from "../../schemas/story";
import { romanceFantasyStory } from "./romance-fantasy";
import { zombieStory } from "./zombie-apocalypse";
import { idolStory } from "./idol-entertainment";
import { mysteryStory } from "./mystery";
import { fantasyAcademyStory } from "./fantasy-academy";

export const mockStories = {
  romance_fantasy: romanceFantasyStory,
  zombie_apocalypse: zombieStory,
  idol_entertainment: idolStory,
  mystery: mysteryStory,
  fantasy_academy: fantasyAcademyStory,
} satisfies Record<StoryGenre, StoryPayload>;
