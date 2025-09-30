import { Filter } from "bad-words";
const filter = new Filter();

export const checkBadWord=(word)=>{
  return !filter.isProfane(word)
}