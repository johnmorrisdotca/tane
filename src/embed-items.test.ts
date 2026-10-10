import { expect, it } from "vitest";
import { parsePickerItems } from "./element.ts";
it("reads newline or JSON lists, preserving duplicate entries and text safety",()=>{expect(parsePickerItems(" A\nB\n A ")).toEqual(["A","B","A"]);expect(parsePickerItems(JSON.stringify(['<img src=x>',"種"]))).toEqual(['<img src=x>',"種"]);});
it("rejects malformed, empty and oversized lists before mounting",()=>{for(const text of["","[]","[null]",'[1,"A"]','["  "]',"A".repeat(201),Array.from({length:201},()=>"A").join("\n")," ".repeat(20001)])expect(parsePickerItems(text)).toBeNull();expect(parsePickerItems(null)).toEqual(["A","B","C"]);});
