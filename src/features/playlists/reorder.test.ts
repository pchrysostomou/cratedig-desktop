import { describe, expect, it } from "vitest";
import { arrayMove } from "@dnd-kit/sortable";

// The playlist reorder relies on @dnd-kit's arrayMove for the new order it PUTs.
// The drag gesture itself isn't reliably testable in jsdom; this pins the primitive.
describe("playlist reorder (arrayMove)", () => {
  it("moves an item forward", () => {
    expect(arrayMove([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
  });
  it("moves an item backward", () => {
    expect(arrayMove([1, 2, 3], 2, 0)).toEqual([3, 1, 2]);
  });
});
